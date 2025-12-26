// lambda/appsync/schema-waiter.ts
import type {
  CloudFormationCustomResourceEvent,
  CloudFormationCustomResourceHandler,
} from "aws-lambda";
import {
  AppSyncClient,
  GetSchemaCreationStatusCommand,
  GetIntrospectionSchemaCommand,
} from "@aws-sdk/client-appsync";

/**
 * Waits until AppSync schema is ACTIVE (SUCCESS)
 * and the expected field is present in the introspection SDL.
 *
 * This avoids the CFN race: Schema UPDATE_COMPLETE but resolver CREATE hits 404.
 */
const client = new AppSyncClient({});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getSchemaStatus(apiId: string) {
  const out = await client.send(new GetSchemaCreationStatusCommand({ apiId }));
  return out.status; // SUCCESS | PROCESSING | FAILED | NOT_APPLICABLE
}

async function getSDL(apiId: string): Promise<string> {
  const out = await client.send(
    new GetIntrospectionSchemaCommand({ apiId, format: "SDL" }),
  );

  // out.schema is a Uint8Array
  const bytes = out.schema ?? new Uint8Array();
  return Buffer.from(bytes).toString("utf8");
}

export const handler: CloudFormationCustomResourceHandler = async (
  event: CloudFormationCustomResourceEvent,
) => {
  // Delete should be fast / no-op
  if (event.RequestType === "Delete") {
    return {
      PhysicalResourceId: event.PhysicalResourceId || "SchemaWaiter",
    };
  }

  const apiId = String(event.ResourceProperties.apiId || "");
  const expectedField = String(event.ResourceProperties.expectedField || "");
  const timeoutSeconds = Number(event.ResourceProperties.timeoutSeconds || 180);
  const pollMs = Number(event.ResourceProperties.pollMs || 2000);

  if (!apiId) throw new Error("SchemaWaiter: missing ResourceProperties.apiId");
  if (!expectedField)
    throw new Error("SchemaWaiter: missing ResourceProperties.expectedField");

  const deadline = Date.now() + timeoutSeconds * 1000;

  let lastStatus: string | undefined;
  let lastSeen = false;

  while (Date.now() < deadline) {
    lastStatus = await getSchemaStatus(apiId);

    if (lastStatus === "FAILED") {
      throw new Error(
        `SchemaWaiter: schema creation FAILED for apiId=${apiId}`,
      );
    }

    if (lastStatus === "SUCCESS" || lastStatus === "NOT_APPLICABLE") {
      const sdl = await getSDL(apiId);
      lastSeen = sdl.includes(expectedField);

      if (lastSeen) {
        return {
          PhysicalResourceId:
            event.PhysicalResourceId ||
            `SchemaWaiter-${apiId}-${expectedField}`,
          Data: {
            status: lastStatus,
            expectedField,
            seen: true,
          },
        };
      }
    }

    await sleep(pollMs);
  }

  throw new Error(
    `SchemaWaiter: timed out after ${timeoutSeconds}s. lastStatus=${lastStatus}, expectedFieldSeen=${lastSeen}`,
  );
};
