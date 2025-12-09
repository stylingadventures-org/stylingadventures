// site/src/api/runGraphQL.ts

// Tiny wrapper that reuses the same SA GraphQL helper the rest of the app uses.
export async function runGraphQL(
  query: string,
  variables: Record<string, any> = {},
) {
  // Prefer the already-bootstrapped client on window
  if (typeof window !== "undefined" && (window as any).sa?.graphql) {
    return (window as any).sa.graphql(query, variables);
  }

  // Fallback to the internal helper, identical behavior to other screens
  const { graphql } = await import("../lib/sa");
  return graphql(query, variables);
}
