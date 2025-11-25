/**
 * Map a raw DynamoDB item into our ClosetItem shape.
 * Robust to legacy items that only encode id/userId in pk/sk.
 */
function mapClosetItem(raw: Record<string, any>): ClosetItem {
  const item = unmarshall(raw) as any;

  const pk: string | undefined = item.pk;
  const sk: string | undefined = item.sk;

  // Derive from keys if attributes are missing
  const idFromSk =
    typeof sk === "string" && sk.startsWith("CLOSET#")
      ? sk.substring("CLOSET#".length)
      : undefined;

  const userIdFromPk =
    typeof pk === "string" && pk.startsWith("USER#")
      ? pk.substring("USER#".length)
      : undefined;

  const id = item.id ?? idFromSk ?? "";
  const userId = item.userId ?? userIdFromPk ?? "";
  const ownerSub = item.ownerSub ?? userIdFromPk ?? userId;

  const closetItem: ClosetItem = {
    id,
    userId,
    ownerSub,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,

    // S3 keys
    mediaKey: item.mediaKey,
    rawMediaKey: item.rawMediaKey,

    title: item.title,
    reason: item.reason,
    audience: item.audience,

    // Categorization
    category: item.category,
    subcategory: item.subcategory,

    // Story-style metadata
    storyTitle: item.storyTitle,
    storySeason: item.storySeason,
    storyVibes: item.storyVibes,

    // Bestie / highlight
    pinned: item.pinned,

    // Aggregates
    favoriteCount: item.favoriteCount,
    likeCount: item.likeCount,
    commentCount: item.commentCount,
    wishlistCount: item.wishlistCount,

    // Viewer flags
    viewerHasFaved: item.viewerHasFaved,
    viewerHasLiked: item.viewerHasLiked,
    viewerHasWishlisted: item.viewerHasWishlisted,
  };

  return closetItem;
}
