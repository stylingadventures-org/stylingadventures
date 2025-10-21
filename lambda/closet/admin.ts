// lambda/closet/admin.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  UpdateCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import type { AppSyncResolverEvent, AppSyncIdentityCognito } from "aws-lambda";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.CLOSET_TABLE!;

// Optional: if you keep a GSI on status (recommended)
const STATUS_GSI = process.env.STATUS_GSI || "gsi1"; // partitionKey: status, sortKey: createdAt

type ClosetStatus = "PENDING" | "APPROVED" | "REJECTED" | "PUBLISHED";

function now() { return new Date().toISOString(); }
function isPrivileged(id?: AppSyncIdentityCognito) {
  const groups = (id as any)?.claims?.["cognito:groups"] || [];
  return Array.isArray(groups) && (groups.includes("ADMIN") || groups.includes("COLLAB"));
}

export const handler = async (event: AppSyncResolverEvent<any>) => {
  const field = event.info.fieldName;
  const ident = event.identity as AppSyncIdentityCognito | undefined;

  if (field === "adminListPending") {
    // Prefer GSI for status to avoid scanning
    if (STATUS_GSI) {
      const out = await ddb.send(new QueryCommand({
        TableName: TABLE,
        IndexName: STATUS_GSI,
        KeyConditionExpression: "#s = :p",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":p": "PENDING" },
        ScanIndexForward: true, // oldest first
        Limit: 50,
      }));
      return out.Items ?? [];
    }
    // Fallback: very small tables only — otherwise add a GSI
    throw new Error("Missing GSI for status; set STATUS_GSI or create one.");
  }

  if (field === "adminApproveItem") {
    if (!isPrivileged(ident)) throw new Error("Not authorized");
    const id = event.arguments?.id as string;
    if (!id) throw new Error("id is required");

    const current = await ddb.send(new GetCommand({ TableName: TABLE, Key: { id } }));
    if (!current.Item) throw new Error("Item not found");

    const out = await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { id },
      UpdateExpression: "SET #st = :a, #u = :u REMOVE #r",
      ExpressionAttributeNames: { "#st": "status", "#u": "updatedAt", "#r": "reason" },
      ExpressionAttributeValues: { ":a": "APPROVED", ":u": now() },
      ReturnValues: "ALL_NEW",
      ConditionExpression: "#st = :p", // only from PENDING
      ExpressionAttributeValuesAdditional: undefined as any, // TS quirk
    } as any)); // narrow typing workaround for lib
    return out.Attributes;
  }

  if (field === "adminRejectItem") {
    if (!isPrivileged(ident)) throw new Error("Not authorized");
    const id = event.arguments?.id as string;
    const reason = (event.arguments?.reason as string | undefined) ?? null;
    if (!id) throw new Error("id is required");

    const current = await ddb.send(new GetCommand({ TableName: TABLE, Key: { id } }));
    if (!current.Item) throw new Error("Item not found");

    const out = await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { id },
      UpdateExpression: "SET #st = :r, #u = :u, #rsn = :reason",
      ExpressionAttributeNames: { "#st": "status", "#u": "updatedAt", "#rsn": "reason" },
      ExpressionAttributeValues: { ":r": "REJECTED", ":u": now(), ":reason": reason },
      ReturnValues: "ALL_NEW",
      ConditionExpression: "#st = :p",
      ExpressionAttributeValuesAdditional: undefined as any,
    } as any));
    return out.Attributes;
  }

  throw new Error(`Unhandled field: ${field}`);
};
