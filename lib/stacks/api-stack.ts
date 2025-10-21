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
import { RolesConstruct } from '../roles/RolesConstruct';

export interface ApiStackProps extends StackProps {
  userPool: cognito.IUserPool;
  /** Primary app table (single-table design) */
  table: dynamodb.ITable;
  /** Closet approval state machine (Standard) */
  closetApprovalSm: sfn.IStateMachine;
}

export class ApiStack extends Stack {
  public readonly api: appsync.GraphqlApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { userPool, table, closetApprovalSm } = props;

    // ---- Hello Lambda (for Query.hello smoke test)
    const helloFn = new lambda.Function(this, "HelloFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(process.cwd(), "lambda/hello")),
      environment: { NODE_OPTIONS: "--enable-source-maps" },
    });

    // ---- AppSync (schema from repo path)
    this.api = new appsync.GraphqlApi(this, "StylingApi", {
      name: "stylingadventures-api",
      schema: appsync.SchemaFile.fromAsset(
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

    // ---- Roles (attach roles/resources tied to this API)
    new RolesConstruct(this, "Roles", { api: this.api });

    // ---- Resolver: Query.hello -> helloFn
    const helloDs = this.api.addLambdaDataSource("HelloDS", helloFn);
    helloDs.createResolver("HelloResolver", {
      typeName: "Query",
      fieldName: "hello",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // =========================
    // Closet resolvers (Mutations)
    // =========================

    // Single Lambda that routes by event.info.fieldName
    const closetFn = new lambda.Function(this, "ClosetResolverFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler", // index.ts exports handler that switches on fieldName
      code: lambda.Code.fromAsset(path.join(process.cwd(), "lambda/graphql")),
      environment: {
        TABLE_NAME: table.tableName,
        APPROVAL_SM_ARN: closetApprovalSm.stateMachineArn,
        NODE_OPTIONS: "--enable-source-maps",
      },
    });

    // Permissions
    table.grantReadWriteData(closetFn);
    closetApprovalSm.grantStartExecution(closetFn);

    // Data source + two resolvers
    const closetDs = this.api.addLambdaDataSource("ClosetDS", closetFn);

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

    // ---- Outputs
    new cdk.CfnOutput(this, "GraphQlApiUrl", { value: this.api.graphqlUrl });
    new cdk.CfnOutput(this, "GraphQlApiId", { value: this.api.apiId });
  }
}
