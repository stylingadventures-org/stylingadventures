import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as ssm from 'aws-cdk-lib/aws-ssm';

/** Resolve the Hosted UI domainPrefix from CDK context/env with validation. */
function resolveCognitoDomainPrefix(scope: Construct): string {
  // Primary key (the one you set in cdk.json)
  const fromCtx =
    scope.node.tryGetContext('/sa/dev/cognito/domainprefix') ??
    scope.node.tryGetContext('sa:cognito:domainprefix'); // optional alt key

  // Optional CI/env override
  const fromEnv = process.env.SA_COGNITO_PREFIX;

  // Deterministic fallback (never throws on dev)
  const fallback = `sa-dev-${cdk.Stack.of(scope).account}`;

  const raw = String(fromCtx ?? fromEnv ?? fallback).trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(raw)) {
    throw new Error(
      `Invalid Cognito domainPrefix "${raw}". It must contain only lowercase letters, numbers, and hyphens.`
    );
  }

  console.log(`Using Cognito domainPrefix: ${raw}`);
  return raw;
}

export class IdentityStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const envName = this.node.tryGetContext('env') ?? 'dev';

    // --- User Pool ---
    this.userPool = new cognito.UserPool(this, 'UserPool', {
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
        envName === 'prd'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
    });

    const pool = this.userPool;

    // --- URLs from SSM (fallback to current CloudFront) ---
    const defaultDomain = 'https://d1682i07dc1r3k.cloudfront.net';
    const callback =
      ssm.StringParameter.valueFromLookup(
        this,
        `/sa/${envName}/web/callbackUrl`
      ) || `${defaultDomain}/callback/index.html`;
    const logoutRoot =
      ssm.StringParameter.valueFromLookup(
        this,
        `/sa/${envName}/web/logoutRoot`
      ) || defaultDomain;

    // --- Web Client ---
    const webClient = new cognito.UserPoolClient(this, 'WebClient', {
      userPool: pool,
      generateSecret: false,
      preventUserExistenceErrors: true,
      oAuth: {
        flows: { authorizationCodeGrant: true }, // PKCE
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [callback],
        logoutUrls: [
          `${logoutRoot}/logout/index.html`,
          `${logoutRoot}/logout/`,
          `${logoutRoot}/`,
        ],
      },
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      authFlows: { userSrp: false, userPassword: false },
    });

    // --- Hosted UI Domain (Stable + Validated) ---
    const domainPrefix = resolveCognitoDomainPrefix(this);

    new cognito.UserPoolDomain(this, 'HostedUiDomain', {
      userPool: pool,
      cognitoDomain: { domainPrefix },
    });

    // --- Groups ---
    (['FAN', 'BESTIE', 'CREATOR', 'COLLAB', 'ADMIN', 'PRIME'] as const).forEach(
      (g, i) => {
        new cognito.CfnUserPoolGroup(this, `${g}Group`, {
          groupName: g,
          userPoolId: pool.userPoolId,
          description: `${g} group`,
          precedence: g === 'ADMIN' ? 1 : 10 + i,
        });
      }
    );

    // --- (Optional) Identity Pool ---
    const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: webClient.userPoolClientId,
          providerName: pool.userPoolProviderName,
        },
      ],
    });

    // --- Outputs ---
    new cdk.CfnOutput(this, 'CognitoUserPoolId', { value: pool.userPoolId });
    new cdk.CfnOutput(this, 'CognitoWebClientId', {
      value: webClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, 'IdentityPoolId', { value: identityPool.ref });
    new cdk.CfnOutput(this, 'HostedUiLoginUrl', {
      value: `https://${domainPrefix}.auth.${this.region}.amazoncognito.com/login?client_id=${webClient.userPoolClientId}&response_type=code&scope=openid+profile+email&redirect_uri=${encodeURIComponent(
        callback
      )}`,
    });
  }
}