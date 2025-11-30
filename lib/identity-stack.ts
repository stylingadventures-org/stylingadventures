import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";

export interface IdentityStackProps extends StackProps {
  envName: string;
  webOrigin: string;
  // Kept for future use / compatibility, but NOT used anymore
  cognitoDomainPrefix: string;
}

/**
 * IdentityStack
 *
 * - Cognito User Pool
 * - User Pool Client configured for SPA callbacks
 * - Cognito groups: admin, creator
 *
 * NOTE: This version is self-contained and does NOT import any values
 * from other stacks (no Fn.importValue), which avoids
 * AWS::EarlyValidation::ResourceExistenceCheck on cross-stack refs.
 *
 * ALSO: We intentionally DO NOT create a Hosted UI domain here anymore,
 * to avoid domain prefix existence / replacement issues during updates.
 * You can add a domain manually in the console later if needed.
 */
export class IdentityStack extends Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: IdentityStackProps) {
    super(scope, id, props);

    const { envName, webOrigin } = props;

    // 1) User Pool
    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: `sa-${envName}-users`,
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

    // 1b) Cognito Groups (platform roles)
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

    // Optional: deterministic creation order
    creatorGroup.addDependency(adminGroup);

    // 2) User Pool Client for SPA
    this.userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool: this.userPool,
      userPoolClientName: `sa-${envName}-web-client`,
      generateSecret: false, // SPA / browser client
      oAuth: {
        flows: {
          implicitCodeGrant: true,
        },
        callbackUrls: [webOrigin],
        logoutUrls: [webOrigin],
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
    });

    // ❌ No Hosted UI domain here anymore
    // If you want one later, you can either:
    // - Add this back once everything is stable:
    //   this.userPool.addDomain("UserPoolDomain", {
    //     cognitoDomain: { domainPrefix: cognitoDomainPrefix },
    //   });
    // - Or create a domain manually in the AWS console.

    // ---- Outputs (no exportName => no cross-stack dependency) ----
    new CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
    });

    new CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
    });

    new CfnOutput(this, "WebOrigin", {
      value: webOrigin,
    });

    // Groups are static names ("admin", "creator"), so we generally
    // don't need to output them; the app can just use those literals.
  }
}
