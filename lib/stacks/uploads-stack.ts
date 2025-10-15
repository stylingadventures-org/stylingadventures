// lib/stacks/uploads-stack.ts
import {
  Stack,
  StackProps,
  Duration,
  RemovalPolicy,
  aws_logs as logs,
  CfnOutput,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambdaEvent from 'aws-cdk-lib/aws-lambda-event-sources';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

// Step Functions + tasks + CloudWatch
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';

export interface UploadsStackProps extends StackProps {
  userPool: cognito.IUserPool;
  /** e.g. https://d1682i07dc1r3k.cloudfront.net */
  webOrigin: string;
}

export class UploadsStack extends Stack {
  public readonly api: apigw.RestApi;
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: UploadsStackProps) {
    super(scope, id, props);
    const { userPool, webOrigin } = props;

    /* =================== S3 (private bucket) =================== */
    this.bucket = new s3.Bucket(this, 'UploadsBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    /* ========== Thumbs-only CloudFront distribution ========== */
    const thumbsOai = new cloudfront.OriginAccessIdentity(this, 'ThumbsOai');
    this.bucket.grantRead(thumbsOai, 'thumbs/*');

    const thumbsDist = new cloudfront.Distribution(this, 'ThumbsDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.bucket, { originAccessIdentity: thumbsOai }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
    });

    /* ========== SQS (DLQ + main) for thumb jobs ========== */
    const dlq = new sqs.Queue(this, 'ThumbDlq', { retentionPeriod: Duration.days(14) });
    const thumbQueue = new sqs.Queue(this, 'ThumbQueue', {
      visibilityTimeout: Duration.seconds(60),
      deadLetterQueue: { maxReceiveCount: 3, queue: dlq },
    });

    /* ================= App Lambda (list/presign/delete) ================= */
    const presignFn = new lambdaNode.NodejsFunction(this, 'PresignFn', {
      entry: path.resolve(__dirname, '../../../lambda/presign/index.ts'),
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: Duration.seconds(30),
      memorySize: 256,
      environment: {
        BUCKET: this.bucket.bucketName,
        WEB_ORIGIN: webOrigin,
        THUMB_QUEUE_URL: thumbQueue.queueUrl,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });
    this.bucket.grantReadWrite(presignFn);
    thumbQueue.grantSendMessages(presignFn);
    presignFn.addEnvironment('THUMBS_CDN', `https://${thumbsDist.domainName}`);

    // Least-privilege explicit PUT to users/*
    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowPresignFnPutObject',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ArnPrincipal(presignFn.role!.roleArn)],
        actions: ['s3:PutObject', 's3:AbortMultipartUpload'],
        resources: [this.bucket.arnForObjects('users/*')],
      })
    );

    /* ======== Thumbnail worker (Lambda that actually resizes) ======== */
    const thumbFn = new lambdaNode.NodejsFunction(this, 'ThumbnailerFn', {
      entry: path.resolve(__dirname, '../../../lambda/thumbnailer/index.ts'),
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.X86_64,
      timeout: Duration.seconds(60),
      memorySize: 512,
      environment: {
        BUCKET: this.bucket.bucketName,
        THUMBS_PREFIX: 'thumbs/',
        MAX_WIDTH: '360',
        JPEG_QUALITY: '80',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });
    this.bucket.grantReadWrite(thumbFn);

    /* ======== Step Functions: pipeline that invokes thumbFn ======== */
    const thumbTask = new tasks.LambdaInvoke(this, 'GenerateThumbnail', {
      lambdaFunction: thumbFn,
      payloadResponseOnly: true,
      retryOnServiceExceptions: true,
    }).addRetry({
      maxAttempts: 2,
      interval: Duration.seconds(3),
      backoffRate: 2,
      errors: ['States.TaskFailed', 'States.Timeout'],
    });

    const thumbSm = new sfn.StateMachine(this, 'ThumbStateMachine', {
      // CDK will warn that "definition" is deprecated; it still works.
      // To remove the warning later, swap to: definitionBody: sfn.DefinitionBody.fromChainable(thumbTask),
      definition: thumbTask,
      stateMachineType: sfn.StateMachineType.STANDARD,
      timeout: Duration.minutes(5),
      tracingEnabled: true,
    });

    /* ======== SQS → starter Lambda → Step Functions ======== */
    const startThumbFn = new lambdaNode.NodejsFunction(this, 'StartThumbFlowFn', {
      entry: path.resolve(__dirname, '../../../lambda/trigger-thumbnail/index.ts'),
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: Duration.seconds(30),
      memorySize: 256,
      environment: {
        STATE_MACHINE_ARN: thumbSm.stateMachineArn,
      },
      // use runtime-provided AWS SDK v3; keep bundles small
      bundling: { externalModules: ['@aws-sdk/*'] },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    thumbSm.grantStartExecution(startThumbFn);
    startThumbFn.addEventSource(new lambdaEvent.SqsEventSource(thumbQueue, { batchSize: 5 }));

    // S3 -> SQS notifications for user uploads
    const toQueue = new s3n.SqsDestination(thumbQueue);
    const usersPrefix = 'users/';
    for (const ext of ['.png', '.jpg', '.jpeg', '.webp']) {
      this.bucket.addEventNotification(s3.EventType.OBJECT_CREATED, toQueue, {
        prefix: usersPrefix,
        suffix: ext,
      } as s3.NotificationKeyFilter);
    }

    /* ============== Cognito authorizer =================== */
    const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'UploadsAuthorizer', {
      cognitoUserPools: [userPool],
    });

    /* ============== API (CORS + OPTIONS) ================== */
    this.api = new apigw.RestApi(this, 'UploadsApi', {
      restApiName: 'uploads-api',
      deployOptions: { stageName: 'prod' },
      defaultCorsPreflightOptions: {
        allowOrigins: [webOrigin, 'http://localhost:5173'],
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: [
          'Authorization',
          'Content-Type',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
    });

    const corsHeaders = {
      'Access-Control-Allow-Origin': `'${webOrigin}'`,
      'Access-Control-Allow-Headers':
        "'Authorization,Content-Type,X-Amz-Date,X-Amz-Security-Token,X-Api-Key'",
      'Access-Control-Allow-Methods': "'GET,POST,DELETE,OPTIONS'",
    };
    this.api.addGatewayResponse('Default4XX', {
      type: apigw.ResponseType.DEFAULT_4XX,
      responseHeaders: corsHeaders,
    });
    this.api.addGatewayResponse('Default5XX', {
      type: apigw.ResponseType.DEFAULT_5XX,
      responseHeaders: corsHeaders,
    });

    // Routes using the presign lambda
    const listRes = this.api.root.addResource('list');
    const presignRes = this.api.root.addResource('presign');
    const delRes = this.api.root.addResource('delete');

    const presignIntegration = new apigw.LambdaIntegration(presignFn);
    listRes.addMethod('GET', presignIntegration, {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer,
    });
    presignRes.addMethod('POST', presignIntegration, {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer,
    });
    delRes.addMethod('DELETE', presignIntegration, {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer,
    });

    /* ================= CloudWatch Dashboard ================= */
    const dashboard = new cw.Dashboard(this, 'UploadsDashboard', {
      dashboardName: `${this.stackName}-Uploads`,
    });

    const qVisible = thumbQueue.metricApproximateNumberOfMessagesVisible({
      statistic: 'Average',
      period: Duration.minutes(1),
    });
    const qAge = thumbQueue.metricApproximateAgeOfOldestMessage({
      statistic: 'Maximum',
      period: Duration.minutes(1),
    });

    const sfnSucceeded = thumbSm.metric('ExecutionsSucceeded', {
      statistic: 'Sum',
      period: Duration.minutes(5),
    });
    const sfnFailed = thumbSm.metric('ExecutionsFailed', {
      statistic: 'Sum',
      period: Duration.minutes(5),
    });

    const startErrors = startThumbFn.metricErrors({ period: Duration.minutes(1) });
    const workerErrors = thumbFn.metricErrors({ period: Duration.minutes(1) });

    dashboard.addWidgets(
      new cw.GraphWidget({
        title: 'Thumb Queue Depth',
        left: [qVisible],
        right: [qAge],
        leftYAxis: { min: 0 },
        width: 24,
      }),
      new cw.GraphWidget({
        title: 'Step Functions Executions',
        left: [sfnSucceeded, sfnFailed],
        width: 24,
      }),
      new cw.GraphWidget({
        title: 'Lambda Errors',
        left: [startErrors, workerErrors],
        width: 24,
      })
    );

    /* ==================== Outputs ======================= */
    new CfnOutput(this, 'UploadsApiUrl', { value: this.api.url });
    new CfnOutput(this, 'UploadsBucketName', { value: this.bucket.bucketName });
    new CfnOutput(this, 'ThumbQueueUrl', { value: thumbQueue.queueUrl });
    new CfnOutput(this, 'ThumbsCdnDomainName', { value: thumbsDist.domainName });
    new CfnOutput(this, 'ThumbStateMachineArn', { value: thumbSm.stateMachineArn });
    new CfnOutput(this, 'UploadsDashboardName', { value: dashboard.dashboardName });
  }
}
