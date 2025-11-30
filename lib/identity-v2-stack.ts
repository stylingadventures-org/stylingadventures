import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";

export interface IdentityV2StackProps extends StackProps {
  envName: string;
  webOrigin: string;
  cognitoDomainPrefix?: string;
}

export class IdentityV2Stack extends Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: IdentityV2StackProps) {
    super(scope, id, props);

    const { envName, webOrigin } = props;

    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: `sa2-${envName}-users`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: false,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: false,
        },
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
    });

    const adminGroup = new cognito.CfnUserPoolGroup(this, "AdminGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "admin",
      description: "Platform admins",
    });

    const creatorGroup = new cognito.CfnUserPoolGroup(this, "CreatorGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "creator",
      description: "Pro creators with access to creator tools",
    });

    creatorGroup.addDependency(adminGroup);

    this.userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool: this.userPool,
      userPoolClientName: `sa2-${envName}-web-client`,
      generateSecret: false,
      oAuth: {
        flows: { implicitCodeGrant: true },
        callbackUrls: [webOrigin],
        logoutUrls: [webOrigin],
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
    });

    new CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
    });

    new CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
    });

    new CfnOutput(this, "WebOrigin", {
      value: webOrigin,
    });
  }
}
