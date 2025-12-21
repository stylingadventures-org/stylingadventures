# Mobile & Responsive Testing Guide

## Authentication System - Mobile Testing Checklist

### 1. Login Modal Responsive Test
- [ ] **Screen Size**: Test on 375px (iPhone SE) to 600px widths
- [ ] **Modal Width**: Modal should not exceed 90% of screen width
- [ ] **Form Fields**: Inputs should be fully visible without horizontal scroll
- [ ] **Button Height**: Buttons should have adequate touch targets (min 44px height)
- [ ] **Keyboard**: Virtual keyboard shouldn't cover submit button
- [ ] **Error Messages**: Error text should be fully readable on small screens

### 2. Error Message Display
- [ ] Cognito error messages truncated at 100 chars for mobile
- [ ] Error box with ⚠ icon visible at all widths
- [ ] Toast notifications positioned above keyboard
- [ ] Clear color contrast: white text on pink/red background

### 3. Loading States
- [ ] Spinner animation works on mobile browsers
- [ ] "Signing in..." text fits on button at all widths
- [ ] Disabled state is visually distinct (opacity change)
- [ ] No janky animations or layout shifts during loading

### 4. Email Verification Modal
- [ ] Code input field with 6-char limit displays correctly
- [ ] Letter spacing for code is visible on small screens
- [ ] "Resend code" link accessible without scrolling
- [ ] Paste works for entering verification code from email

### 5. Password Reset Flow
- [ ] "Forgot Password?" link remains clickable on mobile
- [ ] Reset form modal responsive at all widths
- [ ] "Back to Sign In" button clearly accessible

### 6. Header Authentication Display
- [ ] "✓ Signed in as [email]" displays without truncation
- [ ] Logout button has adequate spacing and touch area
- [ ] Header doesn't overflow on narrow screens
- [ ] Navigation links stack or collapse properly on mobile

### 7. Route-Based Redirects
- [ ] After login, users redirected to correct section
- [ ] Loading spinner shows while auth checks complete
- [ ] No flashing or layout shifts during redirect
- [ ] Fastidious handling if redirect fails

### 8. Token Refresh (Silent)
- [ ] No UI disruption when token refreshes (every 55 minutes)
- [ ] User stays logged in during background refresh
- [ ] Network error during refresh handled gracefully
- [ ] If refresh fails, user logged out cleanly with message

### 9. Session Persistence
- [ ] User stays logged in after app reload
- [ ] Session survives mobile app backgrounding/returning
- [ ] localStorage tokens sync across tabs/windows
- [ ] sessionStorage used for immediate session detection

### 10. Browser Compatibility
- [ ] iOS Safari 14+: Full auth flow works
- [ ] Chrome Android: Full auth flow works
- [ ] Firefox Mobile: Full auth flow works
- [ ] Edge Mobile: Full auth flow works

## Test Devices & Sizes

### Physical Devices
- iPhone 12/13 mini (375px)
- iPhone 12/13 standard (390px)
- iPhone 12/13 Pro Max (428px)
- Samsung Galaxy S21 (360px)
- Pixel 6 (412px)
- iPad 10.2" (768px landscape)

### Browser DevTools Emulation
- iPhone SE (375x667)
- iPhone 12 (390x844)
- iPhone 14 Pro (393x852)
- Pixel 5 (393x851)
- Galaxy Tab S4 (712x1138 landscape)

## Performance Targets (Mobile)
- First Paint: <1.5s on 3G
- Login form interactive: <2s
- Modal render time: <500ms
- Token refresh silent: <1s
- Error toast display: <200ms

## Debugging Mobile Auth Issues

### Check Browser Console
```
// View auth event logs
JSON.parse(sessionStorage.getItem('authLogs'))

// Check stored tokens
console.log({
  idToken: sessionStorage.getItem('id_token'),
  user: localStorage.getItem('user')
})

// Monitor token refresh
// Watch for [Auth TOKEN_REFRESH_START] messages
```

### Common Mobile Issues
1. **Virtual Keyboard Covers Submit Button**
   - Solution: Modal scrolls on focus, button visibility maintained

2. **Network Latency Makes Spinner Appear Janky**
   - Solution: Minimum 300ms loading state for UX consistency

3. **Touch Targets Too Small**
   - Solution: All buttons 44px+ height, 44px+ width minimum

4. **Session Lost After Navigation**
   - Solution: Check localStorage persists across app lifecycle

5. **Copy-Paste Verification Code**
   - Solution: Input accepts pasted 6-digit codes

## Test Accounts for Mobile Testing
```
ADMIN:   admin@example.com / TestPass123!
CREATOR: test@example.com / TestPass123!
BESTIE:  bestie@example.com / TestPass123!
FAN:     fan@example.com / TestPass123!
```

## Mobile Auth Flow Expected Behavior

### Login Flow
1. User opens app on mobile
2. Taps "Sign In" button (or auto-shown if not authenticated)
3. Modal appears, responsive to screen size
4. User enters email and password
5. Tap sign in, see spinner animation
6. Error or success toast appears
7. On success, modal closes, app redirects to user tier section

### Email Verification (if needed)
1. Login shows "Email not verified" error
2. User taps "Verify Email"
3. Code input modal appears
4. User checks email on mobile, copies code
5. Pastes into code field (6 digits)
6. Taps verify
7. Success toast, prompted to log in again

### Logout Flow
1. User taps logout button in header
2. Session clears immediately
3. App redirects to home page
4. Confirmation toast shows
5. Login button reappears

## Monitoring & Analytics
Auth events logged to sessionStorage every 5 minutes:
- LOGIN_START, LOGIN_SUCCESS, LOGIN_FAILED
- TOKEN_REFRESH_START, TOKEN_REFRESH_SUCCESS, TOKEN_REFRESH_FAILED
- SESSION_CHECK, SESSION_RESTORED, NO_SESSION
- LOGOUT_START, LOGOUT_SUCCESS

View in console: `JSON.parse(sessionStorage.getItem('authLogs'))`
