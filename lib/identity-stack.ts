import { Stack, StackProps, CfnOutput, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";

export interface IdentityStackProps extends StackProps {
  envName: string;
  cognitoDomainPrefix: string;
  webOrigin: string; // 👈 NEW
}

export class IdentityStack extends Stack {
  readonly userPool: cognito.UserPool;
  readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: IdentityStackProps) {
    super(scope, id, props);

    const { envName, cognitoDomainPrefix, webOrigin } = props;

    const callbackUrls = [`${webOrigin}/callback`];
    const logoutUrls = [`${webOrigin}/`, `${webOrigin}/logout`];

    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: `stylingadventures-users-${envName}`,
      signInAliases: {
        email: true,
        username: false,
        phone: false,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireDigits: true,
        requireLowercase: true,
        requireUppercase: false,
        requireSymbols: false,
      },
      selfSignUpEnabled: true,
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
    });

    this.userPoolClient = this.userPool.addClient("WebClient", {
      userPoolClientName: `stylingadventures-web-${envName}`,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      preventUserExistenceErrors: true,
      accessTokenValidity: Duration.hours(1),
      idTokenValidity: Duration.hours(1),
      refreshTokenValidity: Duration.days(30),
      oAuth: {
        callbackUrls,
        logoutUrls,
      },
    });

    // Cognito Domain (sa-dev-637423256673 / sa-prod-637423256673)
    this.userPool.addDomain("UserPoolDomain", {
      cognitoDomain: {
        domainPrefix: cognitoDomainPrefix,
      },
    });

    // (Optional) groups for roles – used by your JWT claims like ADMIN, BESTIE, etc.
    const groups = ["FAN", "BESTIE", "CREATOR", "COLLAB", "ADMIN", "PRIME"];
    groups.forEach((name) => {
      new cognito.CfnUserPoolGroup(this, `Group-${name}`, {
        userPoolId: this.userPool.userPoolId,
        groupName: name,
      });
    });

    new CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
      exportName: `SA-UserPoolId-${envName}`,
    });

    new CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
      exportName: `SA-UserPoolClientId-${envName}`,
    });
  }
}
