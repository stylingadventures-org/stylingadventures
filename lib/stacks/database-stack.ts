// lib/stacks/data-stack.ts
import {
  Stack,
  StackProps,
  RemovalPolicy,
  Duration,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

/**
 * Keep this in sync with how you're using `stage`
 * elsewhere (dev | prod).
 */
export type Stage = "dev" | "prod";

export interface DataStackProps extends StackProps {
  stage: Stage;
  /**
   * Optional override – if not provided we’ll use
   * `sa-<stage>-app`.
   */
  tableName?: string;
}

export class DataStack extends Stack {
  /** Main single-table DynamoDB table */
  public readonly table: dynamodb.Table;

  /** Name of the status GSI (used by lambdas as STATUS_GSI) */
  public readonly statusGsiName: string = "gsi1";

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    const { stage } = props;
    const tableName = props.tableName ?? `sa-${stage}-app`;

    this.table = new dynamodb.Table(this, "AppTable", {
      tableName,

      // Core single-table design
      partitionKey: {
        name: "pk",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "sk",
        type: dynamodb.AttributeType.STRING,
      },

      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,

      // Good for recovery; you can relax this if needed
      pointInTimeRecovery: true,

      // In dev you might prefer DESTROY;
      // in prod we keep data by default.
      removalPolicy:
        stage === "prod"
          ? RemovalPolicy.RETAIN
          : RemovalPolicy.DESTROY,

      // Streams are handy for analytics / workers
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,

      timeToLiveAttribute: "ttl", // safe even if unused
    });

    // ─────────────────────────────────────────────
    // GSI #1 – STATUS index
    //
    // Matches lambda/closet/resolver.ts:
    //   const STATUS_GSI = process.env.STATUS_GSI ?? "gsi1";
    //   gsi1pk = "CLOSET#STATUS#<status>"
    //   gsi1sk = ISO timestamp
    // and then queries with IndexName = STATUS_GSI.
    // ─────────────────────────────────────────────
    this.table.addGlobalSecondaryIndex({
      indexName: this.statusGsiName,
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

    // ─────────────────────────────────────────────
    // GSI #2 – rawMediaKey index
    //
    // Used by background workers to find items
    // by original upload key.
    // ─────────────────────────────────────────────
    this.table.addGlobalSecondaryIndex({
      indexName: "rawMediaKeyIndex",
      partitionKey: {
        name: "rawMediaKey",
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ─────────────────────────────────────────────
    // GSI #3 – generic secondary index
    //
    // Keeping this from your original closet-table
    // so anything still depending on gsi3 continues
    // to work (e.g. future workflows).
    // ─────────────────────────────────────────────
    this.table.addGlobalSecondaryIndex({
      indexName: "gsi3",
      partitionKey: {
        name: "gsi3pk",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "gsi3sk",
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });
  }
}




