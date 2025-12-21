# Lambda Logging Best Practices

## Never Log These

❌ Full event objects  
❌ Request bodies with user data  
❌ Auth tokens or credentials  
❌ Personally identifiable information (PII)  
❌ Email addresses or phone numbers  
❌ Raw user IDs (use hashed version instead)  

## Always Log These

✅ Request ID (for tracing)  
✅ Operation name (e.g., "UpdateCloset", "ApproveItem")  
✅ User ID (hashed - first 4 + last 4 chars only)  
✅ Result status (success/failure/error)  
✅ High-level error message (not the full stack trace)  
✅ Operation outcome metrics (items created, deleted, etc.)  

## Using the Logger

```typescript
import { LambdaLogger, extractRequestContext } from "../_shared/logger";

export const handler = async (event: APIGatewayProxyEventV2) => {
  const { requestId, userId } = extractRequestContext(event);
  const logger = new LambdaLogger({
    requestId,
    operation: "UpdateClosetItem",
    userId,
  });

  try {
    // Do some work
    const result = await updateCloset(item);

    logger.info("Closet item updated", {
      status: "success",
      details: { itemCount: result.items.length },
    });

    return ok({ item: result });
  } catch (err) {
    logger.error("Failed to update closet", { error: err });
    return err(500, "Internal server error");
  }
};
```

## Log Format

All logs use structured JSON format:

```json
{
  "level": "INFO",
  "timestamp": "2025-01-15T10:30:45.123Z",
  "requestId": "abc123xyz",
  "operation": "UpdateClosetItem",
  "userId": "abc123...def789",
  "status": "success",
  "message": "Closet item updated",
  "details": {
    "itemCount": 42
  }
}
```

This format allows CloudWatch to parse and filter logs efficiently.

## Environment-Based Logging

- **Development (dev, local)**: DEBUG and INFO logs are output  
- **Production (prod)**: Only INFO, WARN, ERROR logs are output  

```typescript
logger.debug("Detailed debugging info"); // Only shown in dev
logger.info("Operation completed");       // Always shown
```

## Migrating Existing Lambdas

Replace old logging patterns:

### Before
```typescript
console.log("ClosetResolverFn event", JSON.stringify(event));
```

### After
```typescript
const { requestId, userId } = extractRequestContext(event);
const logger = new LambdaLogger({ requestId, operation: "ClosetResolver", userId });
logger.debug("Processing closet request", { itemCount: event.items?.length });
```

## See Also

- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [AWS Lambda Logging Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/monitoring-cloudwatch-logs.html)
