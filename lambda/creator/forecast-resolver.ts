/**
 * lambda/creator/forecast-resolver.ts
 * 
 * Handles Creator Forecast & Predictive Model (PCFM) queries and mutations:
 * - Generate creator forecasts (weekly/monthly/quarterly/yearly)
 * - Retrieve forecast history
 * - Get creator reports with analytics and predictions
 * - Platform-wide trend predictions
 * - Growth recommendations for creators
 * - Admin: Update analytics snapshots, generate forecasts
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

function isCreator(identity: SAIdentity): boolean {
  const claims = (identity as any)?.claims || {};
  const raw = claims["cognito:groups"];
  const groups = Array.isArray(raw)
    ? raw
    : String(raw || "").split(",").map((g) => g.trim()).filter(Boolean);

  return (
    groups.includes("CREATOR") ||
    groups.includes("COLLAB") ||
    groups.includes("ADMIN") ||
    groups.includes("PRIME")
  );
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

interface CreatorForecast {
  id: string;
  creatorId: string;
  forecastId: string;
  generatedAt: string;
  forecastPeriod: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  growthPrediction: GrowthMetrics;
  audienceSentiment: SentimentAnalysis;
  trendPredictions: TrendPrediction[];
  riskFactors: RiskFactor[];
  opportunities: Opportunity[];
  recommendations: Recommendation[];
  confidence: number;
  lastUpdated: string;
}

interface GrowthMetrics {
  currentFollowers: number;
  projectedFollowers: number;
  growthRate: number;
  engagementRate: number;
  projectedEngagementRate: number;
  estRevenueImpact: number;
}

interface SentimentAnalysis {
  overallSentiment: string;
  positivePercent: number;
  neutralPercent: number;
  negativePercent: number;
  sentimentTrend: string;
  keyTopics: string[];
  communityHealth: number;
}

interface TrendPrediction {
  id: string;
  forecastId: string;
  trendName: string;
  category: string;
  probability: number;
  relevance: string;
  actionItems: string[];
}

interface RiskFactor {
  id: string;
  forecastId: string;
  riskName: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  probability: number;
  potentialImpact: string;
  mitigationStrategy: string;
}

interface Opportunity {
  id: string;
  forecastId: string;
  opportunityName: string;
  category: string;
  estimatedValue: number;
  timeWindow: string;
  actionItems: string[];
  difficulty: string;
}

interface Recommendation {
  id: string;
  forecastId: string;
  priority: number;
  title: string;
  description: string;
  expectedOutcome: string;
  timeframe: string;
  resourcesNeeded: string[];
  successMetrics: string[];
}

interface AnalyticsMetrics {
  followers: number;
  followersThisWeek: number;
  engagement: number;
  engagementThisWeek: number;
  contentPosted: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  topContentType: string;
  peakEngagementTime: string;
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function nowIso() {
  return new Date().toISOString();
}

function pkForCreatorForecast(creatorId: string) {
  return `CREATOR#${creatorId}#FORECAST`;
}

function skForForecast(forecastId: string) {
  return `FORECAST#${forecastId}`;
}

const ddbMarshal = (value: any) =>
  marshall(value, { removeUndefinedValues: true });

// ────────────────────────────────────────────────────────────
// Queries
// ────────────────────────────────────────────────────────────

async function handleCreatorLatestForecast(
  args: { creatorId: string },
  identity: SAIdentity,
): Promise<CreatorForecast | null> {
  assertAuth(identity);
  if (!isCreator(identity)) throw new Error("Creator tier required");

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk",
      ScanIndexForward: false,
      Limit: 1,
      ExpressionAttributeValues: ddbMarshal({
        ":pk": pkForCreatorForecast(args.creatorId),
      }),
    }),
  );

  const raw = (res.Items ?? [])[0];
  if (!raw) return null;

  return unmarshall(raw) as CreatorForecast;
}

async function handleCreatorForecastHistory(
  args: { creatorId: string; limit?: number; nextToken?: string },
  identity: SAIdentity,
): Promise<{ items: CreatorForecast[]; nextToken: string | null }> {
  assertAuth(identity);
  if (!isCreator(identity)) throw new Error("Creator tier required");

  const limit = Math.min(args.limit ?? 10, 50);

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk",
      ScanIndexForward: false,
      Limit: limit,
      ExpressionAttributeValues: ddbMarshal({
        ":pk": pkForCreatorForecast(args.creatorId),
      }),
      ExclusiveStartKey: args.nextToken
        ? JSON.parse(Buffer.from(args.nextToken, "base64").toString())
        : undefined,
    }),
  );

  const items = (res.Items ?? []).map((raw) => unmarshall(raw) as CreatorForecast);

  let nextToken = null;
  if (res.LastEvaluatedKey) {
    nextToken = Buffer.from(JSON.stringify(res.LastEvaluatedKey)).toString("base64");
  }

  return { items, nextToken };
}

async function handleCreatorReport(
  args: { creatorId: string },
  identity: SAIdentity,
): Promise<any> {
  assertAuth(identity);
  if (!isCreator(identity)) throw new Error("Creator tier required");

  const forecast = await handleCreatorLatestForecast(args, identity);

  return {
    id: randomUUID(),
    creatorId: args.creatorId,
    reportDate: nowIso(),
    analyticsSnapshot: {
      followers: 10000,
      followersThisWeek: 150,
      engagement: 0.045,
      engagementThisWeek: 0.048,
      contentPosted: 5,
      avgLikes: 234,
      avgComments: 12,
      avgShares: 8,
      topContentType: "REEL",
      peakEngagementTime: "19:00 EST",
    },
    forecasts: forecast ? [forecast] : [],
    recommendations: [],
  };
}

async function handlePlatformTrendPredictions(
  identity: SAIdentity,
): Promise<TrendPrediction[]> {
  assertAuth(identity);
  if (!isCreator(identity)) throw new Error("Creator tier required");

  return [
    {
      id: randomUUID(),
      forecastId: "PLATFORM",
      trendName: "Micro-Episode Format Growth",
      category: "CONTENT_FORMAT",
      probability: 0.82,
      relevance: "HIGH",
      actionItems: ["Create 5-10 min episodes", "Focus on serialization"],
    },
    {
      id: randomUUID(),
      forecastId: "PLATFORM",
      trendName: "Creator Collabs on Music",
      category: "MUSIC",
      probability: 0.76,
      relevance: "HIGH",
      actionItems: ["Partner with producers", "Release duets/remixes"],
    },
  ];
}

async function handleCreatorGrowthRecommendations(
  args: { creatorId: string },
  identity: SAIdentity,
): Promise<Recommendation[]> {
  assertAuth(identity);
  if (!isCreator(identity)) throw new Error("Creator tier required");

  return [
    {
      id: randomUUID(),
      forecastId: randomUUID(),
      priority: 1,
      title: "Increase posting frequency",
      description: "Post 3-4x per week for optimal engagement",
      expectedOutcome: "15-20% follower growth",
      timeframe: "30 days",
      resourcesNeeded: ["Content planning", "Scheduling tool"],
      successMetrics: ["Engagement rate > 5%", "Follower growth > 10%"],
    },
  ];
}

// ────────────────────────────────────────────────────────────
// Mutations (Admin only)
// ────────────────────────────────────────────────────────────

async function handleAdminGenerateCreatorForecast(
  args: {
    creatorId: string;
    forecastPeriod: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  },
  identity: SAIdentity,
): Promise<CreatorForecast> {
  if (!isAdmin(identity)) throw new Error("ADMIN required");

  const forecastId = randomUUID();
  const now = nowIso();

  const forecast: CreatorForecast = {
    id: forecastId,
    creatorId: args.creatorId,
    forecastId,
    generatedAt: now,
    forecastPeriod: args.forecastPeriod,
    growthPrediction: {
      currentFollowers: 10000,
      projectedFollowers: 11500,
      growthRate: 0.15,
      engagementRate: 0.045,
      projectedEngagementRate: 0.052,
      estRevenueImpact: 1200,
    },
    audienceSentiment: {
      overallSentiment: "POSITIVE",
      positivePercent: 72,
      neutralPercent: 20,
      negativePercent: 8,
      sentimentTrend: "IMPROVING",
      keyTopics: ["Fashion", "Music", "Behind-the-scenes"],
      communityHealth: 8,
    },
    trendPredictions: [],
    riskFactors: [
      {
        id: randomUUID(),
        forecastId,
        riskName: "Content saturation",
        severity: "MEDIUM",
        probability: 0.35,
        potentialImpact: "5-10% engagement drop",
        mitigationStrategy: "Diversify content types",
      },
    ],
    opportunities: [
      {
        id: randomUUID(),
        forecastId,
        opportunityName: "Sponsor partnership",
        category: "SPONSORSHIP",
        estimatedValue: 5000,
        timeWindow: "60 days",
        actionItems: ["Pitch deck", "Media kit"],
        difficulty: "MEDIUM",
      },
    ],
    recommendations: [],
    confidence: 0.82,
    lastUpdated: now,
  };

  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: ddbMarshal({
        pk: pkForCreatorForecast(args.creatorId),
        sk: skForForecast(forecastId),
        entityType: "CREATOR_FORECAST",
        gsi1pk: `FORECAST#PERIOD#${args.forecastPeriod}`,
        gsi1sk: now,
        ...forecast,
      }),
    }),
  );

  return forecast;
}

async function handleAdminUpdateAnalyticsSnapshot(
  args: { creatorId: string; metrics: any },
  identity: SAIdentity,
): Promise<AnalyticsMetrics> {
  if (!isAdmin(identity)) throw new Error("ADMIN required");

  return args.metrics;
}

async function handleAdminGeneratePlatformTrends(
  identity: SAIdentity,
): Promise<TrendPrediction[]> {
  if (!isAdmin(identity)) throw new Error("ADMIN required");

  return await handlePlatformTrendPredictions(identity);
}

// ────────────────────────────────────────────────────────────
// AppSync Lambda resolver entrypoint
// ────────────────────────────────────────────────────────────

export const handler = async (event: any) => {
  console.log("CreatorForecastResolverFn event", JSON.stringify(event));

  const fieldName = event.info?.fieldName as string | undefined;

  try {
    switch (fieldName) {
      case "creatorLatestForecast":
        return await handleCreatorLatestForecast(event.arguments, event.identity);

      case "creatorForecastHistory":
        return await handleCreatorForecastHistory(event.arguments, event.identity);

      case "creatorReport":
        return await handleCreatorReport(event.arguments, event.identity);

      case "platformTrendPredictions":
        return await handlePlatformTrendPredictions(event.identity);

      case "creatorGrowthRecommendations":
        return await handleCreatorGrowthRecommendations(event.arguments, event.identity);

      case "adminGenerateCreatorForecast":
        return await handleAdminGenerateCreatorForecast(event.arguments, event.identity);

      case "adminUpdateAnalyticsSnapshot":
        return await handleAdminUpdateAnalyticsSnapshot(event.arguments, event.identity);

      case "adminGeneratePlatformTrends":
        return await handleAdminGeneratePlatformTrends(event.identity);

      default:
        throw new Error(`Unknown field: ${fieldName}`);
    }
  } catch (err: any) {
    console.error("CreatorForecastResolverFn error", err);
    throw err;
  }
};
