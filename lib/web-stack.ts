import {
  Stack,
  StackProps,
  CfnOutput,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as cloudfrontOrigins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53Targets from "aws-cdk-lib/aws-route53-targets";
import * as acm from "aws-cdk-lib/aws-certificatemanager";

export interface WebStackProps extends StackProps {
  envName: string;
  domainName?: string;        // stylingadventures.com for prod
  hostedZoneDomain?: string;  // stylingadventures.com for prod
}

export class WebStack extends Stack {
  readonly bucket: s3.Bucket;
  readonly distribution: cloudfront.Distribution;

  // 👇 new helper properties used by stylingadventures.ts
  readonly webOrigin: string;
  readonly cloudFrontOrigin: string;
  readonly webBucketName: string;

  constructor(scope: Construct, id: string, props: WebStackProps) {
    super(scope, id, props);

    const { envName, domainName, hostedZoneDomain } = props;

    this.bucket = new s3.Bucket(this, "WebBucket", {
      bucketName: `stylingadventures-web-${envName}-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    let certificate: acm.ICertificate | undefined;
    let zone: route53.IHostedZone | undefined;
    let cfDomainNames: string[] | undefined;

    if (domainName && hostedZoneDomain) {
      // Hosted zone must already exist in this account
      zone = route53.HostedZone.fromLookup(this, "HostedZone", {
        domainName: hostedZoneDomain,
      });

      // CloudFront requires cert in us-east-1
      certificate = new acm.DnsValidatedCertificate(this, "SiteCert", {
        domainName,
        hostedZone: zone,
        region: "us-east-1",
      });

      cfDomainNames = [domainName];
    }

    this.distribution = new cloudfront.Distribution(this, "WebDistribution", {
      defaultBehavior: {
        origin: new cloudfrontOrigins.S3Origin(this.bucket),
        viewerProtocolPolicy:
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: "index.html",
      domainNames: cfDomainNames,
      certificate,
    });

    // Route53 alias for prod custom domain
    if (zone && domainName) {
      new route53.ARecord(this, "AliasRecord", {
        zone,
        recordName: domainName,
        target: route53.RecordTarget.fromAlias(
          new route53Targets.CloudFrontTarget(this.distribution),
        ),
      });
    }

    // 👇 populate helper fields
    this.webBucketName = this.bucket.bucketName;
    this.cloudFrontOrigin = `https://${this.distribution.domainName}`;
    // If you’ve configured a custom domain, use that as the origin; otherwise CF domain
    this.webOrigin = domainName
      ? `https://${domainName}`
      : this.cloudFrontOrigin;

    new CfnOutput(this, "WebBucketName", {
      value: this.bucket.bucketName,
      exportName: `SA-WebBucketName-${envName}`,
    });

    new CfnOutput(this, "CloudFrontDistributionId", {
      value: this.distribution.distributionId,
      exportName: `SA-WebDistributionId-${envName}`,
    });

    new CfnOutput(this, "CloudFrontDomainName", {
      value: this.distribution.domainName,
      exportName: `SA-WebDomainName-${envName}`,
    });
  }
}
