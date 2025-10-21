import { Stack, StackProps, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import * as sns from "aws-cdk-lib/aws-sns";

export interface WorkflowsProps extends StackProps {
  table: ddb.ITable;
}

export class WorkflowsStack extends Stack {
  public readonly closetApprovalSm: sfn.StateMachine;

  constructor(scope: Construct, id: string, props: WorkflowsProps) {
    super(scope, id, props);

    // --- helper for stub lambdas ---
    const mk = (name: string) =>
      new lambda.Function(this, name, {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "index.handler",
        code: lambda.Code.fromInline(`
          exports.handler = async (event) => {
            console.log("${name}", JSON.stringify(event));
            return { ok: true, name: "${name}", event };
          };
        `),
        timeout: Duration.seconds(10),
      });

    const virusScanFn = mk("VirusScanFn");
    const moderationFn = mk("ModerationFn");
    const piiCheckFn  = mk("PiiCheckFn");
    const publishFn   = mk("PublishFn");
    const rejectFn    = mk("RejectFn");

    // DDB write permissions for publish/reject
    props.table.grantReadWriteData(publishFn);
    props.table.grantReadWriteData(rejectFn);

    // --- SNS topic to request human approval ---
    const approvalTopic = new sns.Topic(this, "ClosetApprovalTopic");

    // Send message with task token and WAIT until SendTaskSuccess/Failure is called
    const waitForApproval = new tasks.SnsPublish(this, "WaitForHumanApproval", {
      topic: approvalTopic,
      subject: "ApprovalRequired",
      message: sfn.TaskInput.fromObject({
        token: sfn.JsonPath.taskToken,
        itemId: sfn.JsonPath.stringAt("$.itemId"),
        ownerSub: sfn.JsonPath.stringAt("$.ownerSub"),
      }),
      integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
      resultPath: sfn.JsonPath.DISCARD,
    });

    // --- definition ---
    const definition =
      new tasks.LambdaInvoke(this, "VirusScan", {
        lambdaFunction: virusScanFn,
        resultPath: sfn.JsonPath.DISCARD,
      })
        .next(new tasks.LambdaInvoke(this, "Moderation", {
          lambdaFunction: moderationFn,
          resultPath: sfn.JsonPath.DISCARD,
        }))
        .next(new tasks.LambdaInvoke(this, "PIICheck", {
          lambdaFunction: piiCheckFn,
          resultPath: sfn.JsonPath.DISCARD,
        }))
        .next(waitForApproval)
        .next(
          new sfn.Choice(this, "Approved?")
            .when(
              sfn.Condition.booleanEquals("$.approved", true),
              new tasks.LambdaInvoke(this, "Publish", {
                lambdaFunction: publishFn,
                resultPath: sfn.JsonPath.DISCARD,
              }),
            )
            .otherwise(
              new tasks.LambdaInvoke(this, "Reject", {
                lambdaFunction: rejectFn,
                resultPath: sfn.JsonPath.DISCARD,
              }),
            ),
        );

    this.closetApprovalSm = new sfn.StateMachine(this, "ClosetUploadApproval", {
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
      timeout: Duration.hours(6),
      tracingEnabled: true,
      stateMachineType: sfn.StateMachineType.STANDARD,
    });

    // NOTE: ApiStack already calls closetApprovalSm.grantStartExecution(closetFn)
    // so we don’t attach an inline policy that references the SM ARN here (avoids cycles).
  }
}
