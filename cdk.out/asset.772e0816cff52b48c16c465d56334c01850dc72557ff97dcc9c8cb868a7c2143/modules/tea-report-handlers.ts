// ════════════════════════════════════════════════════════════
// TEA REPORT MODULE HANDLERS (Phase 6 Part 2)
// ════════════════════════════════════════════════════════════
// Implement these functions in lambda/graphql/index.ts
// Add case statements in the main handler switch

async function handleAdminGenerateTeaReport(
  args: {
    input: {
      title: string;
      description?: string;
      relatedUserIds?: string[];
      hotTakes?: string[];
    };
  },
  identity: SAIdentity
) {
  // Verify ADMIN/PRIME tier
  const tier = getUserTier(identity);
  if (tier !== "ADMIN" && tier !== "PRIME") {
    throw new Error("Unauthorized: admin only");
  }

  const reportId = randomUUID();
  const now = new Date().toISOString();

  // Create tea report in DynamoDB
  const item = {
    PK: { S: `TEA_REPORT#${reportId}` },
    SK: { S: "REPORT" },
    id: { S: reportId },
    title: { S: args.input.title },
    description: { S: args.input.description || "" },
    createdAt: { S: now },
    updatedAt: { S: now },
    createdBy: { S: identity?.sub || "admin" },
    status: { S: "PUBLISHED" },
    hotTakesCount: { N: String(args.input.hotTakes?.length || 0) },
    ...(args.input.relatedUserIds && {
      relatedUserIds: { SS: args.input.relatedUserIds },
    }),
  };

  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );

  // Add hot takes if provided
  for (const take of args.input.hotTakes || []) {
    const takeId = randomUUID();
    await ddb.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: { S: `TEA_REPORT#${reportId}` },
          SK: { S: `TAKE#${takeId}` },
          id: { S: takeId },
          text: { S: take },
          createdAt: { S: now },
        },
      })
    );
  }

  // Publish event to EventBridge
  await eb.send(
    new PutEventsCommand({
      Entries: [
        {
          Source: "tea.admin",
          DetailType: "ReportGenerated",
          Detail: JSON.stringify({
            reportId,
            title: args.input.title,
            createdBy: identity?.sub,
            timestamp: now,
          }),
        },
      ],
    })
  );

  return {
    id: reportId,
    title: args.input.title,
    description: args.input.description,
    status: "PUBLISHED",
    createdAt: now,
    hotTakesCount: args.input.hotTakes?.length || 0,
  };
}

async function handleAdminAddHotTake(
  args: { reportId: string; take: string },
  identity: SAIdentity
) {
  // Verify ADMIN/PRIME tier
  const tier = getUserTier(identity);
  if (tier !== "ADMIN" && tier !== "PRIME") {
    throw new Error("Unauthorized: admin only");
  }

  const takeId = randomUUID();
  const now = new Date().toISOString();

  // Add hot take to report
  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: { S: `TEA_REPORT#${args.reportId}` },
        SK: { S: `TAKE#${takeId}` },
        id: { S: takeId },
        text: { S: args.take },
        createdAt: { S: now },
        createdBy: { S: identity?.sub || "admin" },
      },
    })
  );

  // Increment hot takes count on report
  await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: { S: `TEA_REPORT#${args.reportId}` },
        SK: { S: "REPORT" },
      },
      UpdateExpression: "SET hotTakesCount = if_not_exists(hotTakesCount, :zero) + :inc",
      ExpressionAttributeValues: {
        ":zero": { N: "0" },
        ":inc": { N: "1" },
      },
    })
  );

  return {
    id: takeId,
    reportId: args.reportId,
    text: args.take,
    createdAt: now,
  };
}

