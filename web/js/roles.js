// web/js/roles.js

// ---- Types & helpers --------------------------------------------------------
export const Roles = Object.freeze({
  FAN: 'FAN',
  BESTIE: 'BESTIE',
  CREATOR: 'CREATOR',
  COLLAB: 'COLLAB',
  ADMIN: 'ADMIN',
});

export const Tiers = Object.freeze({
  FREE: 'FREE',
  PRIME: 'PRIME',
});

/**
 * Coerce a value to an UPPERCASE string, with a default.
 */
function asUpperString(v, fallback) {
  return String(v ?? fallback).toUpperCase();
}

/**
 * Standard POST to AppSync GraphQL with an ID token
 */
async function postGraphQL(appsyncUrl, idToken, body) {
  const r = await fetch(appsyncUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': idToken, // AppSync user pool auth
    },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    // Try to surface the appsync error body if present
    let text = '';
    try { text = await r.text(); } catch {}
    throw new Error(`AppSync ${r.status}: ${text || r.statusText}`);
  }
  return r.json();
}

// ---- Public API -------------------------------------------------------------

/**
 * Query the current user's lightweight profile.
 * Your schema returns role/tier as strings.
 *
 * @returns {Promise<{id:string,email:string,role:string,tier:string}>}
 */
export async function fetchMe(appsyncUrl, idToken) {
  const q = {
    query: /* GraphQL */ `
      query Me {
        me {
          id
          email
          role
          tier
        }
      }
    `,
  };

  const j = await postGraphQL(appsyncUrl, idToken, q);

  if (j.errors?.length) {
    throw new Error(j.errors[0]?.message || 'me failed');
  }

  const m = j.data?.me ?? {};
  return {
    id: m.id ?? '',
    email: m.email ?? '',
    role: asUpperString(m.role, Roles.FAN),
    tier: asUpperString(m.tier, Tiers.FREE),
  };
}

/**
 * Admin helper: set a user's role/tier.
 * Input shape matches your GraphQL `SetUserRoleInput`.
 *
 * @param {string} appsyncUrl
 * @param {string} idToken
 * @param {{userId:string,email?:string,role:string,tier?:string}} input
 * @returns {Promise<{id:string,email:string,role:string,tier:string}>}
 */
export async function setUserRole(appsyncUrl, idToken, input) {
  const q = {
    query: /* GraphQL */ `
      mutation SetUserRole($input: SetUserRoleInput!) {
        setUserRole(input: $input) {
          id
          email
          role
          tier
        }
      }
    `,
    variables: { input },
  };

  const j = await postGraphQL(appsyncUrl, idToken, q);

  if (j.errors?.length) {
    throw new Error(j.errors[0]?.message || 'setUserRole failed');
  }

  const u = j.data?.setUserRole ?? {};
  return {
    id: u.id ?? '',
    email: u.email ?? '',
    role: asUpperString(u.role, Roles.FAN),
    tier: asUpperString(u.tier, Tiers.FREE),
  };
}

/**
 * Can this role upload files?
 * (CREATOR, COLLAB, ADMIN are allowed)
 */
export function canUpload(role) {
  const r = asUpperString(role, Roles.FAN);
  return r === Roles.CREATOR || r === Roles.COLLAB || r === Roles.ADMIN;
}
