// lambda/prime/episode-components.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { assertInternalUser } from "./utils/auth";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;
const ADMIN_GROUP_NAME = process.env.ADMIN_GROUP_NAME ?? "admin";
const CREATOR_GROUP_NAME = process.env.CREATOR_GROUP_NAME ?? "creator";

export const handler = async (event: any) => {
  // Expect to be called via AppSync or StepFunctions with identity context
  const identity = event.identity ?? event.requestContext?.identity;
  assertInternalUser(identity, [ADMIN_GROUP_NAME, CREATOR_GROUP_NAME]);

  const episodeId = event.episodeId ?? `ep_${Date.now()}`;

  // TODO: generate modular parts; for now just stub a record
  const pk = `EPISODE#${episodeId}`;
  const sk = `COMPONENTS#v1`;

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk,
        sk,
        type: "episode-components",
        episodeId,
        components: {
          invite: {},
          envelope: {},
          closet: {},
          outfit: {},
          dialogue: [],
          sideQuests: [],
          coins: {},
          locations: [],
          photoshoots: [],
        },
        createdAt: new Date().toISOString(),
      },
    }),
  );

  return {
    episodeId,
    pk,
    sk,
  };
};
