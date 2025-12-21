# GraphQL + Cognito Integration Setup ✅

## What Was Installed & Configured

### 1. **Dependencies Added**
- `@apollo/client@3` - GraphQL client for React
- `@aws-sdk/client-cognito-identity-provider` - Cognito authentication
- `graphql` - GraphQL query language support

### 2. **Configuration Files Created**

#### `src/lib/appSyncConfig.js`
Stores AppSync endpoint and Cognito credentials:
```javascript
export const appSyncConfig = {
  graphQLEndpoint: "https://4our5nnjjnfrbes3ygjo4nxqn4.appsync-api.us-east-1.amazonaws.com/graphql",
  graphQLApiId: "fv5ilcjff5c3zaaixvb5nkmixq",
  region: "us-east-1",
};

export const cognitoConfig = {
  userPoolId: "us-east-1_ibGaRX7ry",
  userPoolWebClientId: "6qvke3hfg6utjbavkehgo4tf73",
  region: "us-east-1",
};
```

### 3. **Auth Context** (`src/context/AuthContext.jsx`)
Manages user authentication and Cognito integration:
- **`login(username, password)`** - Authenticates user and stores ID token
- **`logout()`** - Clears tokens and logs out user
- **`useAuth()`** - Hook to access auth state and methods
- Stores tokens in localStorage for persistence across sessions
- Provides `idToken` for AppSync API requests

**Usage:**
```jsx
const { user, isAuthenticated, idToken, login, logout } = useAuth();
```

### 4. **Apollo Client Setup** (`src/lib/apolloClient.js`)
Creates Apollo Client with AppSync endpoint and Cognito authentication:
- Injects ID token as `Authorization` header on every request
- Configured for network-first fetch policy (always fresh data)
- Automatically adds Cognito token to GraphQL requests

### 5. **GraphQL Provider** (`src/context/GraphQLProvider.jsx`)
Wraps React app with Apollo Provider for GraphQL queries:
```jsx
<AuthProvider>
  <GraphQLProvider>
    <App />
  </GraphQLProvider>
</AuthProvider>
```

### 6. **Test Component** (`src/components/TestGraphQLQuery.jsx`)
Example component for testing the integration:
- Login form for Cognito authentication
- Sample GraphQL query to fetch user's closet items
- Real-time error/response display
- Accessible at **`/test-graphql`** route

## How It Works

### Authentication Flow
1. User enters username/password in login form
2. Cognito validates credentials via `InitiateAuth`
3. ID token + Access token returned and stored in localStorage
4. User state updated in AuthContext

### GraphQL Query Flow
1. Component calls GraphQL query (e.g., `myCloset`)
2. Apollo Client intercepts request
3. Cognito ID token added to request headers
4. Request sent to AppSync endpoint
5. AppSync validates token against Cognito
6. GraphQL query executed if authorized
7. Response returned to client

## Testing the Integration

### Step 1: Access Test Page
Navigate to: `https://d3fghr37bcpbig.cloudfront.net/test-graphql`

### Step 2: Login
- Enter a Cognito user's username and password
- Click "Login" button
- Watch for success toast notification

### Step 3: Query GraphQL
- Once logged in, click "Query myCloset"
- See the response with closet items
- Check browser DevTools Network tab to see the request headers

### Step 4: Logout
- Click "Logout" button to clear tokens and user state

## Key Features

✅ **Automatic Token Management** - Tokens stored/cleared automatically
✅ **Type-Safe** - Full JavaScript/React integration
✅ **Error Handling** - Try/catch with user-friendly error messages
✅ **Persistent Sessions** - Tokens stored in localStorage
✅ **Apollo Caching** - Built-in query result caching
✅ **Development Ready** - Test route available for verification

## Next Steps

1. **Integrate into your app** - Remove test component, add real queries
2. **Add more GraphQL queries** - Create queries for stories, music, commerce, etc.
3. **Error boundaries** - Add error UI for network failures
4. **Token refresh** - Add refresh token flow for long-lived sessions
5. **Offline support** - Consider Apollo Offline Plugin for better UX

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid token" | Check token format in localStorage, ensure Cognito pool matches config |
| "Unauthorized" | Verify user has Cognito group/role for accessing that resolver |
| "Field not found" | Query might not exist in schema, check AppSync schema |
| CORS errors | CORS should be handled by CloudFront, check distribution config |

---

**All stacks deployed and ready!** 🚀
