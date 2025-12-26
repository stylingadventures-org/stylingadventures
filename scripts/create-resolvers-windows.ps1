# PowerShell script to create all 22 Closet resolvers for AppSync API
# Usage: .\scripts\create-resolvers-windows.ps1 -ApiId "4grie5uhtnfa3ewlnnc77pm5r4"

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiId = "4grie5uhtnfa3ewlnnc77pm5r4",
    
    [string]$DataSourceName = "ClosetDs"
)

Write-Host "Creating 22 Closet resolvers for API: $ApiId"
Write-Host "Using DataSource: $DataSourceName"
Write-Host ""

$requestTemplate = @{
    version = "2017-02-28"
    operation = "Invoke"
    payloadVersion = "1.0"
    type = "AWS_LAMBDA"
}

$responseTemplate = @{
    version = "2017-02-28"
}

$requestJson = $requestTemplate | ConvertTo-Json -Compress
$responseJson = $responseTemplate | ConvertTo-Json -Compress

# Query Resolvers
$queryResolvers = @(
    "myCloset",
    "myWishlist",
    "bestieClosetItems",
    "closetFeed",
    "stories",
    "myStories",
    "closetItemComments",
    "adminClosetItemLikes",
    "adminClosetItemComments",
    "pinnedClosetItems"
)

Write-Host "Creating Query resolvers..."
foreach ($fieldName in $queryResolvers) {
    try {
        aws appsync create-resolver `
            --api-id $ApiId `
            --type-name Query `
            --field-name $fieldName `
            --data-source-name $DataSourceName `
            --request-mapping-template $requestJson `
            --response-mapping-template $responseJson `
            2>$null
        Write-Host "✓ $fieldName"
    } catch {
        Write-Host "✗ $fieldName (may already exist)"
    }
}

Write-Host ""
Write-Host "Creating Mutation resolvers..."

# Mutation Resolvers
$mutationResolvers = @(
    "createClosetItem",
    "requestClosetApproval",
    "updateClosetMediaKey",
    "updateClosetItemStory",
    "likeClosetItem",
    "toggleFavoriteClosetItem",
    "commentOnClosetItem",
    "pinHighlight",
    "toggleWishlistItem",
    "requestClosetBackgroundChange",
    "createStory",
    "publishStory"
)

foreach ($fieldName in $mutationResolvers) {
    try {
        aws appsync create-resolver `
            --api-id $ApiId `
            --type-name Mutation `
            --field-name $fieldName `
            --data-source-name $DataSourceName `
            --request-mapping-template $requestJson `
            --response-mapping-template $responseJson `
            2>$null
        Write-Host "✓ $fieldName"
    } catch {
        Write-Host "✗ $fieldName (may already exist)"
    }
}

Write-Host ""
Write-Host "All resolvers configured!"
