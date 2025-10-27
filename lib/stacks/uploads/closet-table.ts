// lib/stacks/uploads/closet-table.ts (or inside your existing stack)
import { Stack, aws_dynamodb as ddb, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";

export function createClosetTable(scope: Construct) {
  const table = new ddb.Table(scope, "ClosetTable", {
    partitionKey: { name: "id", type: ddb.AttributeType.STRING },
    billingMode: ddb.BillingMode.PAY_PER_REQUEST,
    removalPolicy: /* keep in prod */ undefined,
    pointInTimeRecovery: true,
  });

  table.addGlobalSecondaryIndex({
    indexName: "gsi1",
    partitionKey: { name: "gsi1pk", type: ddb.AttributeType.STRING }, // OWNER#{sub}
    sortKey: { name: "gsi1sk", type: ddb.AttributeType.STRING },      // ISO
    projectionType: ddb.ProjectionType.ALL,
  });

  return table;
}
