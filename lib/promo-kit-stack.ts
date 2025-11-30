// lib/promo-kit-stack.ts
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as path from "path";

export interface PromoKitStackProps extends cdk.StackProps {
  table: dynamodb.ITable;
  uploadsBucket: s3.IBucket;
  userPool: cognito.IUserPool;
  webOrigin: string;
  collabEventBus: events.IEventBus; // from CollaboratorStack
}

/**
 * PromoKitStack
 *
 * Responsibilities:
 * - Generate promo kits after collab approval
 *   (captions, thumbnails, social graphics → S3)
 * - Watermarked episode preview generation
 * - Wall of Slay / Hall of Fame querying
 * - Listens to Collaborator events via EventBridge
 *
 * NOTE:
 * - “generatePromoKit” / “generatePreview” mutations should be
 *   creator-only (admin || creator) in the Lambda handlers.
 * - “Hall of Slay” can be public read.
 */
export class PromoKitStack extends cdk.Stack {
  public readonly promoKitFn: lambdaNode.NodejsFunction;
  public readonly previewFn: lambdaNode.NodejsFunction;
  public readonly hallOfSlayFn: lambdaNode.NodejsFunction;

  constructor(scope: Construct, id: string, props: PromoKitStackProps) {
    super(scope, id, props);

    const { table, uploadsBucket, userPool, webOrigin, collabEventBus } = props;
    const envName = this.node.tryGetContext("env") ?? "dev";

    const BASE_ENV = {
      TABLE_NAME: table.tableName,
      UPLOADS_BUCKET: uploadsBucket.bucketName,
      USER_POOL_ID: userPool.userPoolId,
      WEB_ORIGIN: webOrigin,
      ENV_NAME: envName,
      NODE_OPTIONS: "--enable-source-maps",
    };

    const nodeFn = (
      id: string,
      relEntry: string,
      extraEnv?: Record<string, string>,
    ) =>
      new lambdaNode.NodejsFunction(this, id, {
        entry: path.join(process.cwd(), relEntry),
        bundling: {
          format: lambdaNode.OutputFormat.CJS,
          minify: true,
          sourceMap: true,
        },
        environment: {
          ...BASE_ENV,
          ...(extraEnv ?? {}),
        },
      });

    // ─────────────────────────────────────────────
    // 1) Promo Kit Generator (event-driven)
    // - Triggered on CollabUploadApproved events from CollaboratorStack
    // - Internal event-driven workflow; no direct AppSync entry point
    // ─────────────────────────────────────────────
    this.promoKitFn = nodeFn(
      "PromoKitGeneratorFn",
      "lambda/promo/generate-promo-kit.ts",
      {
        // In case you also expose this via API, handler can reuse this
        PROMO_KIT_ALLOWED_GROUPS: "creator,admin",
      },
    );
    table.grantReadWriteData(this.promoKitFn);
    uploadsBucket.grantReadWrite(this.promoKitFn);
    collabEventBus.grantPutEventsTo(this.promoKitFn); // if it emits follow-up events

    // Event rule: CollabUploadApproved → PromoKitGenerator
    new events.Rule(this, "PromoKitOnCollabApprovedRule", {
      eventBus: collabEventBus,
      eventPattern: {
        source: ["stylingadventures.collab"],
        detailType: ["CollabUploadApproved"],
      },
      targets: [new targets.LambdaFunction(this.promoKitFn)],
    });

    // ─────────────────────────────────────────────
    // 2) Episode Preview Generator
    // - Likely called via GraphQL / REST
    // - Should be creator-only (admin || creator)
    // ─────────────────────────────────────────────
    this.previewFn = nodeFn(
      "EpisodePreviewFn",
      "lambda/promo/generate-preview.ts",
      {
        PREVIEW_ALLOWED_GROUPS: "creator,admin",
      },
    );
    table.grantReadData(this.previewFn);
    uploadsBucket.grantReadWrite(this.previewFn);

    // ─────────────────────────────────────────────
    // 3) Wall of Slay / Hall of Fame
    // - Public-facing query of approved collaborators + promo info
    // - Reads from DynamoDB only.
    // ─────────────────────────────────────────────
    this.hallOfSlayFn = nodeFn(
      "HallOfSlayFn",
      "lambda/promo/hall-of-slay.ts",
    );
    table.grantReadData(this.hallOfSlayFn);

    // Optional: Outputs for quick integration
    new cdk.CfnOutput(this, "PromoKitFunctionName", {
      value: this.promoKitFn.functionName,
    });

    new cdk.CfnOutput(this, "EpisodePreviewFunctionName", {
      value: this.previewFn.functionName,
    });

    new cdk.CfnOutput(this, "HallOfSlayFunctionName", {
      value: this.hallOfSlayFn.functionName,
    });
  }
}
