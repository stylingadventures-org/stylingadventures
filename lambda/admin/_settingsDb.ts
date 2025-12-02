import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({});

const {
  TABLE_NAME = "",
  PK_NAME = "pk",
  SK_NAME = "sk",
} = process.env;

const SETTINGS_PK = "SETTINGS";
const SETTINGS_SK = "GLOBAL";

export async function loadSettingsFromDb(): Promise<Record<string, any> | null> {
  if (!TABLE_NAME) throw new Error("TABLE_NAME not set for settings DB helper");

  const res = await client.send(
    new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({
        [PK_NAME]: SETTINGS_PK,
        [SK_NAME]: SETTINGS_SK,
      }),
    }),
  );

  return res.Item ? (unmarshall(res.Item) as Record<string, any>) : null;
}

export async function saveSettingsToDb(
  settings: Record<string, any>,
): Promise<void> {
  if (!TABLE_NAME) throw new Error("TABLE_NAME not set for settings DB helper");

  await client.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall({
        [PK_NAME]: SETTINGS_PK,
        [SK_NAME]: SETTINGS_SK,
        ...settings,
      }),
    }),
  );
}
