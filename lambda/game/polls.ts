// lambda/game/polls.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand
} from "@aws-sdk/lib-dynamodb";
import { AppSyncIdentityCognito } from "aws-lambda";
import { TABLE_NAME } from "../_shared/env";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

export const handler = async (event: any) => {
  const id = event.identity as AppSyncIdentityCognito | undefined;
  const fn = event.info?.fieldName as string;

  if (fn === "createPoll") {
    if (!id?.sub) throw new Error("Unauthorized");
    const { question, options } = event.arguments.input as { question: string; options: string[] };
    const pollId = String(Date.now());
    const createdAt = new Date().toISOString();

    // Store options/totals as native arrays; add a simple listing index on gsi2
    await ddb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `POLL#${pollId}`,
        sk: "META",
        gsi2pk: "POLL",
        gsi2sk: `CREATED#${pollId}`,
        question,
        options,
        totals: new Array(options.length).fill(0),
        createdBy: id.username || id.sub,
        createdAt,
      },
      ConditionExpression: "attribute_not_exists(pk)",
    }));

    return { pollId, question, options, totals: new Array(options.length).fill(0), createdBy: id.username || id.sub, createdAt };
  }

  if (fn === "votePoll") {
    if (!id?.sub) throw new Error("Unauthorized");
    const { pollId, optionIndex } = event.arguments as { pollId: string; optionIndex: number };

    // Idempotent vote per user+option
    await ddb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `POLL#${pollId}`,
        sk: `VOTE#${optionIndex}#${id.sub}`,
        gsi2pk: `POLL#${pollId}`,
        gsi2sk: `VOTE#${optionIndex}#${id.sub}`,
        userId: id.sub,
        at: new Date().toISOString(),
      },
      ConditionExpression: "attribute_not_exists(pk)",
    })).catch((err) => {
      if (!String(err).includes("ConditionalCheckFailed")) throw err;
    });

    // Read META (options length)
    const meta = await ddb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { pk: `POLL#${pollId}`, sk: "META" },
    }));
    const opts: string[] = (meta.Item?.options ?? []) as string[];

    // Tally each option by querying the votes prefix on gsi2 (lowercase!)
    const totals: number[] = [];
    for (let i = 0; i < opts.length; i++) {
      const q = await ddb.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "gsi2", // ✅ correct lowercase
        KeyConditionExpression: "#pk = :p AND begins_with(#sk, :pref)",
        ExpressionAttributeNames: { "#pk": "gsi2pk", "#sk": "gsi2sk" },
        ExpressionAttributeValues: { ":p": `POLL#${pollId}`, ":pref": `VOTE#${i}#` },
        Select: "COUNT",
      }));
      totals.push(q.Count ?? 0);
    }

    // Persist updated totals on META
    const upd = await ddb.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pk: `POLL#${pollId}`, sk: "META" },
      UpdateExpression: "SET totals = :t",
      ExpressionAttributeValues: { ":t": totals },
      ReturnValues: "ALL_NEW",
    }));

    return {
      pollId,
      question: upd.Attributes?.question,
      options: upd.Attributes?.options,
      totals: upd.Attributes?.totals,
      createdBy: upd.Attributes?.createdBy,
      createdAt: upd.Attributes?.createdAt,
    };
  }

  if (fn === "getPoll") {
    const { pollId } = event.arguments as { pollId: string };
    const r = await ddb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { pk: `POLL#${pollId}`, sk: "META" },
    }));
    if (!r.Item) return null;
    return {
      pollId,
      question: r.Item.question,
      options: r.Item.options ?? [],
      totals: r.Item.totals ?? [],
      createdBy: r.Item.createdBy,
      createdAt: r.Item.createdAt,
    };
  }

  throw new Error("Unknown field");
};
