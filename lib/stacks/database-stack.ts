import { Stack, StackProps, Duration, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ddb from "aws-cdk-lib/aws-dynamodb";

export class DatabaseStack extends Stack {
  public readonly table: ddb.Table;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // pk = "ITEM#<id>", sk = "V#<version>" (or "META")
    // GSI1: by owner       (gsi1pk = "OWNER#<sub>",    gsi1sk = "<createdAt>")
    // GSI2: by status      (gsi2pk = "STATUS#<state>", gsi2sk = "<updatedAt>")
    // GSI3: by schedule    (gsi3pk = "SCHED#YYYYMMDD", gsi3sk = "<scheduledAt>")
    this.table = new ddb.Table(this, "CoreTable", {
      tableName: "sa-core",
      partitionKey: { name: "pk", type: ddb.AttributeType.STRING },
      sortKey:      { name: "sk", type: ddb.AttributeType.STRING },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: RemovalPolicy.RETAIN, // keep data safe
    });

    this.table.addGlobalSecondaryIndex({
      indexName: "gsi1",
      partitionKey: { name: "gsi1pk", type: ddb.AttributeType.STRING },
      sortKey:      { name: "gsi1sk", type: ddb.AttributeType.STRING },
      projectionType: ddb.ProjectionType.ALL,
    });
    this.table.addGlobalSecondaryIndex({
      indexName: "gsi2",
      partitionKey: { name: "gsi2pk", type: ddb.AttributeType.STRING },
      sortKey:      { name: "gsi2sk", type: ddb.AttributeType.STRING },
      projectionType: ddb.ProjectionType.ALL,
    });
    this.table.addGlobalSecondaryIndex({
      indexName: "gsi3",
      partitionKey: { name: "gsi3pk", type: ddb.AttributeType.STRING },
      sortKey:      { name: "gsi3sk", type: ddb.AttributeType.STRING },
      projectionType: ddb.ProjectionType.ALL,
    });
  }
}
