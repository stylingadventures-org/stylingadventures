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
        minLength: 12, requireLowercase: true, requireUppercase: true,
        requireDigits: true, requireSymbols: true
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Updated URLs to include /index.html
    const callback = 'https://d1682i07dc1r3k.cloudfront.net/callback/index.html';
    const logout   = 'https://d1682i07dc1r3k.cloudfront.net/logout/index.html';

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      generateSecret: false,
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE
        ],
        callbackUrls: [callback],
        logoutUrls: [logout],
      },
      authFlows: { userPassword: true, userSrp: true },
    });

    const domainPrefix = `stylingadventures-${(this.account || 'acct').slice(-6)}`.toLowerCase();
    const hostedUiDomain = new cognito.CfnUserPoolDomain(this, 'HostedUiDomain', {
      domain: domainPrefix,
      userPoolId: this.userPool.userPoolId,
    });

    const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [{
        clientId: userPoolClient.userPoolClientId,
        providerName: this.userPool.userPoolProviderName,
      }],
    });

    // ---- Outputs (unique IDs) ----
    new cdk.CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'IdentityPoolId', { value: identityPool.ref });
    new cdk.CfnOutput(this, 'HostedUiDomainName', { value: hostedUiDomain.domain! });
    new cdk.CfnOutput(this, 'HostedUiUrl', {
      value: `https://${hostedUiDomain.domain}.auth.${this.region}.amazoncognito.com/login?client_id=${userPoolClient.userPoolClientId}&response_type=code&scope=openid+profile+email&redirect_uri=${encodeURIComponent(callback)}`,
    });
  }
}

