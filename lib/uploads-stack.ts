import { Stack, StackProps, RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as ddb from "aws-cdk-lib/aws-dynamodb";

export interface UploadsStackProps extends StackProps {
  userPool: cognito.IUserPool;
  webOrigin: string;          // 👈 NEW
  cloudFrontOrigin: string;   // 👈 NEW
  webBucketName: string;      // 👈 NEW
  table: ddb.ITable;          // 👈 NEW
}

export class UploadsStack extends Stack {
  public readonly uploadsBucket: s3.Bucket; // 👈 already exposed, keep public

  constructor(scope: Construct, id: string, props: UploadsStackProps) {
    super(scope, id, props);

    const { webOrigin, cloudFrontOrigin, webBucketName, table, userPool } = props;

    const envName = this.node.tryGetContext("env") ?? "dev";

    this.uploadsBucket = new s3.Bucket(this, "UploadsBucket", {
      bucketName: webBucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    new CfnOutput(this, "UploadsBucketName", {
      value: this.uploadsBucket.bucketName,
      exportName: `SA-UploadsBucketName-${envName}`,
    });

    // TODO: use webOrigin / cloudFrontOrigin / table / userPool
    // for CORS config, presign APIs, and auth-wiring as needed.
  }
}
