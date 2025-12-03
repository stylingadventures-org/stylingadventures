import {
  Stack,
  StackProps,
  RemovalPolicy,
  CfnOutput,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigw from "aws-cdk-lib/aws-apigateway";

export interface UploadsStackProps extends StackProps {
  userPool: cognito.IUserPool;
  webOrigin: string;        // SPA origin (e.g. https://app.example.com or CF domain)
  cloudFrontOrigin: string; // main web CloudFront domain (not used yet, but kept)
  webBucketName: string;    // existing WebStack bucket name
  table: ddb.ITable;
}

export class UploadsStack extends Stack {
  public readonly uploadsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: UploadsStackProps) {
    super(scope, id, props);

    const { webOrigin } = props;
    const envName = this.node.tryGetContext("env") ?? "dev";

    // In dev we want to allow local Vite origin as well as the deployed origin.
    const localDevOrigin = "http://localhost:5173";

    const corsAllowedOrigins = Array.from(
      new Set(
        envName === "prd"
          ? [webOrigin]
          : [webOrigin, localDevOrigin]
      ),
    ).filter(Boolean) as string[];

    //
    // 1) Separate uploads bucket
    //
    this.uploadsBucket = new s3.Bucket(this, "UploadsBucket", {
      removalPolicy:
        envName === "prd" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      autoDeleteObjects: envName !== "prd",
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedOrigins: corsAllowedOrigins,
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedHeaders: ["*"],
          exposedHeaders: ["ETag"],
        },
      ],
    });

    new CfnOutput(this, "UploadsBucketName", {
      value: this.uploadsBucket.bucketName,
      exportName: `SA-UploadsBucketName-${envName}`,
    });

    //
    // 2) Lambda using existing upload-api/index.js
    //
    const uploadApiFn = new NodejsFunction(this, "UploadApiFn", {
      entry: "lambda/upload-api/index.js",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: {
        format: OutputFormat.CJS,
        minify: true,
        sourceMap: true,
      },
      environment: {
        BUCKET_NAME: this.uploadsBucket.bucketName,
      },
    });

    // Allow Lambda to PUT objects into the uploads bucket
    this.uploadsBucket.grantPut(uploadApiFn);

    //
    // 3) REST API exposing POST /presign
    //
    const api = new apigw.RestApi(this, "UploadsApi", {
      restApiName: `SA-UploadsApi-${envName}`,
      defaultCorsPreflightOptions: {
        allowOrigins: corsAllowedOrigins,
        allowMethods: apigw.Cors.ALL_METHODS,
        // DEFAULT_HEADERS already includes Content-Type, Authorization, etc.
        allowHeaders: apigw.Cors.DEFAULT_HEADERS,
      },
    });

    const presignResource = api.root.addResource("presign");
    presignResource.addMethod(
      "POST",
      new apigw.LambdaIntegration(uploadApiFn),
      {
        // you can tighten this later if you want Cognito auth
        authorizationType: apigw.AuthorizationType.NONE,
      },
    );

    // Output the root URL (e.g. https://xxxx.execute-api.us-east-1.amazonaws.com/prod/)
    new CfnOutput(this, "UploadsApiUrl", {
      value: api.url,
      exportName: `SA-UploadsApiUrl-${envName}`,
    });

    // If/when you need the existing web bucket for reading assets,
    // you can import it like this (not used yet, so commented out):
    //
    // const webBucket = s3.Bucket.fromBucketName(
    //   this,
    //   "WebBucket",
    //   props.webBucketName,
    // );
    //
    // Then grant read access as needed:
    // webBucket.grantRead(someLambda);
  }
}
