# Auth Quick Reference Card

## Routes Summary

| Route | Purpose |
|-------|---------|
| `/signup` | Sign up |
| `/login` | Login |
| `/callback` | OAuth callback |
| `/choose-your-path` | Role selection |
| `/fan/home` | Fan home (auth required) |
| `/bestie/home` | Bestie home (Bestie+ required) |

## Cognito

```
User Pool: us-east-1_sIfwPCZwf
Client: 12hajdhq8gurfpfqieenrlsek8
Domain: stylingadventures.auth.us-east-1.amazoncognito.com
```

## User Context

```javascript
const { userContext } = useAuth()
// userContext.isFan, .isBestie, .isCreator, .isAdmin, etc.
// userContext.tier = "fan" | "bestie" | "creator"
// userContext.allGroups = ["FAN"]
```

## Protected Route

```javascript
<ProtectedRoute roles={['creator']}>
  <CreatorPortal />
</ProtectedRoute>
```

## Signup Flow
```
/signup → Cognito → /callback → /choose-your-path → /fan/home
```

## Login Flow
```
/login → Cognito → /callback → /dashboard
```

## JWT Claims
```javascript
{
  "cognito:groups": ["FAN"],  // This tells us the role
  "email": "user@example.com",
  "sub": "uuid",
  ...
}
```

## Debugging

```javascript
// Check stored tokens
JSON.parse(localStorage.getItem('cognito_tokens'))

// Parse JWT
const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
JSON.parse(atob(base64))
```

## Files

- `src/context/AuthContext.jsx` - Auth state
- `src/pages/Signup.jsx` - Signup form
- `src/pages/Login.jsx` - Login form
- `src/pages/ChooseYourPath.jsx` - Role selection
- `src/components/ProtectedRoute.jsx` - Route protection
- `src/api/roles.js` - Role utilities

---

See `AUTH_ARCHITECTURE.md` for full details
