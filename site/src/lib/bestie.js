// site/src/lib/bestie.js
import { getSA } from "./sa";

const GQL = {
  meStatus: /* GraphQL */ `
    query MeBestieStatus {
      meBestieStatus {
        userId
        isBestie
        tier
        expiresAt
        activeSubscription
      }
    }
  `,
  startCheckout: /* GraphQL */ `
    mutation StartBestieCheckout {
      startBestieCheckout {
        url
      }
    }
  `,
  claimTrial: /* GraphQL */ `
    mutation ClaimBestieTrial {
      claimBestieTrial {
        userId
        isBestie
        tier
        expiresAt
        activeSubscription
      }
    }
  `,
};

export async function fetchBestieStatus() {
  const SA = await getSA();
  const data = await SA.gql(GQL.meStatus);
  return data?.meBestieStatus || null;
}

export async function startBestieCheckout() {
  const SA = await getSA();
  const data = await SA.gql(GQL.startCheckout);
  return data?.startBestieCheckout?.url || null;
}

export async function claimBestieTrial() {
  const SA = await getSA();
  const data = await SA.gql(GQL.claimTrial);
  return data?.claimBestieTrial || null;
}
