// lib/stacks/database-stack.ts
import { Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ddb from "aws-cdk-lib/aws-dynamodb";

export class DatabaseStack extends Stack {
  public readonly table: ddb.Table;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Primary app table (single-table design)
    // pk = "ITEM#<id>", sk = "META" (or version keys later)
    this.table = new ddb.Table(this, "CoreTable", {
      tableName: "sa-dev-app",                           // << use the table your Lambdas already hit
      partitionKey: { name: "pk", type: ddb.AttributeType.STRING },
      sortKey:      { name: "sk", type: ddb.AttributeType.STRING },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: RemovalPolicy.RETAIN,              // keep data on stack delete
    });

    // GSI #1 — by owner (used by Query.myCloset)
    this.table.addGlobalSecondaryIndex({
      indexName: "gsi1",
      partitionKey: { name: "gsi1pk", type: ddb.AttributeType.STRING }, // OWNER#{sub}
      sortKey:      { name: "gsi1sk", type: ddb.AttributeType.STRING }, // ISO timestamp
      projectionType: ddb.ProjectionType.ALL,
    });

    // GSI #2 — by status (used by admin moderation queue)
    this.table.addGlobalSecondaryIndex({
      indexName: "gsi2",
      partitionKey: { name: "gsi2pk", type: ddb.AttributeType.STRING }, // STATUS#PENDING/APPROVED/...
      sortKey:      { name: "gsi2sk", type: ddb.AttributeType.STRING }, // ISO timestamp
      projectionType: ddb.ProjectionType.ALL,
    });

    // Optional: future scheduling features
    this.table.addGlobalSecondaryIndex({
      indexName: "gsi3",
      partitionKey: { name: "gsi3pk", type: ddb.AttributeType.STRING }, // SCHED#YYYYMMDD (future)
      sortKey:      { name: "gsi3sk", type: ddb.AttributeType.STRING },
      projectionType: ddb.ProjectionType.ALL,
    });
  }
}

