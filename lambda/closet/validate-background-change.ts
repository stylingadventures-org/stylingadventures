// lambda/closet/validate-background-change.ts

/**
 * Validate background-change requests before the heavy work runs.
 *
 * This is wired into the Besties background-change Step Function by
 * BestiesClosetStack. For now it's a simple "always allow" stub so
 * the workflow can execute end-to-end without any real business rules.
 *
 * Later, you can:
 *   - throttle how often a user can request changes
 *   - block certain backgrounds (e.g. containing disallowed content)
 *   - check user tier, status, etc.
 */

export type ValidateBgChangeEvent = {
  itemId?: string;
  ownerId?: string;
  requestedBackground?: string;
  reason?: string;
  // anything else the state machine passes through:
  [key: string]: any;
};

export type ValidateBgChangeResult = {
  ok: boolean;
  allowed: boolean;
  itemId?: string;
  ownerId?: string;
  requestedBackground?: string;
  message?: string;
};

export const handler = async (
  event: ValidateBgChangeEvent | any
): Promise<ValidateBgChangeResult> => {
  console.log(
    "[validate-background-change] incoming event:",
    JSON.stringify(event)
  );

  const { itemId, ownerId, requestedBackground } = event || {};

  // 🔒 Hook for future rules:
  // e.g., if (event.timesRequestedToday > 5) { allowed = false; ... }

  return {
    ok: true,
    allowed: true, // always allow for now
    itemId,
    ownerId,
    requestedBackground,
    message:
      "Background change validation stub – all requests are allowed in this version.",
  };
};
