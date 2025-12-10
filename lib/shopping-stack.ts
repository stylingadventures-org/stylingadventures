// lib/shopping-stack.ts
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";

export class ShoppingStack extends cdk.Stack {
  public readonly getShopLalasLookFn: lambdaNodejs.NodejsFunction;
  public readonly getShopThisSceneFn: lambdaNodejs.NodejsFunction;
  public readonly linkClosetItemToProductFn: lambdaNodejs.NodejsFunction;

  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    //
    // 1) DynamoDB tables
    //

    // Product
    const productTable = new dynamodb.Table(this, "ProductTable", {
      tableName: "sa-product",
      partitionKey: { name: "productId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // change to RETAIN for prod
    });

    productTable.addGlobalSecondaryIndex({
      indexName: "category-index",
      partitionKey: {
        name: "category",
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // AffiliateLink
    const affiliateLinkTable = new dynamodb.Table(this, "AffiliateLinkTable", {
      tableName: "sa-affiliate-link",
      partitionKey: {
        name: "affiliateLinkId",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    affiliateLinkTable.addGlobalSecondaryIndex({
      indexName: "productId-index",
      partitionKey: {
        name: "productId",
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ClosetItemProductMap
    const closetItemProductMapTable = new dynamodb.Table(
      this,
      "ClosetItemProductMapTable",
      {
        tableName: "sa-closet-item-product-map",
        partitionKey: {
          name: "closetItemId",
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: "productId",
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // SceneProductMap
    const sceneProductMapTable = new dynamodb.Table(
      this,
      "SceneProductMapTable",
      {
        tableName: "sa-scene-product-map",
        partitionKey: {
          name: "sceneId",
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: "productId",
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    //
    // 2) Lambda functions
    //

    this.getShopLalasLookFn = new lambdaNodejs.NodejsFunction(
      this,
      "GetShopLalasLookFn",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          "../lambda/shopping/get-shop-lalas-look.ts"
        ),
        handler: "handler",
        bundling: {
          externalModules: ["@aws-sdk/client-dynamodb", "@aws-sdk/lib-dynamodb"],
        },
        environment: {
          PRODUCT_TABLE_NAME: productTable.tableName,
          AFFILIATE_LINK_TABLE_NAME: affiliateLinkTable.tableName,
          CLOSET_ITEM_PRODUCT_MAP_TABLE_NAME: closetItemProductMapTable.tableName,
        },
      }
    );

    this.getShopThisSceneFn = new lambdaNodejs.NodejsFunction(
      this,
      "GetShopThisSceneFn",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          "../lambda/shopping/get-shop-this-scene.ts"
        ),
        handler: "handler",
        bundling: {
          externalModules: ["@aws-sdk/client-dynamodb", "@aws-sdk/lib-dynamodb"],
        },
        environment: {
          PRODUCT_TABLE_NAME: productTable.tableName,
          AFFILIATE_LINK_TABLE_NAME: affiliateLinkTable.tableName,
          SCENE_PRODUCT_MAP_TABLE_NAME: sceneProductMapTable.tableName,
        },
      }
    );

    this.linkClosetItemToProductFn = new lambdaNodejs.NodejsFunction(
      this,
      "LinkClosetItemToProductFn",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          "../lambda/shopping/link-closet-item-to-product.ts"
        ),
        handler: "handler",
        bundling: {
          externalModules: ["@aws-sdk/client-dynamodb", "@aws-sdk/lib-dynamodb"],
        },
        environment: {
          CLOSET_ITEM_PRODUCT_MAP_TABLE_NAME: closetItemProductMapTable.tableName,
        },
      }
    );

    //
    // 3) Permissions
    //

    productTable.grantReadData(this.getShopLalasLookFn);
    productTable.grantReadData(this.getShopThisSceneFn);

    affiliateLinkTable.grantReadData(this.getShopLalasLookFn);
    affiliateLinkTable.grantReadData(this.getShopThisSceneFn);

    closetItemProductMapTable.grantReadWriteData(this.getShopLalasLookFn);
    closetItemProductMapTable.grantReadWriteData(
      this.linkClosetItemToProductFn
    );

    sceneProductMapTable.grantReadWriteData(this.getShopThisSceneFn);
  }
}
