import * as cdk from "aws-cdk-lib";
import { CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as cr from "aws-cdk-lib/custom-resources";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";

export interface IdentityV2StackProps extends cdk.StackProps {
  envName: string;
  webOrigin: string;
  appTable: ddb.Table;
  cognitoDomainPrefix: string;
}

export class IdentityV2Stack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: IdentityV2StackProps) {
    super(scope, id, props);

    const { envName, webOrigin, appTable, cognitoDomainPrefix } = props;

    //
    // User pool
    //
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

    // ✅ LEGACY EXPORT: recreates the exact export name being deleted
    // Keep until all stacks stop importing the old export.
    new cdk.CfnOutput(this, "LegacyUserPoolArnExport", {
      value: this.userPool.userPoolArn,
      exportName:
        "IdentityV2Stack:ExportsOutputFnGetAttUserPool6BA7E5F2Arn686ACC00",
    });

    //
    // Optional: Cognito hosted UI domain
    //
    this.userPool.addDomain("UserPoolDomain", {
      cognitoDomain: {
        domainPrefix: cognitoDomainPrefix,
      },
    });

    //
    // Tier-aware Cognito groups (UPPERCASE, matching Lambda logic)
    //
    const fanGroup = new cognito.CfnUserPoolGroup(this, "FanGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "FAN",
      description: "Default free fan tier",
    });

    const bestieGroup = new cognito.CfnUserPoolGroup(this, "BestieGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "BESTIE",
      description: "Paid bestie tier with perks",
    });

    const collabGroup = new cognito.CfnUserPoolGroup(this, "CollabGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "COLLAB",
      description: "Collaborators / brand partners",
    });

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

    const primeGroup = new cognito.CfnUserPoolGroup(this, "PrimeGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "PRIME",
      description: "Prime Studios / internal prod",
    });

    // Ensure some ordering (optional)
    creatorGroup.addDependency(adminGroup);
    fanGroup.addDependency(adminGroup);
    bestieGroup.addDependency(adminGroup);
    collabGroup.addDependency(adminGroup);
    primeGroup.addDependency(adminGroup);

    //
    // Pre-token generation Lambda (tier-aware auth)
    //
    const preTokenFn = new lambdaNode.NodejsFunction(
      this,
      "PreTokenGenerationFn",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(__dirname, "../lambda/auth/pre-token-generation.ts"),
        handler: "handler",
        environment: {
          TABLE_NAME: appTable.tableName,
          PK_NAME: "pk",
          SK_NAME: "sk",
        },
      },
    );

    // Let it read user profiles from the app table
    appTable.grantReadData(preTokenFn);

    // Attach Lambda as PRE_TOKEN_GENERATION trigger
    this.userPool.addTrigger(
      cognito.UserPoolOperation.PRE_TOKEN_GENERATION,
      preTokenFn,
    );

    //
    // App client
    //
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

    //
    // SeedAdminFn – ensures initial admin(s) are in the right groups
    //
    const seedAdminFn = new lambdaNode.NodejsFunction(this, "SeedAdminFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "../lambda/auth/seed-admin.ts"),
      handler: "handler",
      environment: {
        USER_POOL_ID: this.userPool.userPoolId,
        // set via env var or keep this default for dev
        ADMIN_SEED_EMAILS:
          process.env.ADMIN_SEED_EMAILS ?? "evonifoster@yahoo.com",
        // you can include PRIME here (e.g. "ADMIN,PRIME") if you want dual role
        ADMIN_SEED_GROUPS: process.env.ADMIN_SEED_GROUPS ?? "ADMIN",
      },
    });

    // permissions: manage users and add them to groups in this pool
    seedAdminFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "cognito-idp:ListUsers",
          "cognito-idp:AdminGetUser",
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminUpdateUserAttributes",
          "cognito-idp:AdminAddUserToGroup",
        ],
        resources: [this.userPool.userPoolArn],
      }),
    );

    //
    // Custom resource to trigger seeding on deploy/update
    //
    const seedAdminCustomResource = new cr.AwsCustomResource(
      this,
      "SeedAdminCustomResource",
      {
        onCreate: {
          service: "Lambda",
          action: "invoke",
          parameters: {
            FunctionName: seedAdminFn.functionName,
            InvocationType: "Event",
            Payload: JSON.stringify({ RequestType: "Create" }),
          },
          physicalResourceId: cr.PhysicalResourceId.of(
            `SeedAdmin-${envName}-Create`,
          ),
        },
        onUpdate: {
          service: "Lambda",
          action: "invoke",
          parameters: {
            FunctionName: seedAdminFn.functionName,
            InvocationType: "Event",
            Payload: JSON.stringify({ RequestType: "Update" }),
          },
          physicalResourceId: cr.PhysicalResourceId.of(
            `SeedAdmin-${envName}-Update`,
          ),
        },
        // Explicit policy so the custom resource role can invoke SeedAdminFn
        policy: cr.AwsCustomResourcePolicy.fromStatements([
          new iam.PolicyStatement({
            actions: ["lambda:InvokeFunction"],
            resources: [seedAdminFn.functionArn],
          }),
        ]),
      },
    );

    // Make sure seeding waits for userPool + groups
    seedAdminCustomResource.node.addDependency(this.userPool);
    seedAdminCustomResource.node.addDependency(adminGroup);
    seedAdminCustomResource.node.addDependency(creatorGroup);
    seedAdminCustomResource.node.addDependency(bestieGroup);
    seedAdminCustomResource.node.addDependency(collabGroup);
    seedAdminCustomResource.node.addDependency(fanGroup);
    seedAdminCustomResource.node.addDependency(primeGroup);

    //
    // Outputs
    //
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


