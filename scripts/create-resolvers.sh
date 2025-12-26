#!/bin/bash

# Create all 22 Closet resolvers for the AppSync API
# Usage: ./scripts/create-resolvers.sh <API_ID> <DATA_SOURCE_NAME>

API_ID=${1:-"4grie5uhtnfa3ewlnnc77pm5r4"}
DATA_SOURCE="ClosetDs"

echo "Creating 22 Closet resolvers for API: $API_ID"
echo "Using DataSource: $DATA_SOURCE"
echo ""

# Query Resolvers
echo "Creating Query resolvers..."
aws appsync create-resolver --api-id $API_ID --type-name Query --field-name myCloset --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"myCloset","logicalResourceId":"MyCloset"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ myCloset" || echo "✗ myCloset (may already exist)"

aws appsync create-resolver --api-id $API_ID --type-name Query --field-name myWishlist --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"myWishlist","logicalResourceId":"MyWishlistResolver"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ myWishlist" || echo "✗ myWishlist (may already exist)"

aws appsync create-resolver --api-id $API_ID --type-name Query --field-name bestieClosetItems --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"bestieClosetItems","logicalResourceId":"QueryBestieClosetItemsResolver"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ bestieClosetItems" || echo "✗ bestieClosetItems (may already exist)"

aws appsync create-resolver --api-id $API_ID --type-name Query --field-name closetFeed --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"closetFeed","logicalResourceId":"ClosetFeedResolver"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ closetFeed" || echo "✗ closetFeed (may already exist)"

aws appsync create-resolver --api-id $API_ID --type-name Query --field-name stories --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"stories","logicalResourceId":"StoriesResolver"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ stories" || echo "✗ stories (may already exist)"

aws appsync create-resolver --api-id $API_ID --type-name Query --field-name myStories --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"myStories","logicalResourceId":"MyStoriesResolver"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ myStories" || echo "✗ myStories (may already exist)"

aws appsync create-resolver --api-id $API_ID --type-name Query --field-name closetItemComments --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"closetItemComments","logicalResourceId":"ClosetItemCommentsResolver"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ closetItemComments" || echo "✗ closetItemComments (may already exist)"

aws appsync create-resolver --api-id $API_ID --type-name Query --field-name adminClosetItemLikes --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"adminClosetItemLikes","logicalResourceId":"AdminClosetItemLikesResolver"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ adminClosetItemLikes" || echo "✗ adminClosetItemLikes (may already exist)"

aws appsync create-resolver --api-id $API_ID --type-name Query --field-name adminClosetItemComments --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"adminClosetItemComments","logicalResourceId":"AdminClosetItemCommentsResolver"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ adminClosetItemComments" || echo "✗ adminClosetItemComments (may already exist)"

aws appsync create-resolver --api-id $API_ID --type-name Query --field-name pinnedClosetItems --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"pinnedClosetItems","logicalResourceId":"PinnedClosetItemsResolver"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ pinnedClosetItems" || echo "✗ pinnedClosetItems (may already exist)"

echo ""
echo "Creating Mutation resolvers..."

# Mutation Resolvers
aws appsync create-resolver --api-id $API_ID --type-name Mutation --field-name createClosetItem --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"createClosetItem","logicalResourceId":"CreateClosetItem"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ createClosetItem" || echo "✗ createClosetItem (may already exist)"

aws appsync create-resolver --api-id $API_ID --type-name Mutation --field-name requestClosetApproval --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"requestClosetApproval","logicalResourceId":"RequestClosetApproval"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ requestClosetApproval" || echo "✗ requestClosetApproval (may already exist)"

aws appsync create-resolver --api-id $API_ID --type-name Mutation --field-name updateClosetMediaKey --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"updateClosetMediaKey","logicalResourceId":"UpdateClosetMediaKey"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ updateClosetMediaKey" || echo "✗ updateClosetMediaKey (may already exist)"

aws appsync create-resolver --api-id $API_ID --type-name Mutation --field-name updateClosetItemStory --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"updateClosetItemStory","logicalResourceId":"UpdateClosetItemStory"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ updateClosetItemStory" || echo "✗ updateClosetItemStory (may already exist)"

