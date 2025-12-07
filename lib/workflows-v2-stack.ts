// lib/workflows-v2-stack.ts
import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";

export interface WorkflowsV2StackProps extends StackProps {
  table: dynamodb.ITable; // now actually used for approval token storage
}

/**
 * WorkflowsV2Stack (Option B)
 *
 * New, clean home for Step Functions:
 * - Closet item approval
 * - Background change requests
 * - Story publish flows
 *
 * Also exposes a tiny admin REST API:
 * - POST /approvals  -> completeApprovalFn (calls SendTaskSuccess/Failure)
 */
export class WorkflowsV2Stack extends Stack {
  // primary state machines
  public readonly approvalStateMachine: sfn.StateMachine;
  public readonly bgChangeStateMachine: sfn.StateMachine;
  public readonly storyPublishStateMachine: sfn.StateMachine;

  // convenient aliases for other stacks
  public readonly closetApprovalSm: sfn.StateMachine;
  public readonly backgroundChangeSm: sfn.StateMachine;
  public readonly storyPublishSm: sfn.StateMachine;

  constructor(scope: Construct, id: string, props: WorkflowsV2StackProps) {
    super(scope, id, props);

    const { table } = props;
    const envName = this.node.tryGetContext("env") ?? "dev";

    //
    // 1) Closet approval pipeline
    //
    const approvalNoop = new sfn.Pass(this, "ApprovalNoop", {
      comment:
        "Closet approval workflow placeholder – expand to multi-step moderation later",
    });

    this.approvalStateMachine = new sfn.StateMachine(
      this,
      "ApprovalStateMachine",
      {
        stateMachineName: `SA2-ClosetApproval-${envName}`,
        // Using deprecated 'definition' for compatibility with your CDK version
        definition: approvalNoop,
        // Future-proof alternative if/when you upgrade CDK:
        // definitionBody: sfn.DefinitionBody.fromChainable(approvalNoop),
      },
    );

    //
    // 2) Background change moderation pipeline
    //
    const bgChangeNoop = new sfn.Pass(this, "BgChangeNoop", {
      comment:
        "Background change workflow placeholder – expand to moderation + processing later",
    });

    this.bgChangeStateMachine = new sfn.StateMachine(
      this,
      "BackgroundChangeStateMachine",
      {
        stateMachineName: `SA2-BackgroundChange-${envName}`,
        definition: bgChangeNoop,
      },
    );

    //
    // 3) Story publish workflow (schedule / publish / syndicate)
    //
    const storyPublishNoop = new sfn.Pass(this, "StoryPublishNoop", {
      comment:
        "Story publish workflow placeholder – expand to scheduling / publishing / syndication later",
    });

    this.storyPublishStateMachine = new sfn.StateMachine(
      this,
      "StoryPublishStateMachine",
      {
        stateMachineName: `SA2-StoryPublish-${envName}`,
        definition: storyPublishNoop,
      },
    );

    //
    // Aliases used by other stacks
    //
    this.closetApprovalSm = this.approvalStateMachine;
    this.backgroundChangeSm = this.bgChangeStateMachine;
    this.storyPublishSm = this.storyPublishStateMachine;

    //
    // Optional: outputs (NO exportName => no cross-stack exports)
    //
    new CfnOutput(this, "ApprovalStateMachineArn", {
      value: this.approvalStateMachine.stateMachineArn,
    });

    new CfnOutput(this, "BgChangeStateMachineArn", {
      value: this.bgChangeStateMachine.stateMachineArn,
    });

    new CfnOutput(this, "StoryPublishStateMachineArn", {
      value: this.storyPublishStateMachine.stateMachineArn,
    });

    //
    // 4) Tiny admin REST API for approvals (out-of-band from fan app)
    //

    const completeApprovalFn = new lambdaNode.NodejsFunction(
      this,
      "CompleteApprovalFn",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          "../lambda/workflows/complete-approval.ts",
        ),
        handler: "handler",
        environment: {
          TABLE_NAME: table.tableName,
          PK_NAME: "pk",
          SK_NAME: "sk",
        },
      },
    );

    // DDB read/write for approval tokens + lookup
    table.grantReadWriteData(completeApprovalFn);

    // Allow this function to complete SFN tasks (SendTaskSuccess/Failure)
    completeApprovalFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["states:SendTaskSuccess", "states:SendTaskFailure"],
        resources: ["*"], // you can tighten to specific SM ARNs later
      }),
    );

    const adminApi = new apigw.RestApi(this, "AdminApprovalApi", {
      restApiName: "stylingadventures-admin-approval",
      deployOptions: {
        stageName: "v1",
      },
    });

    const approvals = adminApi.root.addResource("approvals");

    approvals.addMethod(
      "POST",
      new apigw.LambdaIntegration(completeApprovalFn),
      {
        // TODO: add auth later (IAM / Cognito / API key)
      },
    );
  }
}

