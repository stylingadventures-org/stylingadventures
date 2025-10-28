import { Stack, StackProps, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";

export interface WorkflowsProps extends StackProps {
  table: ddb.ITable;
}

export class WorkflowsStack extends Stack {
  public readonly closetApprovalSm: sfn.StateMachine;

  constructor(scope: Construct, id: string, props: WorkflowsProps) {
    super(scope, id, props);

    // --- tiny stub lambdas used by the workflow (virus/moderation/pii/publish/reject)
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
    const piiCheckFn = mk("PiiCheckFn");
    const publishFn = mk("PublishFn");
    const rejectFn = mk("RejectFn");

    // DDB write for publish/reject to finalize item
    props.table.grantReadWriteData(publishFn);
    props.table.grantReadWriteData(rejectFn);

    // --- SNS topic used with WAIT_FOR_TASK_TOKEN
    const approvalTopic = new sns.Topic(this, "ClosetApprovalTopic");

    // NEW: subscriber that saves the Step Functions task token on the item
    const saveTokenFn = new NodejsFunction(this, "SaveApprovalTokenFn", {
      entry: path.join(
        process.cwd(),
        "lambda/workflows/save-approval-token.ts"
      ),
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: {
        format: OutputFormat.CJS,
        minify: true,
        sourceMap: true,
        target: "node20",
      },
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      timeout: Duration.seconds(10),
    });
    props.table.grantReadWriteData(saveTokenFn);
    approvalTopic.addSubscription(new subs.LambdaSubscription(saveTokenFn));

    // Publish approval request and WAIT for callback
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

    // --- state machine definition
    const definition = new tasks.LambdaInvoke(this, "VirusScan", {
      lambdaFunction: virusScanFn,
      resultPath: sfn.JsonPath.DISCARD,
    })
      .next(
        new tasks.LambdaInvoke(this, "Moderation", {
          lambdaFunction: moderationFn,
          resultPath: sfn.JsonPath.DISCARD,
        })
      )
      .next(
        new tasks.LambdaInvoke(this, "PIICheck", {
          lambdaFunction: piiCheckFn,
          resultPath: sfn.JsonPath.DISCARD,
        })
      )
      .next(waitForApproval)
      .next(
        new sfn.Choice(this, "Approved?")
          .when(
            sfn.Condition.booleanEquals("$.approved", true),
            new tasks.LambdaInvoke(this, "Publish", {
              lambdaFunction: publishFn,
              resultPath: sfn.JsonPath.DISCARD,
            })
          )
          .otherwise(
            new tasks.LambdaInvoke(this, "Reject", {
              lambdaFunction: rejectFn,
              resultPath: sfn.JsonPath.DISCARD,
            })
          )
      );

    this.closetApprovalSm = new sfn.StateMachine(this, "ClosetUploadApproval", {
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
      timeout: Duration.hours(6),
      tracingEnabled: true,
      stateMachineType: sfn.StateMachineType.STANDARD,
    });

    // NOTE: ApiStack grants startExecution permission to the resolver lambda.
  }
}
