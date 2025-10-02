# scripts/cognito.config.ps1
$Region   = "us-east-1"
$Domain   = "stylingadventures-256673"
$ClientId = "7bkph1q2q1dgpk0497gk41t7tc"
$APPSYNC  = "https://r62zvb4xbjeydbwpwx677sgwc4.appsync-api.us-east-1.amazonaws.com/graphql"
$UPLOADS  = "https://02vsmdtge6.execute-api.us-east-1.amazonaws.com/prod/"

$CF       = "https://d1682i07dc1r3k.cloudfront.net"
$Redirect = "$CF/callback/index.html"
$Logout   = "$CF/logout/index.html"
