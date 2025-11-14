// lib/stacks/database-stack.ts
import { Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ddb from "aws-cdk-lib/aws-dynamodb";

export class DatabaseStack extends Stack {
  public readonly table: ddb.Table;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Core application table (single-table design)
    this.table = new ddb.Table(this, "CoreTable", {
      tableName: "sa-dev-app", // keep aligned with your Lambdas
      partitionKey: { name: "pk", type: ddb.AttributeType.STRING },
      sortKey: { name: "sk", type: ddb.AttributeType.STRING },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // ✅ GSI1 — used by:
    //   • Leaderboard (e.g., LEADERBOARD#GLOBAL / XP#... sort)
    //   • Closet "myCloset" (e.g., OWNER#{sub} / ISO ts)
    this.table.addGlobalSecondaryIndex({
      indexName: "gsi1",
      partitionKey: { name: "gsi1pk", type: ddb.AttributeType.STRING },
      sortKey: { name: "gsi1sk", type: ddb.AttributeType.STRING },
      projectionType: ddb.ProjectionType.ALL,
    });

    // ✅ GSI2 — used by:
    //   • Closet moderation queues (STATUS#PENDING, etc.)
    //   • Poll votes/listing (POLL#<id> / VOTE#... for counts)
    this.table.addGlobalSecondaryIndex({
      indexName: "gsi2",
      partitionKey: { name: "gsi2pk", type: ddb.AttributeType.STRING },
      sortKey: { name: "gsi2sk", type: ddb.AttributeType.STRING },
      projectionType: ddb.ProjectionType.ALL,
    });

    // Optional future scheduling or other workloads
    this.table.addGlobalSecondaryIndex({
      indexName: "gsi3",
      partitionKey: { name: "gsi3pk", type: ddb.AttributeType.STRING },
      sortKey: { name: "gsi3sk", type: ddb.AttributeType.STRING },
      projectionType: ddb.ProjectionType.ALL,
    });
  }
}



