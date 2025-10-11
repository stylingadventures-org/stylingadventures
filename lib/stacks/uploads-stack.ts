// lib/stacks/uploads-stack.ts
import { Stack, StackProps, Duration, RemovalPolicy, aws_logs as logs, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as path from 'path';

export interface UploadsStackProps extends StackProps {
  userPool: cognito.IUserPool;
  webOrigin: string; // e.g. https://d1682i07dc1r3k.cloudfront.net
}

export class UploadsStack extends Stack {
  public readonly api: apigw.RestApi;
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: UploadsStackProps) {
    super(scope, id, props);
    const { userPool, webOrigin } = props;
    const ORIGIN = `'${webOrigin}'`;

    // ===== S3 bucket =====
    this.bucket = new s3.Bucket(this, 'UploadsBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // ===== Lambda (presign + list in your repo) =====
    const presignFn = new lambdaNode.NodejsFunction(this, 'PresignFn', {
      entry: path.join(__dirname, '../../lambda/presign/index.ts'),
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: Duration.seconds(30),
      memorySize: 256,
      environment: {
        BUCKET: this.bucket.bucketName,   // your lambda reads process.env.BUCKET
        WEB_ORIGIN: webOrigin,            // optional: your lambda can echo this for CORS
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });
    this.bucket.grantReadWrite(presignFn);

    // ===== Cognito authorizer =====
    const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'UploadsAuthorizer', {
      cognitoUserPools: [userPool],
    });

    // ===== API Gateway (CORS restricted to CloudFront) =====
    this.api = new apigw.RestApi(this, 'UploadsApi', {
      restApiName: 'uploads-api',
      deployOptions: { stageName: 'prod' },
      defaultCorsPreflightOptions: {
        allowOrigins: [webOrigin],
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: [
          'Authorization',
          'Content-Type',
          'X-Amz-Date',
          'X-Amz-Security-Token',
          'X-Api-Key',
        ],
        allowCredentials: false,
      },
      defaultMethodOptions: {
        authorizer,
        authorizationType: apigw.AuthorizationType.COGNITO,
      },
    });

    // Ensure error responses carry CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': ORIGIN,
      'Access-Control-Allow-Headers': "'*'",
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

    // Helper to add explicit OPTIONS (guarantees 200 preflight)
    const addOptions = (res: apigw.IResource) => {
      res.addMethod(
        'OPTIONS',
        new apigw.MockIntegration({
          integrationResponses: [{
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': ORIGIN,
              'method.response.header.Access-Control-Allow-Headers': "'Authorization,Content-Type,X-Amz-Date,X-Amz-Security-Token'",
              'method.response.header.Access-Control-Allow-Methods': "'GET,POST,DELETE,OPTIONS'",
            },
          }],
          requestTemplates: { 'application/json': '{"statusCode": 200}' },
        }),
        {
          methodResponses: [{
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
              'method.response.header.Access-Control-Allow-Headers': true,
              'method.response.header.Access-Control-Allow-Methods': true,
            },
          }],
        }
      );
    };

    // ===== Resources =====
    const list    = this.api.root.addResource('list');
    const presign = this.api.root.addResource('presign');
    const del     = this.api.root.addResource('delete');
    const thumb   = this.api.root.addResource('thumb');

    const presignIntegration = new apigw.LambdaIntegration(presignFn);
    list.addMethod('GET',     presignIntegration);
    presign.addMethod('POST', presignIntegration);

    // Simple mocks for delete/thumb (replace later if needed)
    del.addMethod(
      'DELETE',
      new apigw.MockIntegration({
        integrationResponses: [{ statusCode: '204' }],
        requestTemplates: { 'application/json': '{"statusCode": 204}' },
      }),
      { methodResponses: [{ statusCode: '204' }] },
    );
    thumb.addMethod(
      'POST',
      new apigw.MockIntegration({
        integrationResponses: [{ statusCode: '202' }],
        requestTemplates: { 'application/json': '{"statusCode": 202}' },
      }),
      { methodResponses: [{ statusCode: '202' }] },
    );

    // Add explicit OPTIONS so preflight always OK
    [list, presign, del, thumb].forEach(addOptions);

    // ===== Outputs =====
    new CfnOutput(this, 'UploadsApiUrl',     { value: this.api.url });
    new CfnOutput(this, 'UploadsBucketName', { value: this.bucket.bucketName });
  }
}
