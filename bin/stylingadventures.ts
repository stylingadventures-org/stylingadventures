// lib/stacks/uploads-stack.ts
import { Stack, StackProps, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as path from 'path';

// ✅ This is the important part: webOrigin is defined here
export interface UploadsStackProps extends StackProps {
  userPool: cognito.IUserPool;
  webOrigin: string; // e.g. https://dxxxxxx.cloudfront.net
}

export class UploadsStack extends Stack {
  public readonly api: apigw.RestApi;
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: UploadsStackProps) {
    super(scope, id, props);

    const { userPool, webOrigin } = props;

    // Bucket for uploads
    this.bucket = new s3.Bucket(this, 'UploadsBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // Minimal presign Lambda (replace with your existing code if you have it)
    const presignFn = new lambda.Function(this, 'PresignFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      timeout: Duration.seconds(30),
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/presign')),
      environment: {
        BUCKET_NAME: this.bucket.bucketName,
      },
    });
    this.bucket.grantReadWrite(presignFn);

    // Cognito authorizer for API Gateway
    const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'UploadsAuthorizer', {
      cognitoUserPools: [userPool],
    });

    // REST API with CORS that allows ONLY your CloudFront origin
    this.api = new apigw.RestApi(this, 'UploadsApi', {
      restApiName: 'uploads-api',
      deployOptions: { stageName: 'prod' },
      defaultCorsPreflightOptions: {
        allowOrigins: [webOrigin],
        allowHeaders: [
          'Authorization',
          'Content-Type',
          'X-Amz-Date',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent',
          'X-Requested-With',
        ],
        allowMethods: apigw.Cors.ALL_METHODS,
      },
      defaultMethodOptions: {
        authorizer,
        authorizationType: apigw.AuthorizationType.COGNITO,
      },
    });

    // Routes
    const list = this.api.root.addResource('list');
    const presign = this.api.root.addResource('presign');
    const del = this.api.root.addResource('delete');
    const thumb = this.api.root.addResource('thumb');

    // Integrations (swap to your real lambdas if you have them)
    const presignIntegration = new apigw.LambdaIntegration(presignFn);

    list.addMethod('GET', presignIntegration);           // placeholder list
    presign.addMethod('POST', presignIntegration);       // real presign
    del.addMethod('DELETE', new apigw.MockIntegration({
      integrationResponses: [{ statusCode: '204' }],
      requestTemplates: { 'application/json': '{"statusCode": 204}' },
    }), { methodResponses: [{ statusCode: '204' }] });
    thumb.addMethod('POST', new apigw.MockIntegration({
      integrationResponses: [{ statusCode: '202' }],
      requestTemplates: { 'application/json': '{"statusCode": 202}' },
    }), { methodResponses: [{ statusCode: '202' }] });
  }
}
