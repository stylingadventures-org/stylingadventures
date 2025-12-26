"use strict";

// lambda/oauth/token-exchange/index.js
var https = require("https");
var querystring = require("querystring");
var COGNITO_DOMAIN = process.env.COGNITO_DOMAIN;
var CLIENT_ID = process.env.CLIENT_ID;
var CLIENT_SECRET = process.env.CLIENT_SECRET;
var REDIRECT_URI = process.env.REDIRECT_URI;
exports.handler = async (event) => {
  console.log("Token exchange request:", JSON.stringify(event, null, 2));
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: ""
      };
    }
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    const { code } = body;
    if (!code) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing authorization code" })
      };
    }
    const tokenResponse = await exchangeCodeForTokens(code);
    return {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(tokenResponse)
    };
  } catch (error) {
    console.error("Token exchange error:", error);
    return {
      statusCode: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Token exchange failed",
        message: error.message
      })
    };
  }
};
function exchangeCodeForTokens(code) {
  return new Promise((resolve, reject) => {
    const tokenUrl = new URL(COGNITO_DOMAIN);
    const path = "/oauth2/token";
    const postData = querystring.stringify({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI
    });
    const options = {
      hostname: tokenUrl.hostname,
      port: 443,
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData)
      }
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const tokenData = JSON.parse(data);
            resolve(tokenData);
          } else {
            reject(new Error(`Cognito returned ${res.statusCode}: ${data}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}
//# sourceMappingURL=index.js.map
