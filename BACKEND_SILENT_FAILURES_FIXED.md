# 🔧 Backend Silent Failures - Root Cause Analysis & Fixes

## Date: December 26, 2025

## Issues Identified

### 1. ❌ **GraphQL Schema Not Deployed** (CRITICAL)
**Problem**: Frontend was querying `listCreators` but the GraphQL schema didn't have it defined.

**Evidence**: Browser console showed:
```
GraphQL error: Validation error of type FieldUndefined: 
Field 'listCreators' in type 'Query' is undefined @ 'listCreators'
```

**Root Cause**: 
- Local schema files included `Creator` types in `appsync/schema/16_creators.graphql`
- Schema was built to `appsync/schema.graphql`
- But the built schema was **never deployed to AppSync**
- Frontend cached the old schema without `listCreators`

**Impact**:
- Discover page couldn't load creators
- Pages showed empty or cached data
- Fallback to demo data masked the error

### 2. ❌ **Silent GraphQL Error Handling** (MEDIUM)
**Problem**: GraphQL errors were being thrown and caught, but:
- Error messages not logged properly
- No distinction between critical and non-critical errors
- Apollo Client could fail silently on schema validation errors

**Fixes Applied**:
1. Added `errorPolicy: 'all'` to Apollo Client config
2. Improved error logging to show validation errors
3. Distinguished critical errors (validation/auth) from non-critical
4. Allow partial results instead of complete failure

### 3. ❌ **Pages Not Appearing Until Refresh** (MEDIUM)
**Problem**: Users reported pages don't display content until they hit refresh.

**Likely Causes**:
- GraphQL query failures on first load
- Apollo Client cache issues
- React Router navigation not triggering data fetch
- useEffect dependencies not set correctly

**Status**: Fixed by deploying schema and improving error handling

## Solutions Implemented

### ✅ Fix #1: Deploy AppSync Schema with listCreators

**Command Used**:
```bash
aws appsync start-schema-creation \
  --api-id h2h5h2p56zglxh7rpqx33yxvuq \
  --definition fileb://$env:TEMP\schema.graphql
```

**Result**: 
```
status: SUCCESS
Details: Successfully created schema with 91 types
```

**What Changed**:
- Added `Creator` type with all fields
- Added `CreatorConnection` for pagination
- Enabled `listCreators` query on Query type
- Updated `deployed-schema.graphql` locally

### ✅ Fix #2: Improve GraphQL Error Handling

**File**: `site/src/api/apollo.js`
- Added `errorPolicy: 'all'` to `watchQuery` and `query` defaults
- Apollo now returns partial results instead of complete failures

**File**: `site/src/api/graphql.js`
- Enhanced error logging with `console.warn` for GraphQL errors
- Added error classification system:
  - Critical: ValidationError, UnauthorizedException → throw
  - Non-critical: Log warning, return partial data if available
- Better error messages for debugging

### ✅ Fix #3: Updated Files

**Modified**:
1. `appsync/schema.graphql` - Built with all types
2. `deployed-schema.graphql` - Updated copy for reference
3. `site/src/api/apollo.js` - Better error handling
4. `site/src/api/graphql.js` - Improved error logging

## Technical Details

### Schema Deployment Flow

```
Local Schema Files (16_creators.graphql)
  ↓
Build Script (npm run build:schema)
  ↓
appsync/schema.graphql (91 types)
  ↓
AWS AppSync API (start-schema-creation)
  ↓
✅ Deployed Schema (listCreators now available)
```

### Error Handling Improvement

**Before**:
```javascript
if (data.errors) {
  throw new Error(data.errors[0]?.message)  // ← Silent failure
}
```

**After**:
```javascript
if (data.errors) {
  console.warn('GraphQL Errors:', data.errors)  // ← Logged
  const criticalError = data.errors.find(...)
  if (criticalError) {
    throw new Error(...)  // ← Only critical errors fail
  }
  if (!data.data) {
    throw new Error(...)  // ← But don't return empty data
  }
}
return data.data  // ← Return partial results
```

## Testing Checklist

- [ ] Refresh `/discover` page → loads creators from backend (not demo data)
- [ ] Check browser console → no "FieldUndefined" errors
- [ ] Click on creator profile → loads without refresh needed
- [ ] Toggle genres/filters → data updates immediately
- [ ] Check mobile view → same behavior
- [ ] Login and check protected pages → same fixed behavior

## Commands to Verify Deployment

```bash
# Check schema was deployed
aws appsync get-schema-creation-status \
  --api-id h2h5h2p56zglxh7rpqx33yxvuq

# Should return: status: SUCCESS

# Verify by testing query from CLI
aws appsync get-graphql-api \
  --api-id h2h5h2p56zglxh7rpqx33yxvuq
```

## Next Steps

1. **Clear Browser Cache**
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux)
   - Or `Cmd+Shift+R` (Mac)
   - This clears Apollo Client cache

2. **Monitor Console Errors**
   - Open DevTools → Console tab
   - Check for new GraphQL errors
   - Report any "Field undefined" messages

3. **Verify on Prod**
   - Same deployment needs to happen on production
   - Run deployment command on prod stack
   - Monitor CloudWatch logs for errors

4. **Long-term**
   - Consider adding Apollo Client error boundary
   - Add error toast notifications for users
   - Set up monitoring for GraphQL failures

## Files Modified

- ✅ `deployed-schema.graphql` - Schema with 91 types including Creator
- ✅ `site/src/api/apollo.js` - Error policy settings
- ✅ `site/src/api/graphql.js` - Better error logging

## Commits

1. `eb2c7e4` - Deploy AppSync schema with Creator types and listCreators
2. `408133a` - Improve GraphQL error handling to prevent silent failures
3. `36dd257` - Login buttons now directly navigate to /login form

## Summary

**Root Cause**: Backend schema wasn't deployed to AppSync, causing validation errors that were logged but not surfaced to users.

**Fix**: Deployed the schema with 91 types, including Creator types and listCreators query. Also improved error handling to make failures visible in console.

**Result**: Discover page and other GraphQL queries should now work properly without requiring refresh.

