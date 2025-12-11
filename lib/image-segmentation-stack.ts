// lib/image-segmentation-stack.ts
import {
  Stack,
  StackProps,
  Duration,
  RemovalPolicy,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ecrAssets from "aws-cdk-lib/aws-ecr-assets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as apigw from "aws-cdk-lib/aws-apigateway";

export class ImageSegmentationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Buckets
    const rawBucket = new s3.Bucket(this, "RawImagesBucket", {
      bucketName: `${this.account}-fashion-images-raw`,
      removalPolicy: RemovalPolicy.RETAIN,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    const processedBucket = new s3.Bucket(this, "ProcessedImagesBucket", {
      bucketName: `${this.account}-fashion-images-processed`,
      removalPolicy: RemovalPolicy.RETAIN,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // Container image built from local Dockerfile
    const imageAsset = new ecrAssets.DockerImageAsset(this, "SegmentationImage", {
      directory: "./image-segmentation-lambda", // folder with Dockerfile
    });

    const segmentLambda = new lambda.Function(this, "SegmentClothingLambda", {
      code: lambda.Code.fromEcrImage(imageAsset.repository, {
        tagOrDigest: imageAsset.imageTag,
      }),
      handler: lambda.Handler.FROM_IMAGE, // using container CMD
      runtime: lambda.Runtime.FROM_IMAGE,
      memorySize: 2048, // tune as needed
      timeout: Duration.seconds(30),
      environment: {
        RAW_BUCKET_NAME: rawBucket.bucketName,
        PROCESSED_BUCKET_NAME: processedBucket.bucketName,
      },
    });

    // Grant least-privilege S3 access
    rawBucket.grantRead(segmentLambda);
    processedBucket.grantWrite(segmentLambda);

    // S3 event trigger (optional, if you want auto-processing on upload)
    rawBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(segmentLambda),
      {
        prefix: "closet/", // optional: only process certain prefixes
      }
    );

    // Simple REST API to call it directly (e.g., from AppSync HTTP resolver or backend tools)
    const api = new apigw.LambdaRestApi(this, "SegmentationApi", {
      handler: segmentLambda,
      proxy: true,
      deployOptions: {
        stageName: "v1",
      },
    });

    // Optional: narrow IAM policy further (example of explicit policy)
    segmentLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [rawBucket.arnForObjects("closet/*")],
      })
    );
    segmentLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:PutObject"],
        resources: [processedBucket.arnForObjects("closet/*")],
      })
    );
  }
}
