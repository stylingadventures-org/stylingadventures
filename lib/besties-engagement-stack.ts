// lib/besties-engagement-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export interface BestiesEngagementStackProps extends cdk.StackProps {
  table: dynamodb.ITable;
}

export class BestiesEngagementStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BestiesEngagementStackProps) {
    super(scope, id, props);

    const engagementFn = new lambda.NodejsFunction(this, 'EngagementFn', {
      entry: 'lambda/engagement/handler.ts',
      environment: {
        TABLE_NAME: props.table.tableName,
      },
    });

    props.table.grantReadWriteData(engagementFn);
  }
}
