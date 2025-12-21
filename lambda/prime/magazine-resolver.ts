/**
 * lambda/prime/magazine-resolver.ts
 * 
 * Handles Prime Magazine queries and mutations:
 * - Get current/latest issue
 * - Browse magazine archive
 * - Retrieve articles and editorials
 * - Admin: Create issues, add articles, publish
 */

import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  UpdateItemCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { randomUUID } from "crypto";
import { AppSyncIdentityCognito } from "aws-lambda";

const ddb = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME!;

type SAIdentity = (AppSyncIdentityCognito & { groups?: string[] | null }) | null | undefined;

// ────────────────────────────────────────────────────────────
// Auth helpers
// ────────────────────────────────────────────────────────────

function assertAuth(identity: SAIdentity): asserts identity {
  if (!identity?.sub) throw new Error("Not authenticated");
}

function assertPrime(identity: SAIdentity): void {
  assertAuth(identity);
  const claims = (identity as any)?.claims || {};
  const raw = claims["cognito:groups"];
  const groups = Array.isArray(raw)
    ? raw
    : String(raw || "").split(",").map((g) => g.trim()).filter(Boolean);

  if (!groups.includes("PRIME") && !groups.includes("ADMIN")) {
    throw new Error("PRIME or ADMIN tier required");
  }
}

function isAdmin(identity: SAIdentity): boolean {
  const claims = (identity as any)?.claims || {};
  const raw = claims["cognito:groups"];
  const groups = Array.isArray(raw)
    ? raw
    : String(raw || "").split(",").map((g) => g.trim()).filter(Boolean);
  return groups.includes("ADMIN") || groups.includes("PRIME");
}

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface PrimeMagazine {
  id: string;
  issueNumber: number;
  title: string;
  theme: string;
  coverImageKey: string;
  coverStory: string;
  publishedAt: string;
  articles: Article[];
  exclusiveContent: ExclusiveFeature[];
  fashionEditorial?: FashionEditorial;
  musicFeature?: MusicFeature;
  viewCount: number;
  likeCount: number;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
}

interface Article {
  id: string;
  magazineId: string;
  title: string;
  author: string;
  category: string;
  content: string;
  featuredImages: string[];
  wordCount: number;
  readTime: number;
  createdAt: string;
}

interface ExclusiveFeature {
  id: string;
  magazineId: string;
  title: string;
  description: string;
  exclusivityLevel: string;
  viewsCount: number;
}

interface FashionEditorial {
  id: string;
  magazineId: string;
  title: string;
  photographyCredit: string;
  stylist: string;
}

interface MusicFeature {
  id: string;
  magazineId: string;
  title: string;
  featuredArtist: string;
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function nowIso() {
  return new Date().toISOString();
}

function pkForMagazine() {
  return "MAGAZINE#ISSUE";
}

function skForMagazine(issueNumber: number) {
  return `ISSUE#${issueNumber}`;
}

const ddbMarshal = (value: any) =>
  marshall(value, { removeUndefinedValues: true });

// ────────────────────────────────────────────────────────────
// Queries
// ────────────────────────────────────────────────────────────

async function handleCurrentPrimeMagazine(identity: SAIdentity): Promise<PrimeMagazine | null> {
  assertPrime(identity);

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk",
      FilterExpression: "#status = :published",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: ddbMarshal({
        ":pk": pkForMagazine(),
        ":published": "PUBLISHED",
      }),
      ScanIndexForward: false,
      Limit: 1,
    }),
  );

  const raw = (res.Items ?? [])[0];
  if (!raw) return null;

  return unmarshall(raw) as PrimeMagazine;
}

async function handlePrimeMagazineArchive(
  args: { limit?: number; nextToken?: string },
  identity: SAIdentity,
): Promise<{ items: PrimeMagazine[]; nextToken: string | null }> {
  assertPrime(identity);

  const limit = Math.min(args.limit ?? 12, 50);

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk",
      FilterExpression: "#status = :published",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: ddbMarshal({
        ":pk": pkForMagazine(),
        ":published": "PUBLISHED",
      }),
      ScanIndexForward: false,
      Limit: limit,
      ExclusiveStartKey: args.nextToken
        ? JSON.parse(Buffer.from(args.nextToken, "base64").toString())
        : undefined,
    }),
  );

  const items = (res.Items ?? []).map((raw) => unmarshall(raw) as PrimeMagazine);

  let nextToken = null;
  if (res.LastEvaluatedKey) {
    nextToken = Buffer.from(JSON.stringify(res.LastEvaluatedKey)).toString("base64");
  }

  return { items, nextToken };
}

async function handlePrimeMagazine(
  args: { issueNumber: number },
  identity: SAIdentity,
): Promise<PrimeMagazine | null> {
  assertPrime(identity);

  const res = await ddb.send(
    new GetItemCommand({
      TableName: TABLE_NAME,
      Key: ddbMarshal({
        pk: pkForMagazine(),
        sk: skForMagazine(args.issueNumber),
      }),
    }),
  );

  if (!res.Item) return null;
  return unmarshall(res.Item) as PrimeMagazine;
}

