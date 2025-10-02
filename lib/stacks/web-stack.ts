import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
// NEW: add these imports
import * as fs from 'fs';
import * as path from 'path';

export class WebStack extends cdk.Stack {
  public readonly distribution: cloudfront.Distribution;
  public readonly siteBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Private bucket for the site
    this.siteBucket = new s3.Bucket(this, 'SiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      enforceSSL: true,
    });

    // Origin Access Identity (compatible across CDK versions)
    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI');

    const s3Origin = new origins.S3Origin(this.siteBucket, {
      originAccessIdentity: oai,
    });

    // CloudFront distribution with SPA default root
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: s3Origin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
    });

    // Disable caching for callback/logout so you always see fresh pages
    this.distribution.addBehavior('/callback/*', s3Origin, {
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    });
    this.distribution.addBehavior('/logout/*', s3Origin, {
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    });

    // Bucket policy: allow CloudFront (OAI) to read objects
    this.siteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [this.siteBucket.arnForObjects('*')],
        principals: [
          new iam.CanonicalUserPrincipal(
            oai.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );

    // --- REPLACED BucketDeployment sources array ---
    // Resolve and read the root index.html (next to this file)
    const indexPath = path.resolve(__dirname, 'index.html');
    if (!fs.existsSync(indexPath)) {
      throw new Error(`Expected index.html at ${indexPath} but it was not found.`);
    }
    const indexHtml = fs.readFileSync(indexPath, { encoding: 'utf8' });

    new s3deploy.BucketDeployment(this, 'DeploySite', {
      destinationBucket: this.siteBucket,
      distribution: this.distribution,
      distributionPaths: ['/*', '/callback/*', '/logout/*'],
      sources: [
        // 1) Upload root index.html
        s3deploy.Source.data('index.html', indexHtml),

        // 2) Upload the small web pages (/callback and /logout)
        s3deploy.Source.asset(path.resolve(__dirname, 'web')),
      ],
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionDomainName', {
      value: this.distribution.domainName,
    });
    new cdk.CfnOutput(this, 'StaticSiteBucketName', {
      value: this.siteBucket.bucketName,
    });
  }
}
