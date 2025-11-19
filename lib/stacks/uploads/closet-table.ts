// lib/stacks/uploads/closet-table.ts
import { Construct } from "constructs";
import { RemovalPolicy } from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export interface ClosetTableProps {
  /** Optional explicit name; otherwise CDK will name it */
  tableName?: string;
}

export class ClosetTable extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: ClosetTableProps = {}) {
    super(scope, id);

    this.table = new dynamodb.Table(this, "AppTable", {
      tableName: props.tableName, // e.g. "sa-dev-app" if you set one
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // GSI #1 — by owner (used for "myCloset")
    this.table.addGlobalSecondaryIndex({
      indexName: "gsi1",
      partitionKey: { name: "gsi1pk", type: dynamodb.AttributeType.STRING }, // OWNER#{sub}
      sortKey: { name: "gsi1sk", type: dynamodb.AttributeType.STRING }, // ISO time
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI #2 — by status (used for admin moderation queue)
    this.table.addGlobalSecondaryIndex({
      indexName: "gsi2",
      partitionKey: { name: "gsi2pk", type: dynamodb.AttributeType.STRING }, // STATUS#PENDING / #DRAFT / ...
      sortKey: { name: "gsi2sk", type: dynamodb.AttributeType.STRING }, // ISO time
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI #3 — by rawMediaKey (used by bg worker from S3 event)
    this.table.addGlobalSecondaryIndex({
      indexName: "rawMediaKeyIndex",
      partitionKey: {
        name: "rawMediaKey",
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });
  }
}
