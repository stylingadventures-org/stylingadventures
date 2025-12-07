import { Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export interface DatabaseStackProps extends StackProps {}

export class DatabaseStack extends Stack {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Try to derive env (dev/prod) for the name, but it's not critical
    const envName =
      this.node.tryGetContext("env") ||
      process.env.ENVIRONMENT ||
      "dev";

    this.table = new dynamodb.Table(this, "ClosetTable", {
      // Single-table app: sa2-<env>-app
      tableName: `sa2-${envName}-app`,
      partitionKey: {
        name: "pk",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "sk",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN, // safer for now
    });

    // GSI used by your Lambda (STATUS_GSI / gsi1)
    // now also used by CreatorCabinet + CreatorAsset:
    //  - pk: "CREATOR_CABINET", sk: createdAt
    //  - pk: `CREATOR_ASSET#USER#<ownerSub>`, sk: `${category}#${createdAt}`
    this.table.addGlobalSecondaryIndex({
      indexName: "gsi1",
      partitionKey: {
        name: "gsi1pk",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "gsi1sk",
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });
  }
}
