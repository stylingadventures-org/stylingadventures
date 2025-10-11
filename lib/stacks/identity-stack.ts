import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export class IdentityStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const pool = this.userPool;

    // === CloudFront pages (must match config.json) ===
    const callback = 'https://d1682i07dc1r3k.cloudfront.net/callback/index.html';
    const logout1  = 'https://d1682i07dc1r3k.cloudfront.net/logout/index.html';
    const logout2  = 'https://d1682i07dc1r3k.cloudfront.net/logout/'; // allow trailing slash
    const logout3  = 'https://d1682i07dc1r3k.cloudfront.net/';        // site root

    // Single SPA client for Hosted UI (PKCE code flow)
    const webClient = new cognito.UserPoolClient(this, 'WebClient', {
      userPool: pool,
      generateSecret: false, // public SPA
      preventUserExistenceErrors: true,
      oAuth: {
        flows: { authorizationCodeGrant: true }, // PKCE
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [callback],
        logoutUrls: [logout1, logout2, logout3], // ✅ allow all variants
      },
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30), // enables refresh tokens
      authFlows: { userSrp: false, userPassword: false }, // Hosted UI only
    });

    // Hosted UI domain
    const domainPrefix = `stylingadventures-${(this.account || 'acct').slice(-6)}`.toLowerCase();
    const hostedUiDomain = new cognito.CfnUserPoolDomain(this, 'HostedUiDomain', {
      domain: domainPrefix,
      userPoolId: pool.userPoolId,
    });

    // (Optional) Federated identity pool
    const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [{
        clientId: webClient.userPoolClientId,
        providerName: pool.userPoolProviderName,
      }],
    });

    // ---- Outputs ----
    new cdk.CfnOutput(this, 'CognitoUserPoolId', { value: pool.userPoolId });
    new cdk.CfnOutput(this, 'CognitoWebClientId', { value: webClient.userPoolClientId });
    new cdk.CfnOutput(this, 'IdentityPoolId', { value: identityPool.ref });
    new cdk.CfnOutput(this, 'HostedUiDomainName', { value: hostedUiDomain.domain! });
    new cdk.CfnOutput(this, 'HostedUiLoginUrl', {
      value: `https://${hostedUiDomain.domain}.auth.${this.region}.amazoncognito.com/login?client_id=${webClient.userPoolClientId}&response_type=code&scope=openid+profile+email&redirect_uri=${encodeURIComponent(callback)}`,
    });
  }
}

