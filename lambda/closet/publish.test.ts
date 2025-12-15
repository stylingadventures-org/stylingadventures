import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

const ddbMock = mockClient(DynamoDBDocumentClient);
const ebMock = mockClient(EventBridgeClient);

describe("publish handler", () => {
  beforeEach(() => {
    ddbMock.reset();
    ebMock.reset();
    process.env.TABLE_NAME = "sa-dev-app";
    process.env.PK_NAME = "pk";
    process.env.SK_NAME = "sk";
  });

  it("returns NO_ID when missing approvalId", async () => {
    const { handler } = await import("./publish");
    const res = await handler({});
    expect(res).toEqual({ ok: false, status: "NO_ID" });
  });

  it("publishes when APPROVED", async () => {
    ddbMock.on(UpdateCommand).resolves({});
    ebMock.on(PutEventsCommand).resolves({ FailedEntryCount: 0, Entries: [] });

    const { handler } = await import("./publish");

    const res = await handler({
      item: { id: "abc", s3Key: "closet/x.jpg" },
      segmentation: { outputKey: "closet/processed/x.png" },
    });

    expect(res.ok).toBe(true);
    expect(res.status).toBe("PUBLISHED");

    expect(ddbMock.commandCalls(UpdateCommand).length).toBe(1);
    expect(ebMock.commandCalls(PutEventsCommand).length).toBe(1);
  });

  it("returns NOT_APPROVED on conditional failure", async () => {
    ddbMock.on(UpdateCommand).rejects(Object.assign(new Error("cond"), { name: "ConditionalCheckFailedException" }));

    const { handler } = await import("./publish");

    const res = await handler({ item: { id: "abc", s3Key: "closet/x.jpg" } });
    expect(res.ok).toBe(false);
    expect(res.status).toBe("NOT_APPROVED");
  });
});
