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
  // original names (class properties)
  public readonly approvalStateMachine: sfn.StateMachine;
  public readonly bgChangeStateMachine: sfn.StateMachine;
  public readonly storyPublishStateMachine: sfn.StateMachine;

  // convenient aliases used elsewhere
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
        // ✅ use a v2-ish name to avoid clashing with any existing SFN
        stateMachineName: `SA2-ClosetApproval-${envName}`,
        // using deprecated prop for compatibility with your CDK version
        definition: approvalNoop,
        // future-proof alternative:
        // definitionBody: sfn.DefinitionBody.fromChainable(approvalNoop),
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
        stateMachineName: `SA2-BackgroundChange-${envName}`,
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
        stateMachineName: `SA2-StoryPublish-${envName}`,
        definition: storyPublishNoop,
      },
    );

    // alias properties used by other stacks
    this.closetApprovalSm = this.approvalStateMachine;
    this.backgroundChangeSm = this.bgChangeStateMachine;
    this.storyPublishSm = this.storyPublishStateMachine;

    //
    // ✅ New, clean exports you can use going forward
    //    (unique export names so they don't clash with the old SA-Workflows-dev stack)
    //
    new CfnOutput(this, "ApprovalStateMachineArn", {
      value: this.approvalStateMachine.stateMachineArn,
      exportName: `SA2-ApprovalSMArn-${envName}`,
    });

    new CfnOutput(this, "BgChangeStateMachineArn", {
      value: this.bgChangeStateMachine.stateMachineArn,
      exportName: `SA2-BgChangeSMArn-${envName}`,
    });

    new CfnOutput(this, "StoryPublishStateMachineArn", {
      value: this.storyPublishStateMachine.stateMachineArn,
      exportName: `SA2-StoryPublishSMArn-${envName}`,
    });

    //
    // 🔁 LEGACY EXPORTS – required because ApiStack still imports these
    // DO NOT remove until ApiStack is fully migrated and deployed.
    //

    // Old background-change export
    new CfnOutput(this, "BackgroundChangeApprovalLegacyExport", {
      value: this.bgChangeStateMachine.stateMachineArn,
      exportName:
        "WorkflowsStack:ExportsOutputRefBackgroundChangeApprovalE28AFC8B01294A97",
    });

    // Old "ClosetUploadApproval" export
    new CfnOutput(this, "ClosetUploadApprovalLegacyExport", {
      value: this.approvalStateMachine.stateMachineArn,
      exportName:
        "WorkflowsStack:ExportsOutputRefClosetUploadApprovalDA1D2210CE637AAA",
    });

    // Old "StoryPublishWorkflow" export
    new CfnOutput(this, "StoryPublishWorkflowLegacyExport", {
      value: this.storyPublishStateMachine.stateMachineArn,
      exportName:
        "WorkflowsStack:ExportsOutputRefStoryPublishWorkflowCD58F9E99CC790C1",
    });
  }
}
