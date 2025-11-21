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
import * as ddb from "aws-cdk-lib/aws-dynamodb";

export interface UploadsStackProps extends StackProps {
  userPool: cognito.IUserPool;
  /** Usually your web origin or CDN, e.g. https://stylingadventures.com */
  webOrigin: string;
  /** CloudFront domain serving the site/CDN (optional, used for CORS allow-list) */
  cloudFrontOrigin?: string;
  /** Name of the *web/static* bucket where thumbnails will be written */
  webBucketName: string;
  /** Main app table so bg-workers can update closet items */
  table: ddb.ITable;
}

export class UploadsStack extends Stack {
  public readonly api: apigw.RestApi;
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: UploadsStackProps) {
    super(scope, id, props);

    const { userPool, webOrigin, cloudFrontOrigin, webBucketName, table } =
      props;

    const disableUploadAuth =
      process.env.DISABLE_UPLOAD_AUTH === "true" ||
      process.env.DISABLE_UPLOAD_AUTH === "1";

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

    const defaultCorsOrigin = allowedOrigins[0] ?? "*";

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

    // -------- Closet background-removal worker (remove.bg) --------
    // This worker watches for new files under "closet/" in the uploads bucket,
    // calls remove.bg, and updates the closet item with the cleaned mediaKey.
    const closetBgWorkerFn = new NodejsFunction(this, "ClosetBgWorkerFn", {
      entry: path.resolve(process.cwd(), "lambda/closet/bg-worker.ts"),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handler",
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      timeout: Duration.seconds(60),
      memorySize: 512,
      environment: {
        TABLE_NAME: table.tableName,
        RAW_MEDIA_GSI_NAME: "rawMediaKeyIndex",
        REMOVE_BG_API_KEY: process.env.REMOVE_BG_API_KEY ?? "",
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    table.grantReadWriteData(closetBgWorkerFn);
    this.bucket.grantReadWrite(closetBgWorkerFn);

    // ✅ Trigger worker only for admin closet uploads.
    // Make sure this prefix matches what `signedUpload` uses for admin closet uploads.
    this.bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(closetBgWorkerFn),
      { prefix: "closet/" },
    );

    // ---- API Gateway (RestApi + CORS error responses) ----
    this.api = new apigw.RestApi(this, "UploadsApi", {
      restApiName: "uploads-api",
      deployOptions: { stageName: "prod" },
    });

    this.api.addGatewayResponse("Default4xxCors", {
      type: apigw.ResponseType.DEFAULT_4XX,
      responseHeaders: {
        "Access-Control-Allow-Origin": `'${defaultCorsOrigin}'`,
        "Access-Control-Allow-Headers": "'Authorization,Content-Type'",
        "Access-Control-Allow-Methods": "'GET,POST,DELETE,OPTIONS'",
      },
    });

    this.api.addGatewayResponse("Default5xxCors", {
      type: apigw.ResponseType.DEFAULT_5XX,
      responseHeaders: {
        "Access-Control-Allow-Origin": `'${defaultCorsOrigin}'`,
        "Access-Control-Allow-Headers": "'Authorization,Content-Type'",
        "Access-Control-Allow-Methods": "'GET,POST,DELETE,OPTIONS'",
      },
    });

    // ---- Cognito authorizer (only when auth is enabled) ----
    let authorizer: apigw.CognitoUserPoolsAuthorizer | undefined;

    if (!disableUploadAuth) {
      authorizer = new apigw.CognitoUserPoolsAuthorizer(this, "UploadsAuth", {
        cognitoUserPools: [userPool],
      });
    }

    const listRes = this.api.root.addResource("list");
    const presignRes = this.api.root.addResource("presign");
    const delRes = this.api.root.addResource("delete");
    const headRes = this.api.root.addResource("thumb-head");

    const listInt = new apigw.LambdaIntegration(listFn, { proxy: true });
    const presignInt = new apigw.LambdaIntegration(presignFn, { proxy: true });
    const delInt = new apigw.LambdaIntegration(presignFn, { proxy: true });
    const headInt = new apigw.LambdaIntegration(thumbHeadFn, { proxy: true });

    const securedMethodAuth: apigw.MethodOptions = disableUploadAuth
      ? {
          authorizationType: apigw.AuthorizationType.NONE,
        }
      : {
          authorizationType: apigw.AuthorizationType.COGNITO,
          authorizer: authorizer!,
        };

    // ---- /list ----
    listRes.addMethod("GET", listInt, {
      ...securedMethodAuth,
    });

    // ---- /presign ----
    presignRes.addMethod("POST", presignInt, {
      ...securedMethodAuth,
    });

    presignRes.addMethod("GET", presignInt, {
      ...securedMethodAuth,
    });

    // OPTIONS handled by Lambda, no auth (for CORS preflight)
    presignRes.addMethod("OPTIONS", presignInt, {
      authorizationType: apigw.AuthorizationType.NONE,
    });

    // ---- /delete ----
    delRes.addMethod("DELETE", delInt, {
      ...securedMethodAuth,
    });

    // ---- /thumb-head ----
    headRes.addMethod("GET", headInt, {
      ...securedMethodAuth,
    });
  }
}

