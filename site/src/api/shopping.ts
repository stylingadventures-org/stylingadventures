// site/src/api/shopping.ts
import { runGraphQL } from "./runGraphQL";

// 🛍 Query: "Shop Lala's Look" for a single closet item
export async function shopLalasLook(closetItemId: string) {
  const query = /* GraphQL */ `
    query ShopLalasLook($closetItemId: ID!) {
      shopLalasLook(closetItemId: $closetItemId) {
        productId
        name
        brand
        imageUrl
        category
        price
        color
        sizeOptions
        affiliateLinks {
          affiliateLinkId
          retailerName
          url
          commissionRate
        }
      }
    }
  `;

  const data = await runGraphQL(query, { closetItemId });
  return data.shopLalasLook ?? [];
}

// 🛍 Query: "Shop This Scene" for a scene id
export async function shopThisScene(sceneId: string) {
  const query = /* GraphQL */ `
    query ShopThisScene($sceneId: ID!) {
      shopThisScene(sceneId: $sceneId) {
        productId
        name
        brand
        imageUrl
        category
        price
        color
        sizeOptions
        affiliateLinks {
          affiliateLinkId
          retailerName
          url
          commissionRate
        }
      }
    }
  `;

  const data = await runGraphQL(query, { sceneId });
  return data.shopThisScene ?? [];
}
