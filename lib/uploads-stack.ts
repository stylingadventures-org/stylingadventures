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

export interface UploadsStackProps extends StackProps {
  userPool: cognito.IUserPool;
  webOrigin: string;        // SPA origin (e.g. https://app.example.com)
  cloudFrontOrigin: string; // main web CloudFront domain
  webBucketName: string;    // existing WebStack bucket name
  table: ddb.ITable;
}

export class UploadsStack extends Stack {
  public readonly uploadsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: UploadsStackProps) {
    super(scope, id, props);

    const { webOrigin } = props;
    const envName = this.node.tryGetContext("env") ?? "dev";

    // 👇 This is a *separate* uploads bucket.
    // No bucketName specified => CDK generates a unique physical name,
    // so it will NOT conflict with your WebStack bucket.
    this.uploadsBucket = new s3.Bucket(this, "UploadsBucket", {
      removalPolicy:
        envName === "prd" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      autoDeleteObjects: envName !== "prd",
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      // Basic CORS so the SPA can upload directly to S3
      cors: [
        {
          allowedOrigins: [webOrigin],
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
