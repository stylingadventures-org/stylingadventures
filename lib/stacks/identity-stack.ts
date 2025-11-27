import {
  Stack,
  StackProps,
  CfnOutput,
  Duration,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  OAuthScope,
  UserPool,
  UserPoolClient,
  UserPoolDomain,
  ProviderAttribute,
  AccountRecovery,
} from "aws-cdk-lib/aws-cognito";
import {
  IdentityPool,
  IdentityPoolAuthenticationProviders,
  UserPoolAuthenticationProvider,
} from "@aws-cdk/aws-cognito-identitypool-alpha";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

interface IdentityStackProps extends StackProps {
  envName: "dev" | "prod";
  hostedZoneDomain: string; // stylingadventures.com
  cognitoDomainPrefix: string; // sa-dev-637423256673
}

export class IdentityStack extends Stack {
  public readonly userPool: UserPool;
  public readonly userPoolClient: UserPoolClient;
  public readonly identityPool: IdentityPool;

  constructor(scope: Construct, id: string, props: IdentityStackProps) {
    super(scope, id, props);

    const { envName, hostedZoneDomain, cognitoDomainPrefix } = props;

    const isProd = envName === "prod";

    // ───────────────────────────────────────────────
    // 1. User Pool
    // ───────────────────────────────────────────────
    this.userPool = new UserPool(this, "SA-UserPool", {
      userPoolName: `SA-${envName}-UserPool`,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      standardAttributes: {
        email: { required: true, mutable: true },
      },
      customAttributes: {
        tier: { stringValue: "FREE" },
      },
    });

    // ───────────────────────────────────────────────
    // 2. User Pool Client
    // ───────────────────────────────────────────────

    const callbackUrls = isProd
      ? [`https://${hostedZoneDomain}/callback`]
      : ["http://localhost:5173/callback"];

    const logoutUrls = isProd
      ? [`https://${hostedZoneDomain}/`]
      : ["http://localhost:5173/"];

    this.userPoolClient = this.userPool.addClient("SA-WebClient", {
      userPoolClientName: `SA-${envName}-WebClient`,
      oAuth: {
        callbackUrls,
        logoutUrls,
        flows: { implicitCodeGrant: true },
        scopes: [OAuthScope.OPENID, OAuthScope.EMAIL],
      },
      supportedIdentityProviders: ["COGNITO"],
      refreshTokenValidity: Duration.days(30),
      idTokenValidity: Duration.hours(12),
    });

    // ───────────────────────────────────────────────
    // 3. Cognito Domain
    // ───────────────────────────────────────────────

    if (!isProd) {
      // DEV — Cognito-hosted domain
      new UserPoolDomain(this, "SA-DevCognitoDomain", {
        userPool: this.userPool,
        cognitoDomain: {
          domainPrefix: cognitoDomainPrefix, // sa-dev-637423256673
        },
      });
    } else {
      // PROD — Custom domain w/ ACM cert
      const certArn = StringParameter.valueForStringParameter(
        this,
        `/sa/prod/cognito/customDomainCertArn`
      );

      new UserPoolDomain(this, "SA-ProdCustomCognitoDomain", {
        userPool: this.userPool,
        customDomain: {
          domainName: `auth.${hostedZoneDomain}`,
          certificate: Certificate.fromCertificateArn(this, "ProdCognitoCert", certArn),
        },
      });
    }

    // ───────────────────────────────────────────────
    // 4. Identity Pool (federated identities)
    // ───────────────────────────────────────────────
    this.identityPool = new IdentityPool(this, "SA-IdentityPool", {
      identityPoolName: `SA-${envName}-IdentityPool`,
      allowUnauthenticatedIdentities: false,
      authenticationProviders: IdentityPoolAuthenticationProviders.fromUserPoolClient(
        new UserPoolAuthenticationProvider({
          userPool: this.userPool,
          userPoolClient: this.userPoolClient,
        })
      ),
    });

    // ───────────────────────────────────────────────
    // 5. Outputs
    // ───────────────────────────────────────────────

    new CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
    });

    new CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
    });

    new CfnOutput(this, "IdentityPoolId", {
      value: this.identityPool.identityPoolId,
    });

    new CfnOutput(this, "CognitoDomain", {
      value: isProd
        ? `https://auth.${hostedZoneDomain}`
        : `https://${cognitoDomainPrefix}.auth.${this.region}.amazoncognito.com`,
    });

    new CfnOutput(this, "CallbackUrl", {
      value: callbackUrls.join(","),
    });
  }
}