aws appsync create-resolver --api-id $API_ID --type-name Mutation --field-name likeClosetItem --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"likeClosetItem","logicalResourceId":"LikeClosetItemResolver"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ likeClosetItem" || echo "✗ likeClosetItem (may already exist)"

aws appsync create-resolver --api-id $API_ID --type-name Mutation --field-name toggleFavoriteClosetItem --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"toggleFavoriteClosetItem","logicalResourceId":"ToggleFavoriteClosetItemResolver"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ toggleFavoriteClosetItem" || echo "✗ toggleFavoriteClosetItem (may already exist)"

aws appsync create-resolver --api-id $API_ID --type-name Mutation --field-name commentOnClosetItem --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"commentOnClosetItem","logicalResourceId":"CommentOnClosetItemResolver"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ commentOnClosetItem" || echo "✗ commentOnClosetItem (may already exist)"

aws appsync create-resolver --api-id $API_ID --type-name Mutation --field-name pinHighlight --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"pinHighlight","logicalResourceId":"PinHighlightResolver"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ pinHighlight" || echo "✗ pinHighlight (may already exist)"

aws appsync create-resolver --api-id $API_ID --type-name Mutation --field-name toggleWishlistItem --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"toggleWishlistItem","logicalResourceId":"ToggleWishlistItemResolver"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ toggleWishlistItem" || echo "✗ toggleWishlistItem (may already exist)"

aws appsync create-resolver --api-id $API_ID --type-name Mutation --field-name requestClosetBackgroundChange --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"requestClosetBackgroundChange","logicalResourceId":"RequestBgChangeResolver"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ requestClosetBackgroundChange" || echo "✗ requestClosetBackgroundChange (may already exist)"

aws appsync create-resolver --api-id $API_ID --type-name Mutation --field-name createStory --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"createStory","logicalResourceId":"CreateStoryResolver"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ createStory" || echo "✗ createStory (may already exist)"

aws appsync create-resolver --api-id $API_ID --type-name Mutation --field-name publishStory --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"publishStory","logicalResourceId":"PublishStoryResolver"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ publishStory" || echo "✗ publishStory (may already exist)"

aws appsync create-resolver --api-id $API_ID --type-name Mutation --field-name addClosetItemToCommunityFeed --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"addClosetItemToCommunityFeed","logicalResourceId":"AddClosetItemToFeedResolver"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ addClosetItemToCommunityFeed" || echo "✗ addClosetItemToCommunityFeed (may already exist)"

aws appsync create-resolver --api-id $API_ID --type-name Mutation --field-name removeClosetItemFromCommunityFeed --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"removeClosetItemFromCommunityFeed","logicalResourceId":"RemoveClosetItemFromFeedResolver"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ removeClosetItemFromCommunityFeed" || echo "✗ removeClosetItemFromCommunityFeed (may already exist)"

aws appsync create-resolver --api-id $API_ID --type-name Mutation --field-name shareClosetItemToPinterest --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"shareClosetItemToPinterest","logicalResourceId":"ShareClosetItemToPinterestResolver"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ shareClosetItemToPinterest" || echo "✗ shareClosetItemToPinterest (may already exist)"

aws appsync create-resolver --api-id $API_ID --type-name Mutation --field-name bestieCreateClosetItem --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"bestieCreateClosetItem","logicalResourceId":"BestieCreateClosetItemResolver"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ bestieCreateClosetItem" || echo "✗ bestieCreateClosetItem (may already exist)"

aws appsync create-resolver --api-id $API_ID --type-name Mutation --field-name bestieUpdateClosetItem --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"bestieUpdateClosetItem","logicalResourceId":"BestieUpdateClosetItemResolver"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ bestieUpdateClosetItem" || echo "✗ bestieUpdateClosetItem (may already exist)"

aws appsync create-resolver --api-id $API_ID --type-name Mutation --field-name bestieDeleteClosetItem --data-source-name $DATA_SOURCE --request-templates '{"version":"2017-02-28","operation":"Invoke","payloadVersion":"1.0","type":"AWS_LAMBDA","physicalResourceId":"bestieDeleteClosetItem","logicalResourceId":"BestieDeleteClosetItemResolver"}' --response-templates '{"version":"2017-02-28"}' 2>/dev/null && echo "✓ bestieDeleteClosetItem" || echo "✗ bestieDeleteClosetItem (may already exist)"

echo ""
echo "All resolvers configured!"
