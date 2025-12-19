import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

import { handler } from "./publish";

const ddbMock = mockClient(DynamoDBDocumentClient);
const ebMock = mockClient(EventBridgeClient);

describe("publish handler", () => {
  beforeEach(() => {
    ddbMock.reset();
    ebMock.reset();

    process.env.TABLE_NAME = "TestTable";
    process.env.PK_NAME = "pk";
    process.env.SK_NAME = "sk";

    ebMock.on(PutEventsCommand).resolves({ Entries: [] });
  });

  it("returns NO_ID when missing approvalId", async () => {
    const res = await handler({});
    expect(res.ok).toBe(false);
    expect(res.status).toBe("NO_ID");
  });

  it("publishes when APPROVED", async () => {
    ddbMock.on(GetCommand).resolves({
      Item: { pk: "ITEM#abc", sk: "META", status: "APPROVED" },
    });

    ddbMock.on(UpdateCommand).resolves({});

    const res = await handler({
      item: { id: "abc", s3Key: "closet/x.jpg" },
      segmentation: { outputKey: "closet/processed/x.png" },
    });

    expect(res.ok).toBe(true);
    expect(res.status).toBe("PUBLISHED");

    expect(ddbMock.commandCalls(GetCommand).length).toBe(1);
    expect(ddbMock.commandCalls(UpdateCommand).length).toBe(1);
  });

  it("returns NOT_APPROVED when current status is not APPROVED", async () => {
    ddbMock.on(GetCommand).resolves({
      Item: { pk: "ITEM#abc", sk: "META", status: "PENDING" },
    });

    const res = await handler({ item: { id: "abc", s3Key: "closet/x.jpg" } });

    expect(res.ok).toBe(false);
    expect(res.status).toBe("NOT_APPROVED");
    expect(ddbMock.commandCalls(UpdateCommand).length).toBe(0);
  });

  it("returns RACE_LOST on conditional failure when reread is not PUBLISHED", async () => {
    ddbMock
      .on(GetCommand)
      .resolvesOnce({ Item: { pk: "ITEM#abc", sk: "META", status: "APPROVED" } })
      .resolvesOnce({ Item: { pk: "ITEM#abc", sk: "META", status: "REJECTED" } });

    ddbMock
      .on(UpdateCommand)
      .rejects(Object.assign(new Error("boom"), { name: "ConditionalCheckFailedException" }));

    const res = await handler({ item: { id: "abc", s3Key: "closet/x.jpg" } });

    expect(res.ok).toBe(false);
    expect(res.status).toBe("RACE_LOST");
    expect(res.currentStatus).toBe("REJECTED");
  });
});
