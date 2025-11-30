// lib/layout-engine-stack.ts
import {
  Stack,
  StackProps,
  RemovalPolicy,
  CfnOutput,
  Duration,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";

export interface LayoutEngineStackProps extends StackProps {
  envName: string;
}

export class LayoutEngineStack extends Stack {
  public readonly layoutTemplatesBucket: s3.Bucket;
  public readonly layoutValidatorFn: lambda.Function;

  constructor(scope: Construct, id: string, props: LayoutEngineStackProps) {
    super(scope, id, props);

    const { envName } = props;

    // S3 bucket for layout templates + JSON schemas
    this.layoutTemplatesBucket = new s3.Bucket(
      this,
      "LayoutTemplatesBucket",
      {
        bucketName: `sa-${envName}-layout-templates-${this.account}`,
        removalPolicy:
          envName === "prd"
            ? RemovalPolicy.RETAIN
            : RemovalPolicy.DESTROY,
        autoDeleteObjects: envName === "prd" ? false : true,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
      },
    );

    // Lambda to validate layouts against schemas + accessibility rules
    this.layoutValidatorFn = new NodejsFunction(
      this,
      "LayoutValidatorFn",
      {
        entry: "lambda/layout/validate-layout.ts",
        runtime: lambda.Runtime.NODEJS_20_X,
        bundling: {
          format: OutputFormat.CJS,
          minify: true,
          sourceMap: true,
        },
        timeout: Duration.seconds(10),
        memorySize: 512,
        environment: {
          LAYOUT_TEMPLATES_BUCKET: this.layoutTemplatesBucket.bucketName,
          NODE_OPTIONS: "--enable-source-maps",
        },
      },
    );

    this.layoutTemplatesBucket.grantRead(this.layoutValidatorFn);

    new CfnOutput(this, "LayoutTemplatesBucketName", {
      value: this.layoutTemplatesBucket.bucketName,
    });

    new CfnOutput(this, "LayoutValidatorFnArn", {
      value: this.layoutValidatorFn.functionArn,
    });
  }
}
