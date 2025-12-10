// lambda/shopping/get-shop-this-scene.ts
import {
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  BatchGetCommand,
} from "@aws-sdk/lib-dynamodb";

const PRODUCT_TABLE_NAME = process.env.PRODUCT_TABLE_NAME!;
const AFFILIATE_LINK_TABLE_NAME = process.env.AFFILIATE_LINK_TABLE_NAME!;
const SCENE_PRODUCT_MAP_TABLE_NAME =
  process.env.SCENE_PRODUCT_MAP_TABLE_NAME!;

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

type LambdaEvent = {
  sceneId?: string;
  arguments?: { sceneId?: string };
  body?: string;
};

type AffiliateLink = {
  affiliateLinkId: string;
  productId: string;
  retailerName: string;
  url: string;
  commissionRate?: number;
};

type Product = {
  productId: string;
  name?: string;
  brand?: string;
  imageUrl?: string;
  category?: string;
  price?: number;
  color?: string;
  sizeOptions?: string[];
};

type SceneProductMap = {
  sceneId: string;
  productId: string;
  usageType?: string;
  timestamp?: string;
};

export const handler = async (event: LambdaEvent) => {
  try {
    const sceneId = getSceneIdFromEvent(event);
    if (!sceneId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing sceneId",
        }),
      };
    }

    // 1) Find products mapped to this scene
    const mapResult = await docClient.send(
      new QueryCommand({
        TableName: SCENE_PRODUCT_MAP_TABLE_NAME,
        KeyConditionExpression: "sceneId = :sid",
        ExpressionAttributeValues: {
          ":sid": sceneId,
        },
      }),
    );

    const mappings =
      (mapResult.Items || []) as SceneProductMap[];

    if (mappings.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          sceneId,
          products: [],
        }),
      };
    }

    const productIds = Array.from(
      new Set(mappings.map((m) => m.productId)),
    );

    // 2) Batch get product details
    const batchGetResult = await docClient.send(
      new BatchGetCommand({
        RequestItems: {
          [PRODUCT_TABLE_NAME]: {
            Keys: productIds.map((productId) => ({ productId })),
          },
        },
      }),
    );

    const productsById = new Map<string, Product>();
    const productItems =
      batchGetResult.Responses?.[PRODUCT_TABLE_NAME] || [];
    for (const item of productItems) {
      const p = item as Product;
      productsById.set(p.productId, p);
    }

    // 3) For each product, query affiliate links via GSI (productId-index)
    const results = [];
    for (const mapping of mappings) {
      const product = productsById.get(mapping.productId);
      if (!product) continue;

      const linkResult = await docClient.send(
        new QueryCommand({
          TableName: AFFILIATE_LINK_TABLE_NAME,
          IndexName: "productId-index",
          KeyConditionExpression: "productId = :pid",
          ExpressionAttributeValues: {
            ":pid": mapping.productId,
          },
        }),
      );

      const links =
        (linkResult.Items || []) as AffiliateLink[];

      results.push({
        productId: mapping.productId,
        usageType: mapping.usageType ?? null,
        timestamp: mapping.timestamp ?? null,
        product,
        affiliateLinks: links,
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        sceneId,
        products: results,
      }),
    };
  } catch (err) {
    console.error("Error in get-shop-this-scene:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
      }),
    };
  }
};

function getSceneIdFromEvent(event: LambdaEvent): string | undefined {
  if (event.sceneId) return event.sceneId;
  if (event.arguments?.sceneId) return event.arguments.sceneId;

  if (event.body) {
    try {
      const parsed = JSON.parse(event.body);
      if (parsed.sceneId) return parsed.sceneId;
    } catch {
      // ignore parse errors
    }
  }

  return undefined;
}
