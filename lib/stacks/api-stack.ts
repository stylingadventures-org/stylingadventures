import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as cognito from 'aws-cdk-lib/aws-cognito';

interface ApiStackProps extends cdk.StackProps {
  userPool: cognito.IUserPool;
}

export class ApiStack extends cdk.Stack {
  public readonly api: appsync.GraphqlApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    this.api = new appsync.GraphqlApi(this, 'GraphqlApi', {
      name: 'stylingadventures-api',
      schema: appsync.SchemaFile.fromAsset('lib/stacks/schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: { userPool: props.userPool },
        },
      },
      xrayEnabled: true,
    });

    // NONE data source + "hello" resolver (returns "world")
    const none = this.api.addNoneDataSource('None');
    none.createResolver('HelloResolver', {
      typeName: 'Query',
      fieldName: 'hello',
      requestMappingTemplate: appsync.MappingTemplate.fromString('{ "version":"2018-05-29" }'),
      responseMappingTemplate: appsync.MappingTemplate.fromString('"world"'),
    });

    new cdk.CfnOutput(this, 'AppSyncApiId', { value: this.api.apiId });
    new cdk.CfnOutput(this, 'AppSyncUrl', { value: this.api.graphqlUrl });
  }
}
