import {
  Stack,
  StackProps,
  RemovalPolicy,
  Duration,
  CfnOutput,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  Bucket,
  BucketEncryption,
  BlockPublicAccess,
  EventType,
} from "aws-cdk-lib/aws-s3";
import { PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import {
  Runtime,
  Code,
  Function as LambdaFn,
} from "aws-cdk-lib/aws-lambda";
import { S3EventSource } from "aws-cdk-lib/aws-lambda-event-sources";

interface UploadsStackProps extends StackProps {
  envName: "dev" | "prod";
}

export class UploadsStack extends Stack {
  public readonly uploadsBucket: Bucket;
  public readonly uploadApiUrl: string;

  constructor(scope: Construct, id: string, props: UploadsStackProps) {
    super(scope, id, props);

    const { envName } = props;
    const isProd = envName === "prod";

    // -----------------------------------------------------------
    // 1. Uploads Bucket
    // -----------------------------------------------------------

    this.uploadsBucket = new Bucket(this, "SAUploadsBucket", {
      bucketName: `sa-uploads-${envName}`,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      autoDeleteObjects: !isProd,
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: ["PUT", "POST", "GET"],
          allowedOrigins: isProd
            ? ["https://stylingadventures.com"]
            : ["http://localhost:5173"],
          exposedHeaders: ["ETag"],
        },
      ],
    });

    // -----------------------------------------------------------
    // 2. Thumbnail Processor Lambda (S3 Trigger)
    // -----------------------------------------------------------

    const thumbFn = new LambdaFn(this, "SAThumbProcessor", {
      runtime: Runtime.NODEJS_18_X,
      handler: "index.handler",
      timeout: Duration.seconds(30),
      memorySize: 2048,
      code: Code.fromAsset("lambda/thumb"), // folder you will create
      environment: {
        BUCKET_NAME: this.uploadsBucket.bucketName,
      },
    });

    this.uploadsBucket.grantReadWrite(thumbFn);

    thumbFn.addEventSource(
      new S3EventSource(this.uploadsBucket, {
        events: [EventType.OBJECT_CREATED],
        filters: [{ prefix: "bestie-closet/" }],
      })
    );

    // -----------------------------------------------------------
    // 3. Upload API Lambda (signed URLs)
    // -----------------------------------------------------------

    const uploadApiFn = new LambdaFn(this, "SAUploadApi", {
      runtime: Runtime.NODEJS_18_X,
      handler: "index.handler",
      timeout: Duration.seconds(15),
      memorySize: 256,
      code: Code.fromAsset("lambda/upload-api"),
      environment: {
        BUCKET_NAME: this.uploadsBucket.bucketName,
        ENV_NAME: envName,
      },
    });

    // Permissions for signed URLs
    this.uploadsBucket.grantPut(uploadApiFn);
    this.uploadsBucket.grantRead(uploadApiFn);

    uploadApiFn.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["s3:PutObject", "s3:GetObject"],
        resources: [`${this.uploadsBucket.bucketArn}/*`],
      })
    );

    // -----------------------------------------------------------
    // 4. API Gateway for Uploads API
    // -----------------------------------------------------------

    const api = new RestApi(this, "SAUploadsApi", {
      restApiName: `SA-${envName}-UploadsApi`,
      deployOptions: {
        stageName: isProd ? "prod" : "dev",
      },
    });

    const uploadResource = api.root.addResource("upload");
    uploadResource.addMethod("POST", new LambdaIntegration(uploadApiFn));

    this.uploadApiUrl = api.url;

    // -----------------------------------------------------------
    // 5. Outputs (Frontend uses these)
    // -----------------------------------------------------------

    new CfnOutput(this, "UploadsBucketName", {
      value: this.uploadsBucket.bucketName,
      exportName: `SA-${envName}-UploadsBucket`,
    });

    new CfnOutput(this, "UploadsApiUrl", {
      value: this.uploadApiUrl,
      exportName: `SA-${envName}-UploadsApiUrl`,
    });
  }
}

