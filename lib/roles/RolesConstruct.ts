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

    // DynamoDB for user roles/tiers
    this.table = new dynamodb.Table(this, "UserRolesTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      // modern PITR
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
    });

    new cdk.CfnOutput(this, "UserRolesTableName", {
      value: this.table.tableName,
    });

    // Lambda for Mutation.setUserRole (Query.me handled by NONE DS in ApiStack)
    const rolesFn = new lambda.Function(this, "RolesFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(process.cwd(), "lambda/roles")),
      environment: {
        TABLE_NAME: this.table.tableName,
        NODE_OPTIONS: "--enable-source-maps",
      },
      description: "Resolves Mutation.setUserRole",
    });

    this.table.grantReadWriteData(rolesFn);

    // AppSync DS + resolver(s)
    const rolesDs = api.addLambdaDataSource("RolesDS", rolesFn);

    // IMPORTANT: Only create the mutation resolver here (avoid duplicate `me`)
    rolesDs.createResolver("MutationSetUserRoleResolver", {
      typeName: "Mutation",
      fieldName: "setUserRole",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
  }
}