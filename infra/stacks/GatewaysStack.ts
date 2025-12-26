import * as cdk from 'aws-cdk-lib'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as path from 'path'

export class CollaboratorsApiStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Create Lambda function for Collaborators API
    const collaboratorsFunction = new lambda.Function(this, 'CollaboratorsFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'collaborators.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/api')),
      environment: {
        COLLABORATIONS_TABLE: 'sa-collaborations'
      }
    })

    // Grant DynamoDB and EventBridge permissions
    collaboratorsFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'dynamodb:GetItem',
        'dynamodb:Query',
        'dynamodb:Update',
        'dynamodb:Delete',
        'dynamodb:PutItem'
      ],
      resources: ['arn:aws:dynamodb:*:*:table/sa-collaborations*']
    }))

    collaboratorsFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['events:PutEvents'],
      resources: ['*']
    }))

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'CollaboratorsApi', {
      restApiName: 'SA-Collaborators-API',
      description: 'Styling Adventures Collaborators API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization']
      }
    })

    // Create authorizer using Cognito
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
      cognitoUserPools: [
        cdk.Stack.of(this).node.tryGetContext('userPool')
      ]
    })

    // Add routes
    const collaboratorsResource = api.root.addResource('collaborators')
    
    const inviteResource = collaboratorsResource.addResource('invite')
    inviteResource.addMethod('POST', new apigateway.LambdaIntegration(collaboratorsFunction), {
      authorizer
    })

    const acceptResource = collaboratorsResource.addResource('accept')
    acceptResource.addMethod('POST', new apigateway.LambdaIntegration(collaboratorsFunction), {
      authorizer
    })

    const listResource = collaboratorsResource.addResource('list')
    listResource.addMethod('GET', new apigateway.LambdaIntegration(collaboratorsFunction), {
      authorizer
    })

    const revokeResource = collaboratorsResource.addResource('revoke')
    revokeResource.addMethod('POST', new apigateway.LambdaIntegration(collaboratorsFunction), {
      authorizer
    })

    // Output the API endpoint
    new cdk.CfnOutput(this, 'CollaboratorsApiEndpoint', {
      value: api.url,
      exportName: 'CollaboratorsApiEndpoint'
    })
  }
}

export class PrimeStudiosApiStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Create Lambda function for Prime Studios API
    const primeStudiosFunction = new lambda.Function(this, 'PrimeStudiosFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'prime-studios.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/api')),
      environment: {
        UPLOADS_BUCKET: 'sa-prime-uploads',
        PUBLICATION_STATE_MACHINE_ARN: 'arn:aws:states:us-east-1:637423256673:stateMachine:SA2-PrimeStudios-Production-dev'
      }
    })

    // Grant S3 and Step Functions permissions
    primeStudiosFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject'
      ],
      resources: ['arn:aws:s3:::sa-prime-uploads/*']
    }))

    primeStudiosFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'states:StartExecution',
        'states:DescribeExecution'
      ],
      resources: ['arn:aws:states:*:*:*']
    }))

    primeStudiosFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'dynamodb:GetItem',
        'dynamodb:Query',
        'dynamodb:PutItem'
      ],
      resources: ['arn:aws:dynamodb:*:*:table/sa-prime-episodes*']
    }))

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'PrimeStudiosApi', {
      restApiName: 'SA-PrimeStudios-API',
      description: 'Styling Adventures Prime Studios API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization']
      }
    })

    // Create authorizer using Cognito
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
      cognitoUserPools: [
        cdk.Stack.of(this).node.tryGetContext('userPool')
      ]
    })

    // Add routes
    const primeResource = api.root.addResource('prime-studios')
    
    const createEpisodeResource = primeResource.addResource('create-episode')
    createEpisodeResource.addMethod('POST', new apigateway.LambdaIntegration(primeStudiosFunction), {
      authorizer
    })

    const uploadResource = primeResource.addResource('upload')
    uploadResource.addMethod('POST', new apigateway.LambdaIntegration(primeStudiosFunction), {
      authorizer
    })

    const publishResource = primeResource.addResource('publish')
    publishResource.addMethod('POST', new apigateway.LambdaIntegration(primeStudiosFunction), {
      authorizer
    })

    const componentsResource = primeResource.addResource('components')
    componentsResource.addMethod('GET', new apigateway.LambdaIntegration(primeStudiosFunction), {
      authorizer
    })

    // Output the API endpoint
    new cdk.CfnOutput(this, 'PrimeStudiosApiEndpoint', {
      value: api.url,
      exportName: 'PrimeStudiosApiEndpoint'
    })
  }
}
