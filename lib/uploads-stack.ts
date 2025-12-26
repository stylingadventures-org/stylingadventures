import {
  Stack,
  StackProps,
  RemovalPolicy,
  CfnOutput,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
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

    // In dev we want to allow local Vite origin as well as the deployed origins.
    const localDevOrigin = "http://localhost:5173";
    const appDomain = "https://app.stylingadventures.com";

    const corsAllowedOrigins = Array.from(
      new Set(
        envName === "prd"
          ? [webOrigin, appDomain]
          : [webOrigin, appDomain, localDevOrigin]
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
        // 👈 match what the lambda code expects
        UPLOADS_BUCKET_NAME: this.uploadsBucket.bucketName,
      },
    });

    // Allow Lambda to PUT (and sign for GET) objects into the uploads bucket
    this.uploadsBucket.grantReadWrite(uploadApiFn);

    //
    // 2.5) OAuth Token Exchange Lambda
    //
    const tokenExchangeFn = new NodejsFunction(this, "TokenExchangeFn", {
      entry: "lambda/oauth/token-exchange/index.js",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: {
        format: OutputFormat.CJS,
        minify: false,
        sourceMap: true,
      },
      environment: {
        COGNITO_DOMAIN: "https://sa-dev-637423256673.auth.us-east-1.amazoncognito.com",
        CLIENT_ID: "7u9k85rh5h74eretn9hlsme0rl",
        CLIENT_SECRET: "123lrr85uu513pvqrstludgf2bvci4krka29pkt08k8jflhrr39",
        REDIRECT_URI: "https://app.stylingadventures.com/callback",
      },
    });

    //
    // 3) REST API exposing POST /presign, /get, and /oauth/token
    //
    const api = new apigw.RestApi(this, "UploadsApi", {
      restApiName: `SA-UploadsApi-${envName}`,
      defaultCorsPreflightOptions: {
        allowOrigins: corsAllowedOrigins,
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: apigw.Cors.DEFAULT_HEADERS,
      },
    });

    const presignResource = api.root.addResource("presign");
    presignResource.addMethod(
      "POST",
      new apigw.LambdaIntegration(uploadApiFn),
      {
        authorizationType: apigw.AuthorizationType.NONE,
      },
    );

    // (Optional) /get route if we ever want signed GETs from the API
    const getResource = api.root.addResource("get");
    getResource.addMethod(
      "POST",
      new apigw.LambdaIntegration(uploadApiFn),
      {
        authorizationType: apigw.AuthorizationType.NONE,
      },
    );

    // OAuth token exchange endpoint
    const oauthResource = api.root.addResource("oauth");
    const tokenResource = oauthResource.addResource("token");
    tokenResource.addMethod(
      "POST",
      new apigw.LambdaIntegration(tokenExchangeFn),
      {
        authorizationType: apigw.AuthorizationType.NONE,
      },
    );

    // Output the root URL (e.g. https://xxxx.execute-api.us-east-1.amazonaws.com/prod/)
    new CfnOutput(this, "UploadsApiUrl", {
      value: api.url,
      exportName: `SA-UploadsApiUrl-${envName}`,
    });

    //
    // 4) Closet background worker (lambda/closet/bg-worker.ts)
    //
    const closetBgWorkerFn = new NodejsFunction(this, "ClosetBgWorkerFn", {
      entry: "lambda/closet/bg-worker.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: {
        format: OutputFormat.CJS,
        minify: true,
        sourceMap: true,
      },
      environment: {
        // used by bg-worker.ts
        TABLE_NAME: props.table.tableName,
        RAW_MEDIA_GSI_NAME: "rawMediaKeyIndex", // matches the GSI name in the closet table
        OUTPUT_BUCKET: this.uploadsBucket.bucketName,
      },
    });

    // Permissions: S3 read/write + DDB read/write
    this.uploadsBucket.grantReadWrite(closetBgWorkerFn);
    props.table.grantReadWriteData(closetBgWorkerFn);

    // S3 trigger: whenever a new closet object is uploaded, run bg-worker
    this.uploadsBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(closetBgWorkerFn),
      {
        prefix: "closet/", // only run on closet uploads
      },
    );
  }
}
