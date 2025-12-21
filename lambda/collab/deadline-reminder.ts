import { EventBridgeEvent } from "aws-lambda";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({});

const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || "";

export const handler = async (event: EventBridgeEvent<any, any>) => {
  try {
    console.log("[deadline-reminder] Running scheduled check");

    const now = Date.now();
    const threeDay = now + 3 * 24 * 60 * 60 * 1000;
    const oneDay = now + 1 * 24 * 60 * 60 * 1000;

    const response = await docClient.send(
      new QueryCommand({
        TableName: "COLLABORATIONS",
        IndexName: "status-index",
        KeyConditionExpression: "#status = :status",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": "ACTIVE",
        },
      })
    );

    const collaborations = response.Items || [];
    let reminders_sent = 0;

    for (const collab of collaborations) {
      const deliveryDeadline = collab.addendum?.deadlines?.deliveryDate || 0;

      if (deliveryDeadline <= 0) continue;

      let reminderType = "";

      if (deliveryDeadline <= oneDay && deliveryDeadline > now) {
        reminderType = "1-day";
      } else if (deliveryDeadline <= threeDay && deliveryDeadline > oneDay) {
        reminderType = "3-day";
      } else if (deliveryDeadline <= now) {
        reminderType = "overdue";
      }

      if (!reminderType) continue;

      await snsClient.send(
        new PublishCommand({
          TopicArn: SNS_TOPIC_ARN,
          Subject: `Collaboration Deadline Reminder: ${reminderType}`,
          Message: `Your collaboration ${collab.collabId} has an upcoming deadline on ${new Date(deliveryDeadline).toISOString()}`,
          MessageAttributes: {
            collabId: { DataType: "String", StringValue: collab.collabId },
            reminderType: { DataType: "String", StringValue: reminderType },
            inviterId: { DataType: "String", StringValue: collab.inviterId },
            inviteeId: { DataType: "String", StringValue: collab.inviteeId },
          },
        })
      );

      await docClient.send(
        new UpdateCommand({
          TableName: "COLLABORATIONS",
          Key: { collabId: collab.collabId },
          UpdateExpression: "SET reminder_sent_at = :now, last_reminder_type = :type",
          ExpressionAttributeValues: {
            ":now": now,
            ":type": reminderType,
          },
        })
      );

      reminders_sent++;
    }

    console.log(`[deadline-reminder] Sent ${reminders_sent} reminders`);

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, reminders_sent }),
    };
  } catch (error) {
    console.error("[deadline-reminder] Error:", error);
    throw error;
  }
};