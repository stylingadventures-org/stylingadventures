// lib/stacks/uploads-stack.ts
import {
  Stack,
  StackProps,
  Duration,
  RemovalPolicy,
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

export interface UploadsStackProps extends StackProps {
  userPool: cognito.IUserPool;
  /** Usually your web origin or CDN, e.g. https://stylingadventures.com */
  webOrigin: string;
  /** CloudFront domain serving the site/CDN (optional, used for CORS allow-list) */
  cloudFrontOrigin?: string;
  /** Name of the *web/static* bucket where thumbnails will be written */
  webBucketName: string;
}

export class UploadsStack extends Stack {
  public readonly api: apigw.RestApi;
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: UploadsStackProps) {
    super(scope, id, props);

    const { userPool, webOrigin, cloudFrontOrigin, webBucketName } = props;

    // ---- Allow-list for CORS (normalize + dedupe) ----
    const originsRaw = [
      webOrigin,
      cloudFrontOrigin,
      "https://www.stylingadventures.com",
      "http://localhost:5173",
      "https://localhost:5173",
    ].filter(Boolean) as string[];

    const allowedOrigins = Array.from(
      new Set(originsRaw.map((u) => u.replace(/\/+$/, ""))),
    );

    // ---- Lambda sources ----
    const presignEntry = path.resolve(process.cwd(), "lambda/presign/index.ts");
    const listEntry = path.resolve(process.cwd(), "lambda/list/index.ts");
    const thumbHeadEntry = path.resolve(
      process.cwd(),
      "lambda/thumb-head/index.ts",
    );
    const thumbgenEntry = path.resolve(
      process.cwd(),
      "lambda/thumbgen/index.ts",
    );

    // ---- S3 bucket for uploads (originals) ----
    this.bucket = new s3.Bucket(this, "UploadsBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: false,
      removalPolicy: RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // CORS for direct browser PUT to uploads bucket
    this.bucket.addCorsRule({
      allowedOrigins,
      allowedMethods: [s3.HttpMethods.PUT],
      allowedHeaders: ["*"],
      exposedHeaders: ["ETag", "x-amz-version-id"],
      maxAge: 86400,
    });

    // CORS for GET/HEAD from uploads bucket (if ever used directly)
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

    // ---- Destination web/static bucket (where thumbs live) ----
    const webBucket = s3.Bucket.fromBucketName(
      this,
      "WebBucket",
      webBucketName,
    );

    // ---- Shared env for API Lambdas ----
    const commonEnv = {
      BUCKET: this.bucket.bucketName, // uploads bucket by default
      WEB_ORIGIN: webOrigin,
      ALLOWED_ORIGINS: allowedOrigins.join(","), // used by presign lambda
      THUMBS_PREFIX: "thumbs/",
    };

    // -------- Lambdas (presign/list/head) --------
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

    // ThumbHead must HEAD the *web* bucket, not the uploads bucket
    const thumbHeadFn = new NodejsFunction(this, "ThumbHeadFn", {
      entry: thumbHeadEntry,
      runtime: lambda.Runtime.NODEJS_18_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      timeout: Duration.seconds(10),
      memorySize: 256,
      environment: {
        ...commonEnv,
        BUCKET: webBucket.bucketName, // override!
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });
    webBucket.grantRead(thumbHeadFn);

    // -------- Thumb generator (two-bucket flow + sharp layer) --------
    const sharpLayer = new lambda.LayerVersion(this, "SharpLayer", {
      code: lambda.Code.fromAsset("sharp-layer.zip"),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      description: "sharp for Node.js 18 (linux-x64)",
    });

    const thumbgenFn = new NodejsFunction(this, "ThumbgenFn", {
      entry: thumbgenEntry,
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.X86_64,
      bundling: {
        format: OutputFormat.CJS,
        minify: true,
        sourceMap: true,
        externalModules: ["sharp"], // sharp provided by the layer
      },
      timeout: Duration.seconds(60),
      memorySize: 512,
      environment: {
        UPLOADS_BUCKET: this.bucket.bucketName, // originals come from uploads
        DEST_BUCKET: webBucket.bucketName, // thumbs go to web bucket
        THUMBS_PREFIX: "thumbs/",
        MAX_WIDTH: "360",
        JPEG_QUALITY: "80",
      },
      layers: [sharpLayer],
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Permissions: read originals, write thumbs
    this.bucket.grantRead(thumbgenFn);
    webBucket.grantReadWrite(thumbgenFn);

    // S3 -> Lambda: generate thumbs for images under users/
    for (const ext of [".png", ".jpg", ".jpeg", ".webp"]) {
      this.bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED,
        new s3n.LambdaDestination(thumbgenFn),
        { prefix: "users/", suffix: ext },
      );
    }

    // ---- API Gateway (Cognito authorizer) ----
    const authorizer = new apigw.CognitoUserPoolsAuthorizer(
      this,
      "UploadsAuth",
      {
        cognitoUserPools: [userPool],
      },
    );

    // NOTE: we let our Lambda handle CORS, so we do NOT use defaultCorsPreflightOptions here
    this.api = new apigw.RestApi(this, "UploadsApi", {
      restApiName: "uploads-api",
      deployOptions: { stageName: "prod" },
    });

    const listRes = this.api.root.addResource("list");
    const presignRes = this.api.root.addResource("presign");
    const delRes = this.api.root.addResource("delete");
    const headRes = this.api.root.addResource("thumb-head");

    const listInt = new apigw.LambdaIntegration(listFn, { proxy: true });
    const presignInt = new apigw.LambdaIntegration(presignFn, { proxy: true });
    const delInt = new apigw.LambdaIntegration(presignFn, { proxy: true });
    const headInt = new apigw.LambdaIntegration(thumbHeadFn, { proxy: true });

    // ---- /list ----
    listRes.addMethod("GET", listInt, {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer,
    });

    // ---- /presign ----
    presignRes.addMethod("POST", presignInt, {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer,
    });

    presignRes.addMethod("GET", presignInt, {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer,
    });

    // IMPORTANT: let Lambda handle OPTIONS (CORS preflight) with NO auth
    presignRes.addMethod("OPTIONS", presignInt, {
      authorizationType: apigw.AuthorizationType.NONE,
    });

    // ---- /delete ----
    delRes.addMethod("DELETE", delInt, {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer,
    });

    // ---- /thumb-head ----
    headRes.addMethod("GET", headInt, {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer,
    });
  }
}



