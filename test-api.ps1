#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test GraphQL API endpoint with PowerShell
.DESCRIPTION
    Makes a POST request to your AppSync GraphQL endpoint with proper authentication
.PARAMETER Query
    GraphQL query string (defaults to introspection query)
.EXAMPLE
    .\test-api.ps1 -Query 'query { __typename }'
    .\test-api.ps1  # Uses default introspection query
#>

param(
    [string]$Query = 'query { __typename }',
    [string]$ApiKey = "da2-qou2vcqhh5hmnfqcaieqlkfevi"
)

# API Configuration
$Uri = "https://dbcwd5l3qbh45fmanzpyvp6v4i.appsync-api.us-east-1.amazonaws.com/graphql"

# Build request
$Body = @{
    query = $Query
} | ConvertTo-Json

$Headers = @{
    "x-api-key" = $ApiKey
    "Content-Type" = "application/json"
}

Write-Host "🔗 Testing GraphQL API" -ForegroundColor Green
Write-Host "Endpoint: $Uri" -ForegroundColor Cyan
Write-Host "Query: $Query" -ForegroundColor Cyan
Write-Host ""

# Make request
try {
    $response = Invoke-WebRequest -Uri $Uri -Method POST -Headers $Headers -Body $Body -UseBasicParsing
    
    Write-Host "✅ HTTP $($response.StatusCode) - Success!" -ForegroundColor Green
    Write-Host ""
    
    # Parse and pretty-print response
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.errors) {
        Write-Host "❌ GraphQL Errors:" -ForegroundColor Red
        $data.errors | ForEach-Object {
            Write-Host "  - $($_.message)" -ForegroundColor Red
        }
    } else {
        Write-Host "✅ GraphQL Response:" -ForegroundColor Green
        $data | ConvertTo-Json -Depth 10 | Write-Host
    }
}
catch {
    Write-Host "❌ Request Failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
