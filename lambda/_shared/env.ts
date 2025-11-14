// lambda/_shared/env.ts
export const TABLE_NAME =
  process.env.TABLE_NAME ??
  process.env.APP_TABLE ??
  process.env.TABLE ??
  "";

if (!TABLE_NAME) {
  // Fail fast at cold start so you notice during deploy/tests
  throw new Error(
    "Missing DynamoDB table env. Provide TABLE_NAME (or APP_TABLE / TABLE)."
  );
}
