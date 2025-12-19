/**
 * lambda/prime/tea-report-resolver.ts
 * 
 * Handles Tea Report queries and mutations:
 * - Generate daily/weekly/monthly Tea Reports
 * - Fetch report history
 * - Get character drama
 * - Track relationship status
 * - Admin management of reports and hot takes
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

interface TeaReport {
  id: string;
  reportId: string;
  generatedAt: string;
  period: "DAILY" | "WEEKLY" | "MONTHLY";
  headline: string;
  summary: string;
  teaItems: TeaItem[];
  dramaMeter: number;
  relationshipUpdates: RelationshipStatus[];
  hotTakes: HotTake[];
  viewCount: number;
  shareCount: number;
}

interface TeaItem {
  id: string;
  reportId: string;
  title: string;
  description: string;
  teaLevel: number;
  category: string;
  characters: string[];
  relatedEpisode?: string;
  relatedMusic?: string;
  timestamp: string;
}

interface RelationshipStatus {
  character1: string;
  character2: string;
  status: string;
  confidence: number;
  lastUpdated: string;
}

interface HotTake {
  id: string;
  author: string;
  content: string;
  sentiment: string;
  reactionCount: number;
  timestamp: string;
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function nowIso() {
  return new Date().toISOString();
}

function pkForTeaReport() {
  return "TEA#REPORT";
}

function skForTeaReport(reportId: string) {
  return `REPORT#${reportId}`;
}

function pkForRelationship() {
  return "TEA#RELATIONSHIP";
}

function skForRelationship(char1: string, char2: string) {
  return `REL#${[char1, char2].sort().join("#")}`;
}

const ddbMarshal = (value: any) =>
  marshall(value, { removeUndefinedValues: true });

// ────────────────────────────────────────────────────────────
// Queries
// ────────────────────────────────────────────────────────────

async function handleLatestTeaReport(identity: SAIdentity): Promise<TeaReport | null> {
  assertPrime(identity);

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk",
      ScanIndexForward: false,
      Limit: 1,
      ExpressionAttributeValues: ddbMarshal({
        ":pk": pkForTeaReport(),
      }),
    }),
  );

  const raw = (res.Items ?? [])[0];
  if (!raw) return null;

  return unmarshall(raw) as TeaReport;
}

async function handleTeaReportHistory(
  args: {
    period?: string;
    limit?: number;
    nextToken?: string;
  },
  identity: SAIdentity,
): Promise<{ items: TeaReport[]; nextToken: string | null }> {
  assertPrime(identity);

  const limit = Math.min(args.limit ?? 10, 50);

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: ddbMarshal({
        ":pk": pkForTeaReport(),
      }),
      ScanIndexForward: false,
      Limit: limit,
      ExclusiveStartKey: args.nextToken ? JSON.parse(Buffer.from(args.nextToken, "base64").toString()) : undefined,
    }),
  );

  const items = (res.Items ?? []).map((raw) => unmarshall(raw) as TeaReport);

  let nextToken = null;
  if (res.LastEvaluatedKey) {
    nextToken = Buffer.from(JSON.stringify(res.LastEvaluatedKey)).toString("base64");
  }

  return { items, nextToken };
}

async function handleCharacterDrama(
  args: { characterName: string },
  identity: SAIdentity,
): Promise<TeaItem[]> {
  assertPrime(identity);

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk",
      ScanIndexForward: false,
      ExpressionAttributeValues: ddbMarshal({
        ":pk": pkForTeaReport(),
      }),
    }),
  );

  const allReports = (res.Items ?? []).map((raw) => unmarshall(raw) as TeaReport);
  const allTeaItems = allReports.flatMap((report) => report.teaItems ?? []);

  return allTeaItems.filter((item) =>
    item.characters?.includes(args.characterName),
  );
}

async function handleRelationshipStatus(
  args: { character1: string; character2: string },
  identity: SAIdentity,
): Promise<RelationshipStatus | null> {
  assertPrime(identity);

  const res = await ddb.send(
    new GetItemCommand({
      TableName: TABLE_NAME,
      Key: ddbMarshal({
        pk: pkForRelationship(),
        sk: skForRelationship(args.character1, args.character2),
      }),
    }),
  );

  if (!res.Item) return null;
  return unmarshall(res.Item) as RelationshipStatus;
}

// ────────────────────────────────────────────────────────────
// Mutations (Admin only)
// ────────────────────────────────────────────────────────────

async function handleAdminGenerateTeaReport(
  args: {
    period: "DAILY" | "WEEKLY" | "MONTHLY";
    sourceEpisodes?: string[];
    sourceMusic?: string[];
  },
  identity: SAIdentity,
): Promise<TeaReport> {
  assertPrime(identity);
  if (!isAdmin(identity)) throw new Error("ADMIN required");

  const reportId = randomUUID();
  const now = nowIso();

  // Generate sample tea items and hot takes
  const teaItems: TeaItem[] = [
    {
      id: randomUUID(),
      reportId,
      title: "Lala x Crew Studio Sessions",
      description: "Behind-the-scenes tension during latest recording",
      teaLevel: 7,
      category: "BEHIND_THE_SCENES",
      characters: ["Lala", "CrewMember1"],
      timestamp: now,
    },
  ];

  const hotTakes: HotTake[] = [
    {
      id: randomUUID(),
      author: "Anonymous Fan",
      content: "The vibes this week were immaculate!",
      sentiment: "POSITIVE",
      reactionCount: 234,
      timestamp: now,
    },
  ];

  const report: TeaReport = {
    id: reportId,
    reportId,
    generatedAt: now,
    period: args.period,
    headline: `${args.period} Tea Report: Drama Meter 🍵`,
    summary: "Latest happenings in the Lala universe",
    teaItems,
    dramaMeter: 6,
    relationshipUpdates: [],
    hotTakes,
    viewCount: 0,
    shareCount: 0,
  };

  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: ddbMarshal({
        pk: pkForTeaReport(),
        sk: skForTeaReport(reportId),
        entityType: "TEA_REPORT",
        gsi1pk: `TEA#PERIOD#${args.period}`,
        gsi1sk: now,
        ...report,
      }),
    }),
  );

  return report;
}

async function handleAdminAddHotTake(
  args: {
    reportId: string;
    authorCharacter: string;
    content: string;
  },
  identity: SAIdentity,
): Promise<HotTake> {
  assertPrime(identity);
  if (!isAdmin(identity)) throw new Error("ADMIN required");

  const hotTake: HotTake = {
    id: randomUUID(),
    author: args.authorCharacter,
    content: args.content,
    sentiment: "NEUTRAL",
    reactionCount: 0,
    timestamp: nowIso(),
  };

  // Note: In production, would update report with new hot take
  // For now, returning the created hot take

  return hotTake;
}

async function handleAdminUpdateRelationshipStatus(
  args: {
    character1: string;
    character2: string;
    status: string;
  },
  identity: SAIdentity,
): Promise<RelationshipStatus> {
  assertPrime(identity);
  if (!isAdmin(identity)) throw new Error("ADMIN required");

  const now = nowIso();
  const relStatus: RelationshipStatus = {
    character1: args.character1,
    character2: args.character2,
    status: args.status,
    confidence: 0.85,
    lastUpdated: now,
  };

  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: ddbMarshal({
        pk: pkForRelationship(),
        sk: skForRelationship(args.character1, args.character2),
        entityType: "RELATIONSHIP",
        ...relStatus,
      }),
    }),
  );

  return relStatus;
}

// ────────────────────────────────────────────────────────────
// AppSync Lambda resolver entrypoint
// ────────────────────────────────────────────────────────────

export const handler = async (event: any) => {
  console.log("TeaReportResolverFn event", JSON.stringify(event));

  const fieldName = event.info?.fieldName as string | undefined;

  try {
    switch (fieldName) {
      case "latestTeaReport":
        return await handleLatestTeaReport(event.identity);

      case "teaReportHistory":
        return await handleTeaReportHistory(event.arguments || {}, event.identity);

      case "characterDrama":
        return await handleCharacterDrama(event.arguments, event.identity);

      case "relationshipStatus":
        return await handleRelationshipStatus(event.arguments, event.identity);

      case "adminGenerateTeaReport":
        return await handleAdminGenerateTeaReport(event.arguments, event.identity);

      case "adminAddHotTake":
        return await handleAdminAddHotTake(event.arguments, event.identity);

      case "adminUpdateRelationshipStatus":
        return await handleAdminUpdateRelationshipStatus(event.arguments, event.identity);

      default:
        throw new Error(`Unknown field: ${fieldName}`);
    }
  } catch (err: any) {
    console.error("TeaReportResolverFn error", err);
    throw err;
  }
};
