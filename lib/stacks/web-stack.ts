import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export class WebStack extends Stack {
  public readonly distribution: cloudfront.Distribution;
  public readonly siteBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Private S3 bucket (only CloudFront can read)
    this.siteBucket = new s3.Bucket(this, 'SiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: false,
    });

    // Origin Access Identity for CloudFront -> S3
    const oai = new cloudfront.OriginAccessIdentity(this, 'Oai');
    this.siteBucket.grantRead(oai);

    // Rewrite "/folder" and "/folder/" to "/folder/index.html"
    const dirIndexFn = new cloudfront.Function(this, 'DirIndexRewriteFn', {
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var req = event.request;
  var uri = req.uri || '/';
  if (uri.endsWith('/')) {
    req.uri = uri + 'index.html';
    return req;
  }
  if (uri.indexOf('.') === -1) {
    req.uri = uri + '/index.html';
    return req;
  }
  return req;
}
      `),
    });

    // Use S3Origin (works with OAI in all CDK v2 versions)
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new origins.S3Origin(this.siteBucket, { originAccessIdentity: oai }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
        functionAssociations: [
          {
            function: dirIndexFn,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // Deploy web assets and invalidate CloudFront
    new s3deploy.BucketDeployment(this, 'DeploySite', {
      destinationBucket: this.siteBucket,
      distribution: this.distribution,
      distributionPaths: ['/*'],
      sources: [s3deploy.Source.asset('lib/stacks/web')],
    });

    new CfnOutput(this, 'CloudFrontDistributionDomainName', {
      value: this.distribution.domainName,
    });
    new CfnOutput(this, 'StaticSiteBucketName', {
      value: this.siteBucket.bucketName,
    });
  }
}


