// lib/stacks/api-stack.ts
import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as iam from "aws-cdk-lib/aws-iam";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";

export interface ApiStackProps extends StackProps {
  userPool: cognito.IUserPool;
  table: dynamodb.ITable;
  closetApprovalSm: sfn.IStateMachine;
}

export class ApiStack extends Stack {
  public readonly api: appsync.GraphqlApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);
    const { userPool, table, closetApprovalSm } = props;

    // ----- Hello (smoke test) -----
    const helloFn = new lambda.Function(this, "HelloFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(process.cwd(), "lambda/hello")),
      environment: { NODE_OPTIONS: "--enable-source-maps" },
    });

    // ----- AppSync API -----
    this.api = new appsync.GraphqlApi(this, "StylingApi", {
      name: "stylingadventures-api",
      definition: appsync.Definition.fromFile(
        path.join(process.cwd(), "lib/stacks/schema.graphql")
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: { userPool },
        },
      },
      xrayEnabled: true,
    });

    // ----- Roles: Lambda + DS + resolver (Mutation.setUserRole) -----
    const rolesFn = new NodejsFunction(this, "RolesFn", {
      entry: path.join(process.cwd(), "lambda/roles/index.ts"),
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: {
        format: OutputFormat.CJS,
        minify: true,
        sourceMap: true,
        target: "node20",
      },
      environment: {
        NODE_OPTIONS: "--enable-source-maps",
      },
      description: "Resolves Mutation.setUserRole",
    });

    const rolesDs = this.api.addLambdaDataSource("RolesDs", rolesFn);
    rolesDs.createResolver("SetUserRole", {
      typeName: "Mutation",
      fieldName: "setUserRole",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // ----- Hello -> Lambda resolver (Query.hello) -----
    const helloDs = this.api.addLambdaDataSource("HelloDs", helloFn);
    helloDs.createResolver("Hello", {
      typeName: "Query",
      fieldName: "hello",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // ----- Query.me via NONE datasource (fast path for UI) -----
    const noneDs = this.api.addNoneDataSource("NoneDsForMe");
    noneDs.createResolver("Me", {
      typeName: "Query",
      fieldName: "me",
      requestMappingTemplate: appsync.MappingTemplate.fromString(
        `{
  "version": "2018-05-29",
  "payload": {}
}`
      ),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        `$util.toJson({
  "id": $ctx.identity.sub,
  "email": $ctx.identity.claims.get("email"),
  "role": "FAN",
  "tier": "FREE",
  "createdAt": $util.time.nowISO8601(),
  "updatedAt": $util.time.nowISO8601()
})`
      ),
    });

    // ----- Closet resolvers (NodejsFunction bundle) -----
    const closetFn = new NodejsFunction(this, "ClosetResolverFn", {
      entry: path.join(process.cwd(), "lambda/graphql/index.ts"),
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: {
        format: OutputFormat.CJS,
        minify: true,
        sourceMap: true,
        target: "node20",
      },
      environment: {
        TABLE_NAME: table.tableName,
        APPROVAL_SM_ARN: closetApprovalSm.stateMachineArn,
        NODE_OPTIONS: "--enable-source-maps",
      },
      description: "GraphQL field resolver for closet queries/mutations",
    });

    table.grantReadWriteData(closetFn);
    closetFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:GetItem",
          "dynamodb:BatchGetItem",
          "dynamodb:UpdateItem",
          "dynamodb:PutItem",
        ],
        resources: [table.tableArn, `${table.tableArn}/index/*`],
      })
    );
    closetApprovalSm.grantStartExecution(closetFn);

    const closetDs = this.api.addLambdaDataSource("ClosetDs", closetFn);

    // Queries
    closetDs.createResolver("MyCloset", {
      typeName: "Query",
      fieldName: "myCloset",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    closetDs.createResolver("AdminListPendingResolver", {
      typeName: "Query",
      fieldName: "adminListPending",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // Mutations
    closetDs.createResolver("CreateClosetItem", {
      typeName: "Mutation",
      fieldName: "createClosetItem",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    closetDs.createResolver("RequestClosetApproval", {
      typeName: "Mutation",
      fieldName: "requestClosetApproval",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    closetDs.createResolver("AdminApproveItem", {
      typeName: "Mutation",
      fieldName: "adminApproveItem",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    closetDs.createResolver("AdminRejectItem", {
      typeName: "Mutation",
      fieldName: "adminRejectItem",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    closetDs.createResolver("UpdateClosetMediaKey", {
      typeName: "Mutation",
      fieldName: "updateClosetMediaKey",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // ----- Outputs -----
    new cdk.CfnOutput(this, "GraphQlApiUrl", { value: this.api.graphqlUrl });
    new cdk.CfnOutput(this, "GraphQlApiId", { value: this.api.apiId });
  }
}

