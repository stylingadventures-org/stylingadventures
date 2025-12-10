// lib/prime-bank-stack.ts

import {
  Stack,
  StackProps,
  CfnOutput,
  Duration,
  RemovalPolicy,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";

export interface PrimeBankStackProps extends StackProps {
  envName: string;
}

export class PrimeBankStack extends Stack {
  public readonly accountTable: dynamodb.Table;
  public readonly transactionTable: dynamodb.Table;

  // 🔹 Export Lambdas so other stacks (ApiStack) can use them
  public readonly awardPrimeCoinsFn: lambda.IFunction;
  public readonly awardCreatorCreditsFn: lambdaNodejs.NodejsFunction;
  public readonly calculateBankMeterFn: lambdaNodejs.NodejsFunction;
  public readonly enforceEarningCapsFn: lambdaNodejs.NodejsFunction;

  constructor(scope: Construct, id: string, props: PrimeBankStackProps) {
    super(scope, id, props);

    const { envName } = props;

    // ─────────────────────────────
    // 1) PrimeBankAccount table
    //    - partition key: userId (string)
    // ─────────────────────────────
    this.accountTable = new dynamodb.Table(this, "PrimeBankAccountTable", {
      tableName: `sa-${envName}-prime-bank-account`,
      partitionKey: {
        name: "userId",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy:
        envName === "prd" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    // ─────────────────────────────
    // 2) PrimeBankTransaction table
    //    - PK: userId
    //    - SK: timestamp
    // ─────────────────────────────
    this.transactionTable = new dynamodb.Table(
      this,
      "PrimeBankTransactionTable",
      {
        tableName: `sa-${envName}-prime-bank-txn`,
        partitionKey: {
          name: "userId",
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: "timestamp",
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        pointInTimeRecoverySpecification: {
          pointInTimeRecoveryEnabled: true,
        },
        removalPolicy:
          envName === "prd" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      },
    );

    // GSI: currency-timestamp-index
    this.transactionTable.addGlobalSecondaryIndex({
      indexName: "currency-timestamp-index",
      partitionKey: {
        name: "currency",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "timestamp",
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ─────────────────────────────
    // 3) Lambda functions
    // ─────────────────────────────
    const commonEnv = {
      PRIME_BANK_ACCOUNT_TABLE_NAME: this.accountTable.tableName,
      PRIME_BANK_TRANSACTION_TABLE_NAME: this.transactionTable.tableName,
    };

    const defaultLambdaProps: lambdaNodejs.NodejsFunctionProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: {
        format: lambdaNodejs.OutputFormat.CJS,
        minify: true,
        sourceMap: true,
      },
      timeout: Duration.seconds(15),
      environment: commonEnv,
    };

    // 🔹 Keep a reference as IFunction for cross-stack usage (ApiStack)
    this.awardPrimeCoinsFn = new lambdaNodejs.NodejsFunction(
      this,
      "AwardPrimeCoinsFn",
      {
        entry: "lambda/prime-bank/award-prime-coins.ts",
        ...defaultLambdaProps,
      },
    );

    this.awardCreatorCreditsFn = new lambdaNodejs.NodejsFunction(
      this,
      "AwardCreatorCreditsFn",
      {
        entry: "lambda/prime-bank/award-creator-credits.ts",
        ...defaultLambdaProps,
      },
    );

    this.calculateBankMeterFn = new lambdaNodejs.NodejsFunction(
      this,
      "CalculateBankMeterFn",
      {
        entry: "lambda/prime-bank/calculate-bank-meter.ts",
        ...defaultLambdaProps,
      },
    );

    this.enforceEarningCapsFn = new lambdaNodejs.NodejsFunction(
      this,
      "EnforceEarningCapsFn",
      {
        entry: "lambda/prime-bank/enforce-earning-caps.ts",
        ...defaultLambdaProps,
      },
    );

    // ─────────────────────────────
    // 4) Least-privilege IAM grants
    // ─────────────────────────────
    this.accountTable.grantReadWriteData(this.awardPrimeCoinsFn);
    this.transactionTable.grantReadWriteData(this.awardPrimeCoinsFn);

    this.accountTable.grantReadWriteData(this.awardCreatorCreditsFn);
    this.transactionTable.grantReadWriteData(this.awardCreatorCreditsFn);

    this.accountTable.grantReadWriteData(this.calculateBankMeterFn);
    this.transactionTable.grantReadWriteData(this.calculateBankMeterFn);

    this.accountTable.grantReadWriteData(this.enforceEarningCapsFn);
    this.transactionTable.grantReadWriteData(this.enforceEarningCapsFn);

    // ─────────────────────────────
    // 5) Outputs (handy for debugging)
    // ─────────────────────────────
    new CfnOutput(this, "PrimeBankAccountTableName", {
      value: this.accountTable.tableName,
    });

    new CfnOutput(this, "PrimeBankTransactionTableName", {
      value: this.transactionTable.tableName,
    });
  }
}
