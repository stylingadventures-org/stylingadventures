import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cr from "aws-cdk-lib/custom-resources";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";

export interface IdentityStackProps extends StackProps {
  envName: string;
  webOrigin: string;
  cognitoDomainPrefix: string;
  appTable?: dynamodb.ITable; // Optional: for seeding DynamoDB profiles
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

    // 1b) Cognito Groups (platform roles) - used by pre-token-generation Lambda
    const adminGroup = new cognito.CfnUserPoolGroup(this, "AdminGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "ADMIN",
      description: "Platform admins",
    });

    const creatorGroup = new cognito.CfnUserPoolGroup(this, "CreatorGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "CREATOR",
      description: "Pro creators with access to creator tools",
    });

    const bestieGroup = new cognito.CfnUserPoolGroup(this, "BestieGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "BESTIE",
      description: "Bestie subscribers",
    });

    const primeGroup = new cognito.CfnUserPoolGroup(this, "PrimeGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "PRIME",
      description: "Prime subscribers",
    });

    const fanGroup = new cognito.CfnUserPoolGroup(this, "FanGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "FAN",
      description: "Fan / default user group",
    });

    // Optional: deterministic creation order
    creatorGroup.addDependency(adminGroup);
    bestieGroup.addDependency(creatorGroup);
    primeGroup.addDependency(bestieGroup);
    fanGroup.addDependency(primeGroup);

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

    // ---- Seeding test users (if appTable provided) ----
    if (props.appTable) {
      const seedTestUsersFn = new NodejsFunction(this, "SeedTestUsersFn", {
        entry: "lambda/auth/seed-test-users.ts",
        runtime: lambda.Runtime.NODEJS_20_X,
        bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
        environment: {
          TABLE_NAME: props.appTable.tableName,
          USER_POOL_ID: this.userPool.userPoolId,
          NODE_OPTIONS: "--enable-source-maps",
        },
        timeout: require("aws-cdk-lib").Duration.minutes(5),
      });

      // Grant permissions to create/update users and write to DynamoDB
      this.userPool.grant(seedTestUsersFn, "cognito-idp:AdminCreateUser");
      this.userPool.grant(seedTestUsersFn, "cognito-idp:AdminSetUserPassword");
      this.userPool.grant(seedTestUsersFn, "cognito-idp:ListUsers");
      this.userPool.grant(seedTestUsersFn, "cognito-idp:AdminAddUserToGroup");

      props.appTable.grantReadWriteData(seedTestUsersFn);

      // Create custom resource to trigger seeding on stack creation
      const seedTestUsersResource = new cr.AwsCustomResource(
        this,
        "SeedTestUsersResource",
        {
          onUpdate: {
            service: "lambda",
            action: "invoke",
            parameters: {
              FunctionName: seedTestUsersFn.functionName,
              InvocationType: "RequestResponse",
            },
            physicalResourceId: cr.PhysicalResourceId.of(
              "SeedTestUsersResource"
            ),
          },
          policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
            resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
          }),
        }
      );

      seedTestUsersResource.node.addDependency(
        adminGroup,
        creatorGroup,
        bestieGroup,
        primeGroup,
        fanGroup
      );
    }

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
