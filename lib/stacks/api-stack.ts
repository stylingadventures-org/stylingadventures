import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

// ✅ custom props so we can pass a user pool from bin/
export interface ApiStackProps extends StackProps {
  userPool: cognito.IUserPool;
}

export class ApiStack extends Stack {
  public readonly api: appsync.GraphqlApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { userPool } = props;

    // Simple “hello” lambda (reuse yours if you already had one)
    const helloFn = new lambda.Function(this, 'HelloFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/hello')),
    });

    // AppSync API protected by Cognito User Pool auth
    this.api = new appsync.GraphqlApi(this, 'StylingApi', {
      name: 'stylingadventures-api',
      schema: appsync.SchemaFile.fromAsset(
        path.join(__dirname, '../graphql/schema.graphql')
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: { userPool },
        },
      },
      xrayEnabled: true,
    });

    // Resolver for:  query hello: String!
    const ds = this.api.addLambdaDataSource('HelloDS', helloFn);
    ds.createResolver('HelloResolver', {
      typeName: 'Query',
      fieldName: 'hello',
    });
  }
}
