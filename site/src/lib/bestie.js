// site/src/lib/bestie.js
import { getSA } from "./sa";

/**
 * Central Bestie status shape and helpers.
 *
 * Backend expectations:
 *   type BestieStatus {
 *     isBestie: Boolean
 *     activeSubscription: Boolean
 *     expiresAt: AWSDateTime
 *     tier: String
 *   }
 */

const GQL_STATUS = /* GraphQL */ `
  query MeBestieStatus {
    meBestieStatus {
      isBestie
      activeSubscription
      expiresAt
      tier
    }
  }
`;

const GQL_START_CHECKOUT = /* GraphQL */ `
  mutation StartBestieCheckout($successPath: String) {
    startBestieCheckout(successPath: $successPath) {
      url
    }
  }
`;

const GQL_CLAIM_TRIAL = /* GraphQL */ `
  mutation ClaimBestieTrial {
    claimBestieTrial {
      isBestie
      activeSubscription
      expiresAt
      tier
    }
  }
`;

/**
 * Simple analytics helper – will use whatever is available on window.sa,
 * but falls back to console.debug so it never throws.
 */
function trackBestieEvent(eventName, props = {}) {
  try {
    const sa = window.sa || window.SA || null;

    if (sa?.track) {
      sa.track(eventName, props);
    } else if (sa?.analytics?.track) {
      sa.analytics.track(eventName, props);
    } else if (sa?.logEvent) {
      sa.logEvent(eventName, props);
    } else {
      // Safe fallback for local dev
      console.debug(`[bestie] ${eventName}`, props);
    }
  } catch (err) {
    console.warn("[bestie] analytics error", err);
  }
}

/**
 * Determine whether a BestieStatus object represents an *active* Bestie.
 * This is the single source of truth used across the app.
 */
export function isBestieActive(status) {
  if (!status) return false;

  // If backend exposes "activeSubscription", we treat false as a hard no.
  if (typeof status.activeSubscription === "boolean") {
    if (!status.activeSubscription) return false;
  }

  // Expiration check
  if (status.expiresAt) {
    const exp = Date.parse(status.expiresAt);
    if (!Number.isNaN(exp) && exp < Date.now()) {
      return false;
    }
  }

  // Primary flag
  if (typeof status.isBestie === "boolean") {
    return status.isBestie;
  }

  return false;
}

/**
 * Fetch the current viewer's Bestie status.
 * Returns `null` if unavailable (not logged in, network error, etc).
 */
export async function fetchBestieStatus() {
  try {
    const sa = await getSA();
    if (!sa?.graphql) {
      throw new Error("Bestie status not available.");
    }

    const res = await sa.graphql(GQL_STATUS, {});
    const status = res?.meBestieStatus ?? null;

    trackBestieEvent("bestie_status_fetched", {
      hasStatus: !!status,
      isActive: isBestieActive(status),
      tier: status?.tier || null,
    });

    return status;
  } catch (err) {
    trackBestieEvent("bestie_status_error", {
      message: err?.message || String(err),
    });
    return null;
  }
}

/**
 * Start the Bestie checkout flow.
 * Returns the checkout URL (caller usually `window.location.assign(url)`).
 */
export async function startBestieCheckout({ successPath } = {}) {
  const sa = await getSA();
  if (!sa?.graphql) {
    throw new Error("Bestie checkout is not available.");
  }

  trackBestieEvent("bestie_checkout_start", {
    successPath: successPath || null,
  });

  const res = await sa.graphql(GQL_START_CHECKOUT, { successPath });
  const url = res?.startBestieCheckout?.url || null;

  if (!url) {
    trackBestieEvent("bestie_checkout_error", {
      reason: "missing_url",
    });
    throw new Error("Could not start Bestie checkout – URL missing.");
  }

  return url;
}

/**
 * Claim a Bestie trial. Returns the updated BestieStatus (or null).
 */
export async function claimBestieTrial() {
  const sa = await getSA();
  if (!sa?.graphql) {
    throw new Error("Bestie trial is not available.");
  }

  trackBestieEvent("bestie_trial_attempt");

  const res = await sa.graphql(GQL_CLAIM_TRIAL, {});
  const status = res?.claimBestieTrial ?? null;

  const active = isBestieActive(status);

  trackBestieEvent("bestie_trial_result", {
    success: active,
    tier: status?.tier || null,
  });

  return status;
}
