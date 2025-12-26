# LaLaVerse Authentication Architecture

## Overview
**One account. Many roles.** This is the core principle.

Users create a single identity that can have multiple roles assigned. This differs from separate accounts for each tier.

## Identity Model

### User Account
Single identity with:
- Email
- Password
- Profile (name, avatar)
- Prime Bank (coins/credits)
- Assets & Progress

### Roles (Assigned to Account)
A user can have **one or more** of these roles:

| Role | Description | Use Case |
|------|-------------|----------|
| **FAN** | Default, free tier | Browse, play, earn coins |
| **BESTIE** | Premium subscriber | Exclusive features, 2x earnings |
| **CREATOR** | Business tier | Create, monetize, analytics |
| **COLLAB** | Collaborator | Scoped access to projects |
| **ADMIN** | Platform admin | Moderation, settings, reporting |
| **PRIME** | Internal studio | Prime Studios tools |

Example user journey:
1. Sign up → assigned **FAN** role
2. Subscribe → add **BESTIE** role
3. Monetize → add **CREATOR** role
4. Now has all three roles, can access all features

## Sign-Up & Login Flow

### Sign-Up (New User)
```
1. Landing Page
   ↓
2. Choose sign-up method (Email, Google, Apple)
3. Verify email (optional)
4. **CRUCIAL:** Role Selection Screen → "How do you want to use Lalaverse?"
   - Fan (free)
   - Bestie (starts payment flow)
   - Creator (starts payment flow)
5. Role created in Cognito groups
6. Redirect to onboarding based on selected role
```

**Why the role selection screen matters:**
- Most users won't understand "Creator Portal is separate"
- This screen educates them BEFORE they sign up
- Sets correct expectations about features

### Login
```
1. Standard login (email + password, SSO via Google/Apple)
2. Check roles assigned to account
3. Route based on highest-tier role owned
   - If Creator → Creator Portal
   - Else if Bestie → Bestie Hub
   - Else → Fan Home
```

## Tier Upgrades (Fan → Bestie → Creator)

### Fan → Bestie
```
Action: User clicks "Upgrade to Bestie" button in-app
Payment: Credit card charge ($9.99/month)
Backend: Add BESTIE role to user
Result:
  - New pages unlock instantly
  - Prime coins: 2x multiplier
  - Profile & closet preserved
  - No re-login needed
```

### Bestie → Creator
```
Action: User clicks "Become Creator" button
Payment: Charge for starter tier
Backend: Add CREATOR role to user
Result:
  - Creator Studio unlocks
  - Creator Portal access
  - Keep all Bestie benefits
  - Convert some Prime Bank → Creator Credits
  - Preserve all assets
```

## Creator Portal & Collaboration (SSO)

### Architecture
```
Main App (lalaverse.com)
  ↓ OAuth/JWT tokens
Creator Portal (creators.lalaverse.com or /creator)
  ↓ Same tokens
Collab Portal (collabs.lalaverse.com or /collab)
  ↓ Same tokens
Admin Console (/admin)
```

### Creator Portal Login
If user is logged into main app:
```
Click "Open Creator Studio" → SSO redirect → Auto-logged in
```

If not logged in:
```
Creator Portal shows login → Checks for CREATOR role
- Has CREATOR? → Full access
- No role? → Show "Upgrade to Creator" paywall
```

### Collaborator Access
```
Invite email → Magic link → "Accept Collab Project"
  ↓
If account exists → Verify login → Grant COLLAB role (scoped to project)
If no account → Create account → Assign COLLAB role → Access project dashboard
```

## Route Structure (Recommended)

