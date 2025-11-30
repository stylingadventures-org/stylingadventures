// lib/collaborator-stack.ts
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as sns from "aws-cdk-lib/aws-sns";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";

export interface CollaboratorStackProps extends cdk.StackProps {
  table: dynamodb.ITable;
  uploadsBucket: s3.IBucket;
  userPool: cognito.IUserPool;
  webOrigin: string;
}

/**
 * CollaboratorStack
 *
 * Responsibilities:
 * - Invite-only collab access (email + token)
 * - Terms & conditions acceptance
 * - Collaborator upload flow (tied to episode + deadline)
 * - Creator/Admin review (approve / reject)
 * - Deadline reminder system (EventBridge + SNS)
 *
 * All state is stored in the shared app table and uploads bucket, keyed
 * by Cognito identity (sub) and episodeId.
 *
 * NOTE:
 * - Creator-facing operations (create invites, manage deadlines,
 *   approve uploads) should enforce creator-only (admin || creator)
 *   at the Lambda / AppSync resolver level.
 * - Collaborator-facing actions (accept invite, accept terms, upload)
 *   should NOT require creator/admin.
 */
export class CollaboratorStack extends cdk.Stack {
  // Event bus for collab-domain events (consumed by PromoKitStack, etc.)
  public readonly collabEventBus: events.IEventBus;

  // Lambdas exposed so ApiStack / AppSync can wire them as resolvers
  public readonly createInviteFn: lambdaNode.NodejsFunction;
  public readonly acceptInviteFn: lambdaNode.NodejsFunction;
  public readonly acceptTermsFn: lambdaNode.NodejsFunction;
  public readonly collabUploadFn: lambdaNode.NodejsFunction;
  public readonly adminReviewFn: lambdaNode.NodejsFunction;
  public readonly deadlineReminderFn: lambdaNode.NodejsFunction;

  // SNS topic for reminder-delivery (email / SMS / webhook subscriptions)
  public readonly deadlineTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: CollaboratorStackProps) {
    super(scope, id, props);

    const { table, uploadsBucket, userPool, webOrigin } = props;
    const envName = this.node.tryGetContext("env") ?? "dev";

    // ─────────────────────────────────────────────
    // Shared EventBridge bus for collab domain
    // ─────────────────────────────────────────────
    this.collabEventBus = new events.EventBus(this, "CollaboratorBus", {
      eventBusName: `sa-${cdk.Stack.of(this).stackName}-collab`,
    });

    // ─────────────────────────────────────────────
    // SNS topic for deadline reminders
    // (you can attach email subscriptions via console)
    // ─────────────────────────────────────────────
    this.deadlineTopic = new sns.Topic(this, "CollaboratorDeadlineTopic", {
      displayName: "StylingAdventures Collaborator Deadlines",
      topicName: `sa-${envName}-collab-deadlines`,
    });

    // Allow EventBridge to publish if you later add rules that target this topic
    this.deadlineTopic.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["sns:Publish"],
        principals: [new iam.ServicePrincipal("events.amazonaws.com")],
        resources: [this.deadlineTopic.topicArn],
      }),
    );

    const BASE_ENV = {
      TABLE_NAME: table.tableName,
      UPLOADS_BUCKET: uploadsBucket.bucketName,
      USER_POOL_ID: userPool.userPoolId,
      WEB_ORIGIN: webOrigin,
      COLLAB_EVENT_BUS_NAME: this.collabEventBus.eventBusName,
      DEADLINE_TOPIC_ARN: this.deadlineTopic.topicArn,
      NODE_OPTIONS: "--enable-source-maps",
      ENV_NAME: envName,
    };

    // small helper
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
    // 1) Invite Management (email + token)
    // - Creator / Admin only via cognito:groups check in handler
    // ─────────────────────────────────────────────
    this.createInviteFn = nodeFn(
      "CreateCollaboratorInviteFn",
      "lambda/collab/create-invite.ts",
      {
        CREATE_INVITE_ALLOWED_GROUPS: "creator,admin",
      },
    );
    table.grantReadWriteData(this.createInviteFn);

    this.acceptInviteFn = nodeFn(
      "AcceptCollaboratorInviteFn",
      "lambda/collab/accept-invite.ts",
    );
    table.grantReadWriteData(this.acceptInviteFn);
    // Lambdas can read Cognito userPool id via env; actual identity resolution is in code/JWT.

    // ─────────────────────────────────────────────
    // 2) Terms & Conditions Acceptance (collaborator-side)
    // ─────────────────────────────────────────────
    this.acceptTermsFn = nodeFn(
      "AcceptCollaboratorTermsFn",
      "lambda/collab/accept-terms.ts",
    );
    table.grantReadWriteData(this.acceptTermsFn);

    // ─────────────────────────────────────────────
    // 3) Collab Upload Flow (presign + metadata)
    // - Collaborator upload; no creator/admin requirement
    // ─────────────────────────────────────────────
    this.collabUploadFn = nodeFn(
      "CollaboratorUploadFn",
      "lambda/collab/presign-upload.ts",
    );
    table.grantReadWriteData(this.collabUploadFn);
    uploadsBucket.grantReadWrite(this.collabUploadFn);

    // ─────────────────────────────────────────────
    // 4) Creator/Admin Review Flow
    // - Creator/Admin approves/rejects a submission
    // - Writes status back to DynamoDB
    // - On APPROVED, emits EventBridge event:
    //   source: "stylingadventures.collab"
    //   detailType: "CollabUploadApproved"
    //   detail: { collabId, episodeId, uploadId, userSub, ... }
    // PromoKitStack listens to that.
    // ─────────────────────────────────────────────
    this.adminReviewFn = nodeFn(
      "CollaboratorAdminReviewFn",
      "lambda/collab/admin-review.ts",
      {
        COLLAB_REVIEW_ALLOWED_GROUPS: "creator,admin",
      },
    );
    table.grantReadWriteData(this.adminReviewFn);
    this.collabEventBus.grantPutEventsTo(this.adminReviewFn);

    // ─────────────────────────────────────────────
    // 5) Deadline Reminder Scanner
    // - Runs every 15 minutes
    // - System Lambda, not user-invoked
    // ─────────────────────────────────────────────
    this.deadlineReminderFn = nodeFn(
      "CollaboratorDeadlineReminderFn",
      "lambda/collab/deadline-reminder.ts",
    );
    table.grantReadData(this.deadlineReminderFn);
    this.deadlineTopic.grantPublish(this.deadlineReminderFn);

    new events.Rule(this, "CollaboratorDeadlineScheduleRule", {
      schedule: events.Schedule.rate(cdk.Duration.minutes(15)),
      targets: [new targets.LambdaFunction(this.deadlineReminderFn)],
    });

    // ─────────────────────────────────────────────
    // Outputs (handy for debugging / integration)
    // ─────────────────────────────────────────────
    new cdk.CfnOutput(this, "CollaboratorBusName", {
      value: this.collabEventBus.eventBusName,
    });

    new cdk.CfnOutput(this, "CollaboratorDeadlineTopicArn", {
      value: this.deadlineTopic.topicArn,
    });
  }
}
