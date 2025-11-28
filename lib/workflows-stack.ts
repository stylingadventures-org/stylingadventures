import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";

export interface WorkflowsStackProps extends StackProps {
  table: dynamodb.ITable;
}

/**
 * WorkflowsStack
 *
 * Holds Step Functions state machines for:
 * - Closet item approval
 * - Background change requests
 * - Story publish flows
 *
 * For now these are simple one-step Pass machines that you can
 * expand into proper workflows later.
 */
export class WorkflowsStack extends Stack {
  // original names
  public readonly approvalStateMachine: sfn.StateMachine;
  public readonly bgChangeStateMachine: sfn.StateMachine;
  public readonly storyPublishStateMachine: sfn.StateMachine;

  // convenient aliases used elsewhere (e.g. aws-lala.ts)
  public readonly closetApprovalSm: sfn.StateMachine;
  public readonly backgroundChangeSm: sfn.StateMachine;
  public readonly storyPublishSm: sfn.StateMachine;

  constructor(scope: Construct, id: string, props: WorkflowsStackProps) {
    super(scope, id, props);

    const envName = this.node.tryGetContext("env") ?? "dev";

    // 1) Closet approval pipeline
    const approvalNoop = new sfn.Pass(this, "ApprovalNoop", {
      comment:
        "Closet approval workflow placeholder – expand to multi-step moderation later",
    });

    this.approvalStateMachine = new sfn.StateMachine(
      this,
      "ApprovalStateMachine",
      {
        stateMachineName: `SA-ClosetApproval-${envName}`,
        definition: approvalNoop, // deprecated but still fine
        // future-proof: definitionBody: sfn.DefinitionBody.fromChainable(approvalNoop),
      },
    );

    // 2) Background change moderation pipeline
    const bgChangeNoop = new sfn.Pass(this, "BgChangeNoop", {
      comment:
        "Background change workflow placeholder – expand to moderation + processing later",
    });

    this.bgChangeStateMachine = new sfn.StateMachine(
      this,
      "BackgroundChangeStateMachine",
      {
        stateMachineName: `SA-BackgroundChange-${envName}`,
        definition: bgChangeNoop,
      },
    );

    // 3) Story publish workflow (schedule / publish / syndicate)
    const storyPublishNoop = new sfn.Pass(this, "StoryPublishNoop", {
      comment:
        "Story publish workflow placeholder – expand to scheduling / publishing / syndication later",
    });

    this.storyPublishStateMachine = new sfn.StateMachine(
      this,
      "StoryPublishStateMachine",
      {
        stateMachineName: `SA-StoryPublish-${envName}`,
        definition: storyPublishNoop,
      },
    );

    // alias properties used by other stacks
    this.closetApprovalSm = this.approvalStateMachine;
    this.backgroundChangeSm = this.bgChangeStateMachine;
    this.storyPublishSm = this.storyPublishStateMachine;

    // Outputs for debugging / cross-stack use
    new CfnOutput(this, "ApprovalStateMachineArn", {
      value: this.approvalStateMachine.stateMachineArn,
      exportName: `SA-ApprovalSMArn-${envName}`,
    });

    new CfnOutput(this, "BgChangeStateMachineArn", {
      value: this.bgChangeStateMachine.stateMachineArn,
      exportName: `SA-BgChangeSMArn-${envName}`,
    });

    new CfnOutput(this, "StoryPublishStateMachineArn", {
      value: this.storyPublishStateMachine.stateMachineArn,
      exportName: `SA-StoryPublishSMArn-${envName}`,
    });
  }
}