async function handleTeaReports(args: {
  limit?: number;
  nextToken?: string;
}) {
  const limit = Math.min(args.limit || 10, 100);

  // Query all published tea reports
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "begins_with(PK, :pk) AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": { S: "TEA_REPORT#" },
        ":sk": { S: "REPORT" },
      },
      FilterExpression: "#status = :published",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":published": { S: "PUBLISHED" },
      },
      Limit: limit,
      ExclusiveStartKey: args.nextToken
        ? JSON.parse(Buffer.from(args.nextToken, "base64").toString())
        : undefined,
      ScanIndexForward: false,
    })
  );

  const items = (res.Items ?? []).map((item) => ({
    id: item.id?.S || "",
    title: item.title?.S || "",
    description: item.description?.S || "",
    status: item.status?.S || "PUBLISHED",
    createdAt: item.createdAt?.S || "",
    hotTakesCount: parseInt(item.hotTakesCount?.N || "0"),
  }));

  return {
    items,
    nextToken: res.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(res.LastEvaluatedKey)).toString("base64")
      : null,
  };
}

async function handleMyTeaReports(args: {
  limit?: number;
  nextToken?: string;
  identity: SAIdentity;
}) {
  assertAuth(args.identity);
  const userId = args.identity?.sub;
  const limit = Math.min(args.limit || 10, 100);

  // Query tea reports created by user
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": { S: `USER#${userId}` },
        ":sk": { S: "TEA_REPORT#" },
      },
      Limit: limit,
      ExclusiveStartKey: args.nextToken
        ? JSON.parse(Buffer.from(args.nextToken, "base64").toString())
        : undefined,
      ScanIndexForward: false,
    })
  );

  const items = (res.Items ?? []).map((item) => ({
    id: item.id?.S || "",
    title: item.title?.S || "",
    description: item.description?.S || "",
    status: item.status?.S || "",
    createdAt: item.createdAt?.S || "",
  }));

  return {
    items,
    nextToken: res.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(res.LastEvaluatedKey)).toString("base64")
      : null,
  };
}

async function handleAdminUpdateRelationshipStatus(
  args: {
    relationshipId: string;
    status: string; // "DATING" | "BREAKUP" | "CHEATING" | "RECONCILIATION" | "MARRIED"
  },
  identity: SAIdentity
) {
  const tier = getUserTier(identity);
  if (tier !== "ADMIN" && tier !== "PRIME") {
    throw new Error("Unauthorized: admin only");
  }

  const now = new Date().toISOString();

  const res = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: { S: `RELATIONSHIP#${args.relationshipId}` },
        SK: { S: "STATUS" },
      },
      UpdateExpression: "SET #status = :status, #updated = :now",
      ExpressionAttributeNames: {
        "#status": "status",
        "#updated": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":status": { S: args.status },
        ":now": { S: now },
      },
      ReturnValues: "ALL_NEW",
    })
  );

  // Publish event to EventBridge for engagement tracking
  await eb.send(
    new PutEventsCommand({
      Entries: [
        {
          Source: "tea.admin",
          DetailType: "RelationshipStatusUpdated",
          Detail: JSON.stringify({
            relationshipId: args.relationshipId,
            newStatus: args.status,
            updatedBy: identity?.sub,
            timestamp: now,
          }),
        },
      ],
    })
  );

  return {
    id: args.relationshipId,
    status: args.status,
    updatedAt: now,
  };
}

// ════════════════════════════════════════════════════════════
// HOW TO INTEGRATE:
// ════════════════════════════════════════════════════════════
// 
// 1. Copy all functions above into lambda/graphql/index.ts
//    (after the admin handlers, before the handler export)
//
// 2. Add case statements in the main handler switch:
//
//    case "adminGenerateTeaReport":
//      return await handleAdminGenerateTeaReport(event.arguments || {}, event.identity);
//    
//    case "adminAddHotTake":
//      return await handleAdminAddHotTake(event.arguments || {}, event.identity);
//    
//    case "teaReports":
//      return await handleTeaReports(event.arguments || {});
//    
//    case "myTeaReports":
//      return await handleMyTeaReports({
//        ...(event.arguments || {}),
//        identity: event.identity
//      });
//    
//    case "adminUpdateRelationshipStatus":
//      return await handleAdminUpdateRelationshipStatus(event.arguments || {}, event.identity);
//
// 3. Compile and deploy:
//    npm run cdk:synth
//    npx cdk deploy ApiStack --require-approval never
//
// 4. Verify deployment succeeded
//
// ════════════════════════════════════════════════════════════
