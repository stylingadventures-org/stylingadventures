// lib/stacks/uploads-stack.ts
import {
  Stack,
  StackProps,
  Duration,
  RemovalPolicy,
  CfnOutput,
  aws_logs as logs,
} from "aws-cdk-lib";
import { Construct } from "constructs";

import * as path from "path";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import * as cognito from "aws-cdk-lib/aws-cognito";

// NEW: CloudFront
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";

export interface UploadsStackProps extends StackProps {
  userPool: cognito.IUserPool;
  /** e.g. https://stylingadventures.com (apex/app origin) */
  webOrigin: string;
  /** CloudFront domain serving the site, e.g. https://d1682i07dc1r3k.cloudfront.net */
  cloudFrontOrigin?: string;
}

export class UploadsStack extends Stack {
  public readonly api: apigw.RestApi;
  public readonly bucket: s3.Bucket;
  // NEW: CDN
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: UploadsStackProps) {
    super(scope, id, props);

    const {
      userPool,
      webOrigin,
      cloudFrontOrigin = "https://d1682i07dc1r3k.cloudfront.net",
    } = props;

    // ---- Allow-list used by Lambdas and S3 CORS (normalized, unique) ----
    const allowedOrigins = Array.from(
      new Set(
        [
          cloudFrontOrigin,
          webOrigin,
          "https://www.stylingadventures.com",
          "http://localhost:5173",
        ]
          .filter(Boolean)
          .map((u) => u.replace(/\/+$/, ""))
      )
    );

    // ---- Lambda sources ----
    const presignEntry   = path.resolve(process.cwd(), "lambda/presign/index.ts");
    const listEntry      = path.resolve(process.cwd(), "lambda/list/index.ts");
    const thumbHeadEntry = path.resolve(process.cwd(), "lambda/thumb-head/index.ts");
    const thumbgenEntry  = path.resolve(process.cwd(), "lambda/thumbgen/index.ts");

    // ---- S3 bucket for uploads ----
    this.bucket = new s3.Bucket(this, "UploadsBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: false,
      removalPolicy: RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // S3 CORS
    this.bucket.addCorsRule({
      allowedOrigins,
      allowedMethods: [s3.HttpMethods.PUT],
      allowedHeaders: ["*"],
      exposedHeaders: ["ETag", "x-amz-version-id"],
      maxAge: 86400,
    });
    this.bucket.addCorsRule({
      allowedOrigins,
      allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
      allowedHeaders: ["Origin", "Accept", "Referer", "User-Agent", "Range"],
      exposedHeaders: [
        "ETag",
        "Content-Type",
        "Content-Length",
        "Last-Modified",
        "Accept-Ranges",
      ],
      maxAge: 86400,
    });

    // ---- Lambdas ----
    const commonEnv = {
      BUCKET: this.bucket.bucketName,
      WEB_ORIGIN: webOrigin,
      ALLOWED_ORIGINS: allowedOrigins.join(","),
    };

    const presignFn = new NodejsFunction(this, "PresignFn", {
      entry: presignEntry,
      runtime: lambda.Runtime.NODEJS_18_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      timeout: Duration.seconds(30),
      memorySize: 256,
      environment: { ...commonEnv },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });
    this.bucket.grantReadWrite(presignFn);

    const listFn = new NodejsFunction(this, "ListFn", {
      entry: listEntry,
      runtime: lambda.Runtime.NODEJS_18_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      timeout: Duration.seconds(30),
      memorySize: 256,
      environment: { ...commonEnv },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });
    this.bucket.grantRead(listFn);

    const thumbHeadFn = new NodejsFunction(this, "ThumbHeadFn", {
      entry: thumbHeadEntry,
      runtime: lambda.Runtime.NODEJS_18_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      timeout: Duration.seconds(10),
      memorySize: 256,
      environment: { ...commonEnv },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });
    this.bucket.grantRead(thumbHeadFn);

    const thumbgenFn = new NodejsFunction(this, "ThumbgenFn", {
      entry: thumbgenEntry,
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.X86_64,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      timeout: Duration.seconds(60),
      memorySize: 512,
      environment: { BUCKET: this.bucket.bucketName },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });
    this.bucket.grantReadWrite(thumbgenFn);

    // S3 -> thumbgen for images under users/
    for (const ext of [".png", ".jpg", ".jpeg", ".webp"]) {
      this.bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED,
        new s3n.LambdaDestination(thumbgenFn),
        { prefix: "users/", suffix: ext },
      );
    }

    // ---- API Gateway (auth by Cognito; Lambdas handle CORS) ----
    const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, "UploadsAuth", {
      cognitoUserPools: [userPool],
    });

    this.api = new apigw.RestApi(this, "UploadsApi", {
      restApiName: "uploads-api",
      deployOptions: { stageName: "prod" },
    });

    const listRes    = this.api.root.addResource("list");
    const presignRes = this.api.root.addResource("presign");
    const delRes     = this.api.root.addResource("delete");
    const headRes    = this.api.root.addResource("thumb-head");

    const listInt    = new apigw.LambdaIntegration(listFn);
    const presignInt = new apigw.LambdaIntegration(presignFn);
    const delInt     = new apigw.LambdaIntegration(presignFn);
    const headInt    = new apigw.LambdaIntegration(thumbHeadFn);

    listRes.addMethod("GET",     listInt,    { authorizationType: apigw.AuthorizationType.COGNITO, authorizer });
    presignRes.addMethod("POST", presignInt, { authorizationType: apigw.AuthorizationType.COGNITO, authorizer });
    delRes.addMethod("DELETE",   delInt,     { authorizationType: apigw.AuthorizationType.COGNITO, authorizer });
    headRes.addMethod("GET",     headInt,    { authorizationType: apigw.AuthorizationType.COGNITO, authorizer });

    listRes.addMethod("OPTIONS",    listInt,    { authorizationType: apigw.AuthorizationType.NONE });
    presignRes.addMethod("OPTIONS", presignInt, { authorizationType: apigw.AuthorizationType.NONE });
    delRes.addMethod("OPTIONS",     delInt,     { authorizationType: apigw.AuthorizationType.NONE });
    headRes.addMethod("OPTIONS",    headInt,    { authorizationType: apigw.AuthorizationType.NONE });

    // ---- CloudFront CDN for thumbs (GET/HEAD only) ----
    const oai = new cloudfront.OriginAccessIdentity(this, "UploadsOai");
    this.bucket.grantRead(oai);

    this.distribution = new cloudfront.Distribution(this, "UploadsCdn", {
      defaultBehavior: {
        origin: new origins.S3Origin(this.bucket, { originAccessIdentity: oai }),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT,
      },
      comment: "CDN for uploads thumbnails",
      defaultRootObject: undefined, // not a website
    });

    // ---- Outputs ----
    new CfnOutput(this, "UploadsApiUrl",     { value: this.api.url });
    new CfnOutput(this, "UploadsBucketName", { value: this.bucket.bucketName });
    new CfnOutput(this, "UploadsCdnUrl",     { value: `https://${this.distribution.domainName}` });
  }
}
