// lambda/prime/script-review.ts

/**
 * Script Review Lambda (Prime Studios)
 *
 * This is a minimal stub that can be called from:
 * - API Gateway / AppSync resolvers
 * - Step Functions (script review step in the episode pipeline)
 *
 * It:
 *  - Accepts a script payload + review action
 *  - Returns a "review record" with status + timestamps
 *  - Does NOT persist anything yet (purely in-memory stub)
 *
 * You can later:
 *  - Write records into DynamoDB (TABLE_NAME env var)
 *  - Attach to S3 for versioned script storage
 *  - Enforce admin/studio-only access via caller identity
 */

export type ReviewAction = "REQUEST_REVIEW" | "APPROVE" | "REVISE" | "REJECT";

export interface ScriptReviewInput {
  episodeId: string;
  versionId?: string; // optional, auto-generated if missing

  // Raw script text, or a JSON representation of episode flow
  scriptText?: string;
  scriptJson?: unknown;

  // Who is performing the action
  reviewer?: {
    userId?: string;
    displayName?: string;
    role?: string; // e.g. "ADMIN", "STUDIO", "WRITER"
  };

  action: ReviewAction;

  // Optional note / reason (e.g. "tighten pacing in scene 3")
  note?: string;
}

export interface ScriptReviewRecord {
  episodeId: string;
  versionId: string;

  status: "PENDING_REVIEW" | "APPROVED" | "REVISION_REQUESTED" | "REJECTED";

  scriptText?: string;
  scriptJson?: unknown;

  reviewer?: ScriptReviewInput["reviewer"];

  note?: string;

  createdAt: string;
  updatedAt: string;

  // For later evolution – attach to storage keys, etc.
  archiveKey?: string;
}

function mapActionToStatus(action: ReviewAction): ScriptReviewRecord["status"] {
  switch (action) {
    case "REQUEST_REVIEW":
      return "PENDING_REVIEW";
    case "APPROVE":
      return "APPROVED";
    case "REVISE":
      return "REVISION_REQUESTED";
    case "REJECT":
      return "REJECTED";
    default:
      return "PENDING_REVIEW";
  }
}

export const handler = async (
  event: ScriptReviewInput,
): Promise<ScriptReviewRecord> => {
  const now = new Date().toISOString();

  if (!event.episodeId) {
    throw new Error("Missing required field: episodeId");
  }

  const versionId =
    event.versionId ?? `v-${Math.random().toString(36).slice(2, 10)}`;

  const status = mapActionToStatus(event.action);

  const record: ScriptReviewRecord = {
    episodeId: event.episodeId,
    versionId,
    status,
    scriptText: event.scriptText,
    scriptJson: event.scriptJson,
    reviewer: event.reviewer,
    note: event.note,
    createdAt: now,
    updatedAt: now,
    // archiveKey: you can later set this when you push scripts to S3
  };

  console.log("ScriptReview event:", JSON.stringify(event, null, 2));
  console.log("ScriptReview record:", JSON.stringify(record, null, 2));

  // 🔜 Future enhancement:
  // If you want to persist reviews, you can:
  //  - read process.env.TABLE_NAME
  //  - use DynamoDB client to putItem
  //  - or write scriptText/scriptJson to S3 and set archiveKey

  return record;
};
