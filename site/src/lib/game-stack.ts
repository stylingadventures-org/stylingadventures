// site/src/lib/game-stack.ts
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";

// If you already have a table elsewhere, import it. Otherwise we create one here.
export interface GameStackProps extends cdk.StackProps {
  table?: dynamodb.ITable;
  tableName?: string;
  topicEmails?: string[]; // optional: get a mail on errors, etc.
}

export class GameStack extends cdk.Stack {
  public readonly table: dynamodb.ITable;
  public readonly gameplayFn: NodejsFunction;

  constructor(scope: Construct, id: string, props: GameStackProps = {}) {
    super(scope, id, props);

    // ─────────────────────────────────────────────────────────────
    // DynamoDB (create if not supplied)
    // ─────────────────────────────────────────────────────────────
    if (props.table) {
      this.table = props.table;
    } else {
      this.table = new dynamodb.Table(this, "GameTable", {
        tableName: props.tableName, // optional, otherwise auto
        partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
        sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

      // GSI for global leaderboard (xp)
      this.table.addGlobalSecondaryIndex({
        indexName: "gsi1",
        partitionKey: { name: "gsi1pk", type: dynamodb.AttributeType.STRING },
        sortKey: { name: "gsi1sk", type: dynamodb.AttributeType.STRING },
        projectionType: dynamodb.ProjectionType.ALL,
      });
    }

    // Optional: error topic
    const errorsTopic =
      props.topicEmails && props.topicEmails.length
        ? new sns.Topic(this, "GameplayErrors")
        : undefined;

    if (errorsTopic) {
      for (const email of props.topicEmails) {
        errorsTopic.addSubscription(new subscriptions.EmailSubscription(email));
      }
    }

    // ─────────────────────────────────────────────────────────────
    // Lambda: gameplay resolver (logGameEvent, awardCoins, …)
    // ─────────────────────────────────────────────────────────────
    this.gameplayFn = this.nodeFn("GameplayFn", {
      entry: "lambda/game/gameplay.ts",
      environment: {
        TABLE_NAME: this.table.tableName,
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Allow the function to read/write the table
    this.table.grantReadWriteData(this.gameplayFn);

    // Optional: basic alarm piping to SNS (minimal)
    if (errorsTopic) {
      const metricErrors = this.gameplayFn.metricErrors();
      new cdk.aws_cloudwatch.Alarm(this, "GameplayFnErrors", {
        metric: metricErrors,
        evaluationPeriods: 1,
        threshold: 1,
        treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
      }).addAlarmAction({
        bind: () => ({ alarmActionArn: errorsTopic.topicArn }),
      });
    }
  }

  /** Small helper to create NodejsFunction with consistent defaults */
  private nodeFn(id: string, props: Omit<NodejsFunctionProps, "runtime"> & { runtime?: lambda.Runtime }) {
    return new NodejsFunction(this, id, {
      runtime: props.runtime ?? lambda.Runtime.NODEJS_20_X,
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: [
          // leave AWS SDK v3 out of the bundle (provided by Lambda)
          "@aws-sdk/*",
        ],
      },
      ...props,
    });
  }
}
