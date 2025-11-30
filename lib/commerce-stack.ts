import {
  Stack,
  StackProps,
  CfnOutput,
  Duration,
  RemovalPolicy,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";

export interface CommerceStackProps extends StackProps {
  envName: string;
  table: dynamodb.ITable; // main app table (for linking orders to users/items)
  userPool: cognito.IUserPool;
}

/**
 * CommerceStack
 *
 * - Orders table (for drops / affiliate / checkout records)
 * - Commerce Lambda for checkout + revenue tracking (Stripe-ready)
 */
export class CommerceStack extends Stack {
  readonly commerceFn: lambda.IFunction;
  readonly ordersTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: CommerceStackProps) {
    super(scope, id, props);

    const { envName, table, userPool } = props;

    const ordersTable = new dynamodb.Table(this, "OrdersTable", {
      tableName: `sa-${envName}-orders`,
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy:
        envName === "prd"
          ? RemovalPolicy.RETAIN
          : RemovalPolicy.DESTROY,
    });

    ordersTable.addGlobalSecondaryIndex({
      indexName: "gsi1",
      partitionKey: { name: "gsi1pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "gsi1sk", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.ordersTable = ordersTable;

    const commerceFn = new NodejsFunction(this, "CommerceFn", {
      entry: "lambda/commerce/index.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: {
        format: OutputFormat.CJS,
        minify: true,
        sourceMap: true,
      },
      environment: {
        APP_TABLE_NAME: table.tableName,
        ORDERS_TABLE_NAME: ordersTable.tableName,
        USER_POOL_ID: userPool.userPoolId,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "",
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? "",
      },
      timeout: Duration.seconds(15),
      memorySize: 512,
    });

    table.grantReadWriteData(commerceFn);
    ordersTable.grantReadWriteData(commerceFn);

    this.commerceFn = commerceFn;

    new CfnOutput(this, "OrdersTableName", {
      value: ordersTable.tableName,
      exportName: `SA-OrdersTableName-${envName}`,
    });
  }
}