async function handleMagazineArticles(
  args: { magazineId: string; category?: string },
  identity: SAIdentity,
): Promise<Article[]> {
  assertPrime(identity);

  // In production, would query articles by magazineId
  // For now returning empty array as placeholder
  return [];
}

// ────────────────────────────────────────────────────────────
// Mutations (Admin only)
// ────────────────────────────────────────────────────────────

async function handleAdminCreateMagazineIssue(
  args: {
    issueNumber: number;
    title: string;
    theme: string;
    coverImageKey: string;
  },
  identity: SAIdentity,
): Promise<PrimeMagazine> {
  assertPrime(identity);
  if (!isAdmin(identity)) throw new Error("ADMIN required");

  const magazineId = randomUUID();
  const now = nowIso();

  const magazine: PrimeMagazine = {
    id: magazineId,
    issueNumber: args.issueNumber,
    title: args.title,
    theme: args.theme,
    coverImageKey: args.coverImageKey,
    coverStory: "",
    publishedAt: now,
    articles: [],
    exclusiveContent: [],
    viewCount: 0,
    likeCount: 0,
    status: "DRAFT",
  };

  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: ddbMarshal({
        pk: pkForMagazine(),
        sk: skForMagazine(args.issueNumber),
        entityType: "MAGAZINE",
        gsi1pk: "MAGAZINE#STATUS#DRAFT",
        gsi1sk: now,
        ...magazine,
      }),
    }),
  );

  return magazine;
}

async function handleAdminAddArticle(
  args: {
    magazineId: string;
    title: string;
    author: string;
    category: string;
    content: string;
  },
  identity: SAIdentity,
): Promise<Article> {
  assertPrime(identity);
  if (!isAdmin(identity)) throw new Error("ADMIN required");

  const article: Article = {
    id: randomUUID(),
    magazineId: args.magazineId,
    title: args.title,
    author: args.author,
    category: args.category,
    content: args.content,
    featuredImages: [],
    wordCount: args.content.split(" ").length,
    readTime: Math.ceil(args.content.split(" ").length / 200),
    createdAt: nowIso(),
  };

  return article;
}

async function handleAdminCreateFashionEditorial(
  args: {
    magazineId: string;
    title: string;
    photographyCredit: string;
    stylist: string;
  },
  identity: SAIdentity,
): Promise<FashionEditorial> {
  assertPrime(identity);
  if (!isAdmin(identity)) throw new Error("ADMIN required");

  const editorial: FashionEditorial = {
    id: randomUUID(),
    magazineId: args.magazineId,
    title: args.title,
    photographyCredit: args.photographyCredit,
    stylist: args.stylist,
  };

  return editorial;
}

async function handleAdminPublishMagazine(
  args: { magazineId: string },
  identity: SAIdentity,
): Promise<PrimeMagazine> {
  assertPrime(identity);
  if (!isAdmin(identity)) throw new Error("ADMIN required");

  // In production, would find by magazineId and update status
  // For now returning placeholder
  return {
    id: args.magazineId,
    issueNumber: 1,
    title: "Issue",
    theme: "Theme",
    coverImageKey: "",
    coverStory: "",
    publishedAt: nowIso(),
    articles: [],
    exclusiveContent: [],
    viewCount: 0,
    likeCount: 0,
    status: "PUBLISHED",
  };
}

// ────────────────────────────────────────────────────────────
// AppSync Lambda resolver entrypoint
// ────────────────────────────────────────────────────────────

export const handler = async (event: any) => {
  console.log("MagazineResolverFn event", JSON.stringify(event));

  const fieldName = event.info?.fieldName as string | undefined;

  try {
    switch (fieldName) {
      case "currentPrimeMagazine":
        return await handleCurrentPrimeMagazine(event.identity);

      case "primeMagazineArchive":
        return await handlePrimeMagazineArchive(event.arguments || {}, event.identity);

      case "primeMagazine":
        return await handlePrimeMagazine(event.arguments, event.identity);

      case "magazineArticles":
        return await handleMagazineArticles(event.arguments, event.identity);

      case "adminCreateMagazineIssue":
        return await handleAdminCreateMagazineIssue(event.arguments, event.identity);

      case "adminAddArticle":
        return await handleAdminAddArticle(event.arguments, event.identity);

      case "adminCreateFashionEditorial":
        return await handleAdminCreateFashionEditorial(event.arguments, event.identity);

      case "adminPublishMagazine":
        return await handleAdminPublishMagazine(event.arguments, event.identity);

      default:
        throw new Error(`Unknown field: ${fieldName}`);
    }
  } catch (err: any) {
    console.error("MagazineResolverFn error", err);
    throw err;
  }
};
