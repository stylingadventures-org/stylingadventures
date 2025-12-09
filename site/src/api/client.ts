// site/src/api/client.ts

// Re-use the existing GraphQL helper from lib/sa.js
// (this file already handles window.sa.graphql vs direct fetch)
import { graphql } from "../lib/sa";

/**
 * Normalized client used by creator tools / Monetization HQ.
 * Signature: callGraphQL(query, variables = {})
 */
export async function callGraphQL(
  query: string,
  variables: Record<string, any> = {}
) {
  return graphql(query, variables);
}
