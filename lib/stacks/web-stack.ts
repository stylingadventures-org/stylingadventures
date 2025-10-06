import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export class WebStack extends cdk.Stack {
  public readonly distribution: cloudfront.Distribution;
  public readonly siteBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Private site bucket
    this.siteBucket = new s3.Bucket(this, 'SiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      enforceSSL: true,
    });

    // Allow CloudFront to read from the bucket
    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI');
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

    const s3Origin = new origins.S3Origin(this.siteBucket, {
      originAccessIdentity: oai,
    });

    // CloudFront
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: s3Origin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
    });

    // Ensure fresh pages for auth round-trips
    this.distribution.addBehavior('/callback/*', s3Origin, {
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
    });
    this.distribution.addBehavior('/logout/*', s3Origin, {
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
    });

    // Deploy exactly what’s under lib/stacks/web/
    new s3deploy.BucketDeployment(this, 'DeploySite', {
      destinationBucket: this.siteBucket,
      distribution: this.distribution,
      distributionPaths: ['/*', '/callback/*', '/logout/*'],
      sources: [s3deploy.Source.asset(path.resolve(__dirname, 'web'))],
      // Prune default (true) cleans up removed files on next deploy
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionDomainName', {
      value: this.distribution.domainName,
    });
    new cdk.CfnOutput(this, 'StaticSiteBucketName', {
      value: this.siteBucket.bucketName,
    });
  }
}
