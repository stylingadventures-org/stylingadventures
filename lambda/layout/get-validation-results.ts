import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    console.log("[get-validation-results] Event:", JSON.stringify(event));

    const claims = event.requestContext.authorizer?.claims;
    const userId = claims?.sub;

    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ ok: false, error: "Not authenticated" }),
      };
    }

    const validationId = event.pathParameters?.validationId;

    if (validationId) {
      const result = await docClient.send(
        new QueryCommand({
          TableName: "LAYOUT_VALIDATIONS",
          IndexName: "validationId-index",
          KeyConditionExpression: "validationId = :id",
          ExpressionAttributeValues: {
            ":id": validationId,
          },
        })
      );

      const item = result.Items?.[0] as any;

      if (!item) {
        return {
          statusCode: 404,
          body: JSON.stringify({ ok: false, error: "Validation not found" }),
        };
      }

      if (item.userId !== userId && !claims?.[\"cognito:groups\"]?.includes("admin")) {
        return {
          statusCode: 403,
          body: JSON.stringify({
            ok: false,
            error: "Cannot view other users' validations",
          }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          validation: item,
        }),
      };
    }

    const userValidations = await docClient.send(
      new QueryCommand({
        TableName: "LAYOUT_VALIDATIONS",
        IndexName: "userId-created_at-index",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
        ScanIndexForward: false,
        Limit: 50,
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        validations: userValidations.Items || [],
        count: userValidations.Items?.length || 0,
      }),
    };
  } catch (error) {
    console.error("[get-validation-results] Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: "Failed to fetch validation results",
      }),
    };
  }
};
