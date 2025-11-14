// lib/stacks/web-stack.ts
import { Stack, StackProps, CfnOutput, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";

export interface WebStackProps extends StackProps {
  thumbsBucket?: s3.IBucket;
}

export class WebStack extends Stack {
  public readonly distribution: cloudfront.Distribution;
  public readonly siteBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: WebStackProps) {
    super(scope, id, props);

    this.siteBucket = new s3.Bucket(this, "StaticSiteBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: false,
    });

    const siteOai = new cloudfront.OriginAccessIdentity(this, "SiteOai");
    this.siteBucket.grantRead(siteOai);

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
        // NOTE: Using S3Origin for compatibility with your current CDK version.
        // If/when you upgrade, you can switch to S3BucketOrigin.
        origin: new origins.S3Origin(this.siteBucket, { originAccessIdentity: siteOai }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
        functionAssociations: [
          { function: dirIndexFn, eventType: cloudfront.FunctionEventType.VIEWER_REQUEST },
        ],
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
      },
      errorResponses: [
        { httpStatus: 403, responsePagePath: "/index.html", responseHttpStatus: 200, ttl: Duration.seconds(0) },
        { httpStatus: 404, responsePagePath: "/index.html", responseHttpStatus: 200, ttl: Duration.seconds(0) },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    const webRoot = path.join(process.cwd(), "web");

    new s3deploy.BucketDeployment(this, "DeploySite", {
      destinationBucket: this.siteBucket,
      distribution: this.distribution,
      distributionPaths: ["/*"],
      sources: [s3deploy.Source.asset(webRoot)],
      prune: true,
      cacheControl: [
        s3deploy.CacheControl.setPublic(),
        s3deploy.CacheControl.fromString("max-age=0, no-cache, no-store, must-revalidate"),
      ],
    });

    new CfnOutput(this, "CloudFrontDistributionDomainName", {
      value: this.distribution.domainName,
    });
    new CfnOutput(this, "StaticSiteBucketName", {
      value: this.siteBucket.bucketName,
    });
  }
}