```
/                          # Landing
/welcome                   # Intro
/signup                    # Sign up form
/choose-your-path          # ★ CRITICAL: Role selection
/login                     # Login form
/callback                  # OAuth callback handler
/verify-email              # Email verification (optional)
/forgot-password           # Reset password
/reset-password/:token     # Reset form

/app                       # Main LaLaVerse app (role-gated)
  /fan                     # ★ Fan-specific routes
    /home                  # Fan home
    /episodes
    /styling
    /closet
    /challenges
    /blog
    /magazine
  /bestie                  # ★ Bestie-specific routes
    /home
    /closet
    /studio
    /challenges
  /creator                 # ★ Creator routes (CREATOR role)
    /studio
    /assets
    /analytics
    /earnings
    /collab-projects
  /collab                  # ★ Collab access (COLLAB role)
    /projects
    /assets
  /admin                   # ★ Admin console (ADMIN role)
    /users
    /moderation
    /settings
  /studio                  # ★ Prime Studios (PRIME role)
    /manage
    /publish

/upgrade/bestie            # Bestie payment & onboarding
/upgrade/creator           # Creator payment & onboarding

/access-denied             # 403 message with upgrade CTA
```

## Code Implementation

### Protected Routes
```jsx
// Require CREATOR role
<Route 
  path="/creator/*" 
  element={
    <ProtectedRoute roles={['creator']}>
      <CreatorPortal />
    </ProtectedRoute>
  } 
/>

// Multiple allowed roles
<Route 
  path="/bestie/*" 
  element={
    <ProtectedRoute roles={['bestie', 'creator']}>
      <BestieHub />
    </ProtectedRoute>
  } 
/>
```

### Check Role in Component
```jsx
function MyComponent() {
  const { userContext } = useAuth()
  
  if (userContext.isCreator) {
    return <CreatorFeature />
  }
  
  return <UpgradePrompt />
}
```

## Cognito Configuration

### User Pool
```
User Pool: us-east-1_sIfwPCZwf
Client ID: 12hajdhq8gurfpfqieenrlsek8
Domain: stylingadventures.auth.us-east-1.amazoncognito.com
```

### Groups (Roles)
```
FAN                # Default group
BESTIE             # Premium subscribers
CREATOR            # Creators & monetization
COLLAB             # Collaborators
ADMIN              # Platform admins
PRIME              # Internal studios
```

### Tokens
```
ID Token (JWT)     → User claims, groups
Access Token (JWT) → API authorization
Refresh Token      → 30-day rotation
```

## Security Checklist

- [x] Age gate at signup (18+ confirmation)
- [ ] Session management (logout inactive after 30 min)
- [ ] 2FA for CREATOR + ADMIN + PRIME roles
- [ ] Rate limiting on login endpoints
- [ ] Audit logs for sensitive actions
- [ ] HTTPS everywhere
- [ ] Secure cookie flags (httpOnly, Secure, SameSite)
- [ ] CORS configured for trusted domains
- [ ] Token rotation on refresh

## Common Gotchas to Avoid

❌ **Separate accounts for Creator Portal**
→ Causes user confusion, lost logins, duplicate data

❌ **Forcing users to understand roles**
→ They don't. Show them in the role selection screen.

❌ **No "Choose your path" screen**
→ Users think they're picking an account type, not a role

❌ **Role-based paywalls that don't educate**
→ Always explain what they're missing and why

❌ **Collaborators accessing unintended areas**
→ Scope their role access strictly to their projects

❌ **Mixing authentication with features**
→ Authentication = login. Features = roles. Keep separate.

## Next Steps

1. ✅ Create /choose-your-path screen
2. ✅ Update AuthContext to support multi-role model
3. ✅ Update ProtectedRoute to check role arrays
4. [ ] Create /upgrade/bestie and /upgrade/creator paywall screens
5. [ ] Implement Cognito group assignment in Lambda (pre-token-generation)
6. [ ] Create Creator Portal separate domain/app (can be same login)
7. [ ] Create Collab Portal with scoped access
8. [ ] Test full flow: Signup → Choose Path → Role Assignment → Feature Access
9. [ ] Add role to all user-facing error messages
10. [ ] Document Creator Portal SSO handoff
