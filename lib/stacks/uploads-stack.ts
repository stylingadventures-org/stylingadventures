// lib/stacks/uploads-stack.ts
import 'source-map-support/register';
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
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambdaEvent from 'aws-cdk-lib/aws-lambda-event-sources';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import * as path from 'path';

export interface UploadsStackProps extends StackProps {
  userPool: cognito.IUserPool;
  /** e.g. https://stylingadventures.com */
  webOrigin: string;
}

export class UploadsStack extends Stack {
  public readonly api: apigw.RestApi;
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: UploadsStackProps) {
    super(scope, id, props);
    const { userPool, webOrigin } = props;

    // -------- Lambda entry paths --------
    const presignEntry = path.resolve(process.cwd(), 'lambda/presign/index.ts');
    const listEntry    = path.resolve(process.cwd(), 'lambda/list/index.ts');
    const headEntry    = path.resolve(process.cwd(), 'lambda/thumb-head/index.ts');
    const workerEntry  = path.resolve(process.cwd(), 'lambda/thumbnailer/index.ts');
    const triggerEntry = path.resolve(process.cwd(), 'lambda/trigger-thumbnail/index.ts');

    // -------- S3: private bucket --------
    this.bucket = new s3.Bucket(this, 'UploadsBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // S3 CORS — presigned PUTs + public GET/HEAD via CF
    this.bucket.addCorsRule({
      allowedOrigins: [webOrigin],
      allowedMethods: [s3.HttpMethods.PUT],
      allowedHeaders: ['*'],
      exposedHeaders: ['ETag', 'x-amz-version-id'],
      maxAge: 86400,
    });
    this.bucket.addCorsRule({
      allowedOrigins: [webOrigin],
      allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
      allowedHeaders: ['Origin', 'Accept', 'Referer', 'User-Agent', 'Range'],
      exposedHeaders: ['ETag', 'Content-Type', 'Content-Length', 'Last-Modified', 'Accept-Ranges'],
      maxAge: 86400,
    });

    // -------- CloudFront for /thumbs/* --------
    const thumbsOai = new cloudfront.OriginAccessIdentity(this, 'ThumbsOai');
    this.bucket.grantRead(thumbsOai, 'thumbs/*');

    const thumbsHeaders = new cloudfront.ResponseHeadersPolicy(this, 'ThumbsCors', {
      corsBehavior: {
        accessControlAllowOrigins: [webOrigin],
        accessControlAllowMethods: ['GET', 'HEAD', 'OPTIONS'],
        accessControlAllowHeaders: ['Origin', 'Accept', 'Referer', 'User-Agent', 'Range'],
        accessControlExposeHeaders: ['ETag', 'Content-Type', 'Content-Length', 'Last-Modified', 'Accept-Ranges'],
        accessControlAllowCredentials: false,
        accessControlMaxAge: Duration.days(1),
        originOverride: true,
      },
    });

    const thumbsCache = new cloudfront.CachePolicy(this, 'ThumbsCache', {
      comment: 'Thumbs cache with query strings allowed',
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
      headerBehavior: cloudfront.CacheHeaderBehavior.none(),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      defaultTtl: Duration.minutes(10),
      minTtl: Duration.seconds(0),
      maxTtl: Duration.hours(1),
    });

    const thumbsDist = new cloudfront.Distribution(this, 'ThumbsDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.bucket, { originAccessIdentity: thumbsOai }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: thumbsCache,
        responseHeadersPolicy: thumbsHeaders,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        compress: true,
      },
      errorResponses: [
        { httpStatus: 404, ttl: Duration.seconds(5) },
        { httpStatus: 403, ttl: Duration.seconds(5) },
      ],
    });

    // -------- SQS queues for thumb jobs --------
    const dlq = new sqs.Queue(this, 'ThumbDlq', { retentionPeriod: Duration.days(14) });
    const thumbQueue = new sqs.Queue(this, 'ThumbQueue', {
      visibilityTimeout: Duration.seconds(60),
      deadLetterQueue: { maxReceiveCount: 3, queue: dlq },
    });

    // -------- Presign Lambda --------
    const presignFn = new NodejsFunction(this, 'PresignFn', {
      entry: presignEntry,
      runtime: lambda.Runtime.NODEJS_18_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      timeout: Duration.seconds(30),
      memorySize: 256,
      environment: {
        BUCKET: this.bucket.bucketName,
        WEB_ORIGIN: webOrigin,
        THUMB_QUEUE_URL: thumbQueue.queueUrl,
        THUMBS_CDN: `https://${thumbsDist.domainName}`,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });
    this.bucket.grantReadWrite(presignFn);
    thumbQueue.grantSendMessages(presignFn);

    // Least-privilege explicit PUT to users/*
    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowPresignFnPutObject',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ArnPrincipal(presignFn.role!.roleArn)],
        actions: ['s3:PutObject', 's3:AbortMultipartUpload'],
        resources: [this.bucket.arnForObjects('users/*')],
      }),
    );

    // -------- List Lambda --------
    const listFn = new NodejsFunction(this, 'ListFn', {
      entry: listEntry,
      runtime: lambda.Runtime.NODEJS_18_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      timeout: Duration.seconds(30),
      memorySize: 256,
      environment: {
        BUCKET: this.bucket.bucketName,
        WEB_ORIGIN: webOrigin,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });
    this.bucket.grantRead(listFn);

    // -------- Worker Lambda (image resize) --------
    const thumbFn = new NodejsFunction(this, 'ThumbnailerFn', {
      entry: workerEntry,
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.X86_64,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
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

    // -------- Step Functions (invoke worker) --------
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
      definition: thumbTask,
      stateMachineType: sfn.StateMachineType.STANDARD,
      timeout: Duration.minutes(5),
      tracingEnabled: true,
    });

    // -------- SQS → starter Lambda → Step Functions --------
    const startThumbFn = new NodejsFunction(this, 'StartThumbFlowFn', {
      entry: triggerEntry,
      runtime: lambda.Runtime.NODEJS_18_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      timeout: Duration.seconds(30),
      memorySize: 256,
      environment: {
        STATE_MACHINE_ARN: thumbSm.stateMachineArn,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });
    thumbSm.grantStartExecution(startThumbFn);
    startThumbFn.addEventSource(new lambdaEvent.SqsEventSource(thumbQueue, { batchSize: 5 }));

    // S3 -> SQS notifications for user uploads (images only)
    const toQueue = new s3n.SqsDestination(thumbQueue);
    const usersPrefix = 'users/';
    for (const ext of ['.png', '.jpg', '.jpeg', '.webp']) {
      this.bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED,
        toQueue,
        { prefix: usersPrefix, suffix: ext },
      );
    }

    // -------- thumb-head Lambda (poll without 404s) --------
    const thumbHeadFn = new NodejsFunction(this, 'ThumbHeadFn', {
      entry: headEntry,
      runtime: lambda.Runtime.NODEJS_18_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      timeout: Duration.seconds(10),
      memorySize: 256,
      environment: {
        BUCKET: this.bucket.bucketName,
        WEB_ORIGIN: webOrigin,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });
    this.bucket.grantRead(thumbHeadFn);

    // -------- Cognito authorizer --------
    const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'UploadsAuthorizer', {
      cognitoUserPools: [userPool],
    });

    // -------- API Gateway (with CORS) --------
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
          'Cookie',
        ],
        allowCredentials: true,
      },
    });

    // Ensure CORS headers on default 4xx/5xx responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': `'${webOrigin}'`,
      'Access-Control-Allow-Headers':
        "'Authorization,Content-Type,X-Amz-Date,X-Amz-Security-Token,X-Api-Key,Cookie'",
      'Access-Control-Allow-Methods': "'GET,POST,DELETE,OPTIONS'",
      'Access-Control-Allow-Credentials': "'true'",
    };
    this.api.addGatewayResponse('Default4XX', {
      type: apigw.ResponseType.DEFAULT_4XX,
      responseHeaders: corsHeaders,
    });
    this.api.addGatewayResponse('Default5XX', {
      type: apigw.ResponseType.DEFAULT_5XX,
      responseHeaders: corsHeaders,
    });

    // Resources & integrations
    const listRes     = this.api.root.addResource('list');
    const presignRes  = this.api.root.addResource('presign');
    const delRes      = this.api.root.addResource('delete');
    const headRes     = this.api.root.addResource('thumb-head');

    const listInt     = new apigw.LambdaIntegration(listFn);
    const presignInt  = new apigw.LambdaIntegration(presignFn);
    const delInt      = new apigw.LambdaIntegration(presignFn);
    const headInt     = new apigw.LambdaIntegration(thumbHeadFn);

    listRes.addMethod('GET',     listInt,    { authorizationType: apigw.AuthorizationType.COGNITO, authorizer });
    presignRes.addMethod('POST', presignInt, { authorizationType: apigw.AuthorizationType.COGNITO, authorizer });
    delRes.addMethod('DELETE',   delInt,     { authorizationType: apigw.AuthorizationType.COGNITO, authorizer });
    headRes.addMethod('GET',     headInt,    { authorizationType: apigw.AuthorizationType.COGNITO, authorizer });

    // -------- CloudWatch dashboard --------
    const dashboard = new cw.Dashboard(this, 'UploadsDashboard', {
      dashboardName: `${this.stackName}-Uploads`,
    });

    const qVisible = thumbQueue.metricApproximateNumberOfMessagesVisible({
      statistic: 'Average', period: Duration.minutes(1),
    });
    const qAge = thumbQueue.metricApproximateAgeOfOldestMessage({
      statistic: 'Maximum', period: Duration.minutes(1),
    });
    const sfnSucceeded = thumbSm.metric('ExecutionsSucceeded', {
      statistic: 'Sum', period: Duration.minutes(5),
    });
    const sfnFailed = thumbSm.metric('ExecutionsFailed', {
      statistic: 'Sum', period: Duration.minutes(5),
    });
    const startErrors = startThumbFn.metricErrors({ period: Duration.minutes(1) });
    const workerErrors = thumbFn.metricErrors({ period: Duration.minutes(1) });

    dashboard.addWidgets(
      new cw.GraphWidget({
        title: 'Thumb Queue Depth',
        left: [qVisible], right: [qAge], leftYAxis: { min: 0 }, width: 24,
      }),
      new cw.GraphWidget({
        title: 'Step Functions Executions',
        left: [sfnSucceeded, sfnFailed], width: 24,
      }),
      new cw.GraphWidget({
        title: 'Lambda Errors',
        left: [startErrors, workerErrors], width: 24,
      }),
    );

    // -------- Outputs --------
    new CfnOutput(this, 'UploadsApiUrl', { value: this.api.url });
    new CfnOutput(this, 'UploadsBucketName', { value: this.bucket.bucketName });
    new CfnOutput(this, 'ThumbQueueUrl', { value: thumbQueue.queueUrl });
    new CfnOutput(this, 'ThumbsCdnDomainName', { value: thumbsDist.domainName });
    new CfnOutput(this, 'ThumbStateMachineArn', { value: thumbSm.stateMachineArn });
    new CfnOutput(this, 'UploadsDashboardName', { value: dashboard.dashboardName });
  }
}


