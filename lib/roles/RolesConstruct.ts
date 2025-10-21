// lib/roles/RolesConstruct.ts
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as path from "path";

export interface RolesConstructProps {
  api: appsync.GraphqlApi;
}

export class RolesConstruct extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: RolesConstructProps) {
    super(scope, id);
    const { api } = props;

    // DynamoDB table for user roles/tiers
    this.table = new dynamodb.Table(this, "UserRolesTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      tableName: cdk.Stack.of(this).stackName
        ? undefined
        : "UserRoles", // default (let CFN name it)
    });

    new cdk.CfnOutput(this, "UserRolesTableName", {
      value: this.table.tableName,
    });

    // Lambda that resolves Query.me and Mutation.setUserRole
    const rolesFn = new lambda.Function(this, "RolesFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(process.cwd(), "lambda/roles")
      ),
      environment: {
        TABLE_NAME: this.table.tableName,
        NODE_OPTIONS: "--enable-source-maps",
      },
    });

    this.table.grantReadWriteData(rolesFn);

    // AppSync Lambda data source
    const rolesDs = api.addLambdaDataSource("RolesDS", rolesFn);

    // Attach resolvers to fields that exist in schema.graphql
    rolesDs.createResolver("MeResolver", {
      typeName: "Query",
      fieldName: "me",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    rolesDs.createResolver("SetUserRoleResolver", {
      typeName: "Mutation",
      fieldName: "setUserRole",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
  }
}
