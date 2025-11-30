// lib/analytics-stack.ts
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as path from "path";

export interface AnalyticsStackProps extends cdk.StackProps {
  envName: string;
  table: ddb.ITable;
}

/**
 * AnalyticsStack
 *
 * - S3 bucket for gameplay / economy / engagement logs
 * - Ingest Lambda wired to EventBridge
 * - Admin metrics Lambda (queried via AppSync through AdminStack / ApiStack)
 *
 * (QuickSight / Athena can later be wired to the same S3 bucket.)
 */
export class AnalyticsStack extends cdk.Stack {
  public readonly analyticsBucket: s3.Bucket;
  public readonly ingestFn: lambdaNode.NodejsFunction;
  public readonly adminAnalyticsFn: lambdaNode.NodejsFunction;

  constructor(scope: Construct, id: string, props: AnalyticsStackProps) {
    super(scope, id, props);

    const { table, envName } = props;

    this.analyticsBucket = new s3.Bucket(this, "AnalyticsBucket", {
      bucketName: `stylingadventures-analytics-${envName}-${cdk.Aws.ACCOUNT_ID}`,
      removalPolicy:
        envName === "prd"
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: envName !== "prd",
    });

    // ─────────────────────────────────────────────
    // 1) Ingest Lambda – writes raw / aggregated events to S3 + DynamoDB
    // ─────────────────────────────────────────────
    this.ingestFn = new lambdaNode.NodejsFunction(this, "AnalyticsIngestFn", {
      entry: path.join(process.cwd(), "lambda/analytics/ingest.ts"),
      bundling: {
        format: lambdaNode.OutputFormat.CJS,
        minify: true,
        sourceMap: true,
      },
      environment: {
        TABLE_NAME: table.tableName,
        BUCKET_NAME: this.analyticsBucket.bucketName,
        NODE_OPTIONS: "--enable-source-maps",
      },
    });

    table.grantReadWriteData(this.ingestFn);
    this.analyticsBucket.grantReadWrite(this.ingestFn);

    // EventBridge bus for gameplay / economy / engagement
    const analyticsBus = new events.EventBus(this, "AnalyticsBus", {
      eventBusName: `sa-${envName}-analytics`,
    });

    analyticsBus.grantPutEventsTo(this.ingestFn);

    // Rule that other stacks can publish into, e.g. gameplay, livestream, etc.
    new events.Rule(this, "AnalyticsEventsRule", {
      eventBus: analyticsBus,
      eventPattern: {
        source: [
          "stylingadventures.gameplay",
          "stylingadventures.economy",
          "stylingadventures.livestream",
          "stylingadventures.besties",
          "stylingadventures.collabs",
        ],
      },
      targets: [new targets.LambdaFunction(this.ingestFn)],
    });

    // ─────────────────────────────────────────────
    // 2) Admin analytics Lambda (read-only)
    //    AppSync will call this for dashboard queries
    // ─────────────────────────────────────────────
    this.adminAnalyticsFn = new lambdaNode.NodejsFunction(
      this,
      "AdminAnalyticsFn",
      {
        entry: path.join(process.cwd(), "lambda/analytics/admin-metrics.ts"),
        bundling: {
          format: lambdaNode.OutputFormat.CJS,
          minify: true,
          sourceMap: true,
        },
        environment: {
          TABLE_NAME: table.tableName,
          BUCKET_NAME: this.analyticsBucket.bucketName,
          NODE_OPTIONS: "--enable-source-maps",
        },
      },
    );

    table.grantReadData(this.adminAnalyticsFn);
    this.analyticsBucket.grantRead(this.adminAnalyticsFn);

    new cdk.CfnOutput(this, "AnalyticsBucketName", {
      value: this.analyticsBucket.bucketName,
      exportName: `SA-AnalyticsBucket-${envName}`,
    });
  }
}
