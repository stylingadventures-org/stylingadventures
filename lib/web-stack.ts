import { Stack, StackProps, CfnOutput, RemovalPolicy, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as cloudfrontOrigins from "aws-cdk-lib/aws-cloudfront-origins";

export interface WebStackProps extends StackProps {
  envName: string;
}

export class WebStack extends Stack {
  readonly bucket: s3.Bucket;
  readonly distribution: cloudfront.Distribution;

  // helper properties used by other stacks / code
  readonly webOrigin: string;
  readonly cloudFrontOrigin: string;
  readonly webBucketName: string;

  constructor(scope: Construct, id: string, props: WebStackProps) {
    super(scope, id, props);

    const { envName } = props;

    // S3 bucket for static site assets
    this.bucket = new s3.Bucket(this, "WebBucket", {
      // no explicit bucketName – CDK picks a unique one
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: false,
      // keep prod data, auto-clean non-prod
      removalPolicy:
        envName === "prd" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      autoDeleteObjects: envName === "prd" ? false : true,
    });

    // CloudFront Origin Access Identity for secure S3 access
    const oai = new cloudfront.OriginAccessIdentity(
      this,
      "WebOAI",
      {
        comment: "OAI for web bucket",
      }
    );

    // Grant OAI read access to bucket
    this.bucket.grantRead(oai);

    // CloudFront in front of the bucket
    this.distribution = new cloudfront.Distribution(this, "WebDistribution", {
      defaultBehavior: {
        origin: new cloudfrontOrigins.S3Origin(this.bucket, {
          originAccessIdentity: oai,
        }),
        viewerProtocolPolicy:
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: Duration.minutes(5),
        },
      ],
    });

    // helper values for the rest of the app
    this.webBucketName = this.bucket.bucketName;
    this.cloudFrontOrigin = `https://${this.distribution.domainName}`;
    this.webOrigin = this.cloudFrontOrigin;

    // Outputs (for human visibility only; no named exports)
    new CfnOutput(this, "WebBucketName", {
      value: this.bucket.bucketName,
    });

    new CfnOutput(this, "CloudFrontDistributionId", {
      value: this.distribution.distributionId,
    });

    new CfnOutput(this, "CloudFrontDomainName", {
      value: this.distribution.domainName,
    });
  }
}
