import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as ssm from "aws-cdk-lib/aws-ssm";

export interface IdentityStackProps extends cdk.StackProps {
  /** e.g. https://d1so4q6zsby5r.cloudfront.net (no trailing slash) */
  webOrigin: string;
}

/** Resolve a stable, valid Hosted UI domainPrefix */
function resolveCognitoDomainPrefix(scope: Construct): string {
  const fromCtx =
    scope.node.tryGetContext("/sa/dev/cognito/domainprefix") ??
    scope.node.tryGetContext("sa:cognito:domainprefix");
  const fromEnv = process.env.SA_COGNITO_PREFIX;
  const fallback = `sa-dev-${cdk.Stack.of(scope).account}`;

  const raw = String(fromCtx ?? fromEnv ?? fallback).trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(raw)) {
    throw new Error(
      `Invalid Cognito domainPrefix "${raw}". Use lowercase letters, numbers, and hyphens only.`
    );
  }
  console.log(`Using Cognito domainPrefix: ${raw}`);
  return raw;
}

export class IdentityStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: IdentityStackProps) {
    super(scope, id, props);

    const envName = this.node.tryGetContext("env") ?? "dev";
    const webOrigin = props.webOrigin.replace(/\/+$/, ""); // normalize

    // We still allow SSM override for logout root if you ever set it,
    // but we stop using SSM for callback to keep things simple.
    const ssmLogoutRoot = ssm.StringParameter.valueFromLookup(
      this,
      `/sa/${envName}/web/logoutRoot`
    );

    const callbackUrl = `${webOrigin}/callback`;

    const logoutRoot =
      ssmLogoutRoot && typeof ssmLogoutRoot === "string" && !ssmLogoutRoot.startsWith("smp:")
        ? ssmLogoutRoot
        : webOrigin;

    // --- User Pool ---
    this.userPool = new cognito.UserPool(this, "UserPool", {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      standardAttributes: { email: { required: true, mutable: false } },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      removalPolicy:
        envName === "prd" ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // --- Web Client (PKCE) ---
    this.userPoolClient = new cognito.UserPoolClient(this, "WebClient", {
      userPool: this.userPool,
      generateSecret: false,
      preventUserExistenceErrors: true,
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [
          // Prod / CloudFront callback
          callbackUrl,

          // 🔹 Local dev callbacks — MUST include the one used in sa.js
          "http://localhost:5173/callback",
          "http://localhost:5173/callback/",
          "http://localhost:5173/callback/index.html",
        ],
        logoutUrls: [
          `${logoutRoot}/logout/index.html`,
          `${logoutRoot}/logout/`,
          `${logoutRoot}/`,
          "http://localhost:5173/logout/index.html",
          "http://localhost:5173/logout/",
          "http://localhost:5173/",
        ],
      },
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      authFlows: { userSrp: false, userPassword: false },
    });

    // --- Hosted UI Domain ---
    const domainPrefix = resolveCognitoDomainPrefix(this);
    new cognito.UserPoolDomain(this, "HostedUiDomain", {
      userPool: this.userPool,
      cognitoDomain: { domainPrefix },
    });

    // --- Groups ---
    (["FAN", "BESTIE", "CREATOR", "COLLAB", "ADMIN", "PRIME"] as const).forEach(
      (g, i) => {
        new cognito.CfnUserPoolGroup(this, `${g}Group`, {
          groupName: g,
          userPoolId: this.userPool.userPoolId,
          description: `${g} group`,
          precedence: g === "ADMIN" ? 1 : 10 + i,
        });
      }
    );

    // --- Identity Pool ---
    const identityPool = new cognito.CfnIdentityPool(this, "IdentityPool", {
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: this.userPoolClient.userPoolClientId,
          providerName: this.userPool.userPoolProviderName,
        },
      ],
    });

    // --- Outputs ---
    new cdk.CfnOutput(this, "CognitoUserPoolId", {
      value: this.userPool.userPoolId,
    });
    new cdk.CfnOutput(this, "CognitoWebClientId", {
      value: this.userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, "IdentityPoolId", { value: identityPool.ref });
    new cdk.CfnOutput(this, "HostedUiLoginUrl", {
      value:
        `https://${domainPrefix}.auth.${this.region}.amazoncognito.com/login?` +
        `client_id=${this.userPoolClient.userPoolClientId}` +
        `&response_type=code&scope=openid+profile+email` +
        `&redirect_uri=${encodeURIComponent(callbackUrl)}`,
    });
  }
}

