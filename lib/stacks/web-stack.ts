// lib/stacks/web-stack.ts
import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";

// If you ever want to pass a thumbs bucket in the future, you can;
// it's optional and unused by default.
export interface WebStackProps extends StackProps {
  thumbsBucket?: s3.IBucket;
}

export class WebStack extends Stack {
  public readonly distribution: cloudfront.Distribution;
  public readonly siteBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: WebStackProps) {
    super(scope, id, props);

    // Private S3 bucket for the SPA
    this.siteBucket = new s3.Bucket(this, "StaticSiteBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: false,
    });

    // Origin access identity for CloudFront -> S3
    const siteOai = new cloudfront.OriginAccessIdentity(this, "SiteOai");
    this.siteBucket.grantRead(siteOai);

    // Pretty-URL rewrite: /foo => /foo/index.html and / => /index.html
    const dirIndexFn = new cloudfront.Function(this, "DirIndexRewriteFn", {
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var req = event.request;
  var uri = req.uri || '/';
  if (uri.endsWith('/')) { req.uri = uri + 'index.html'; return req; }
  if (uri.indexOf('.') === -1) { req.uri = uri + '/index.html'; return req; }
  return req;
}
      `),
    });

    this.distribution = new cloudfront.Distribution(this, "CloudFrontDistribution", {
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: new origins.S3Origin(this.siteBucket, { originAccessIdentity: siteOai }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
        functionAssociations: [
          { function: dirIndexFn, eventType: cloudfront.FunctionEventType.VIEWER_REQUEST },
        ],
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // Deploy the static app and invalidate the CDN
    new s3deploy.BucketDeployment(this, "DeploySite", {
      destinationBucket: this.siteBucket,
      distribution: this.distribution,
      distributionPaths: ["/*"],
      sources: [s3deploy.Source.asset("lib/stacks/web")],
    });

    new CfnOutput(this, "CloudFrontDistributionDomainName", {
      value: this.distribution.domainName,
    });
    new CfnOutput(this, "StaticSiteBucketName", {
      value: this.siteBucket.bucketName,
    });
  }
}



