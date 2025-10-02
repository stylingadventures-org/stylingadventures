import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as node from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';

interface UploadsStackProps extends cdk.StackProps {
  userPool: cognito.IUserPool;
}

export class UploadsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: UploadsStackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'UploadsBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const fn = new node.NodejsFunction(this, 'PresignFn', {
      entry: 'lambda/presign/index.ts',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: { BUCKET: bucket.bucketName },
    });

    // Least-privilege: allow ListBucket only for the user's prefix, and read/write only under users/*
    fn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['s3:ListBucket'],
      resources: [bucket.bucketArn],
      conditions: { StringLike: { 's3:prefix': ['users/*'] } },
    }));
    fn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
      resources: [bucket.arnForObjects('users/*')],
    }));

    const api = new apigw.RestApi(this, 'UploadsApi', {
      deployOptions: { stageName: 'prod' },
      defaultCorsPreflightOptions: {
        allowHeaders: ['Authorization', 'Content-Type'],
        allowOrigins: apigw.Cors.ALL_ORIGINS, // (tighten to CloudFront domain after first deploy)
        allowMethods: ['GET', 'POST', 'OPTIONS'],
      },
    });

    const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [props.userPool],
      identitySource: 'method.request.header.Authorization',
    });

    const integration = new apigw.LambdaIntegration(fn);

    const presign = api.root.addResource('presign');
    presign.addMethod('POST', integration, { authorizer, authorizationType: apigw.AuthorizationType.COGNITO });

    const list = api.root.addResource('list');
    list.addMethod('GET', integration, { authorizer, authorizationType: apigw.AuthorizationType.COGNITO });

    new cdk.CfnOutput(this, 'UploadsBucketName', { value: bucket.bucketName });
    new cdk.CfnOutput(this, 'ApiGatewayUrl', { value: api.url });
  }
}
