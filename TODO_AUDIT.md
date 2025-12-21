# TODO Audit - Feature Completeness Checklist

**Last Updated:** December 21, 2025  
**Audit Commit:** 6ea8972  
**Total TODOs Found:** 18  

---

## Summary by Category

| Category | Count | Priority | Status |
|----------|-------|----------|--------|
| **Collaboration System** | 6 | HIGH | ❌ Incomplete |
| **Prime Bank (Economy)** | 4 | HIGH | ⚠️ Partially Complete |
| **Content Moderation** | 1 | HIGH | ❌ Incomplete |
| **Layout Validation** | 1 | MEDIUM | ❌ Incomplete |
| **Analytics & Metrics** | 1 | MEDIUM | ❌ Incomplete |
| **Emotional Content Mix** | 1 | MEDIUM | ⚠️ Placeholder |
| **Episode Components** | 1 | LOW | ❌ Stub |
| **Closet Item Cleanup** | 1 | LOW | ⚠️ Optional |
| **Promo System** | 2 | BACKLOG | ❌ Incomplete |

---

## 🔴 HIGH PRIORITY - Block MVP Ship

### Group 1: Collaboration System (6 TODOs)
**Status:** ❌ All need implementation  
**Impact:** Core feature for creator partnerships  
**Files:** `lambda/collab/*`

#### TODO #1: `collab/create-invite.ts`
- **Type:** Feature Incomplete
- **Current State:** Stub returning `{ ok: true }`
- **Requirement:** Implement real invite logic
- **Implementation Needed:**
  - Validate inviter is authenticated + has creator role
  - Create invite record in DynamoDB (`COLLABORATIONS` table)
  - Send notification to invitee
  - Set invite expiration (14 days default)
  - Return invite token/ID
- **Estimated Effort:** 4 hours
- **Dependencies:** Notifications system, user tier validation

#### TODO #2: `collab/accept-invite.ts`
- **Type:** Feature Incomplete
- **Current State:** Stub returning `{ ok: true }`
- **Requirement:** Accept collaboration invite
- **Implementation Needed:**
  - Validate invite exists + not expired
  - Create collaboration relationship in DynamoDB
  - Create shared closet/workspace
  - Update both users' collaboration list
  - Send confirmation notifications
- **Estimated Effort:** 4 hours
- **Dependencies:** Invite validation, shared workspace creation

#### TODO #3: `collab/accept-terms.ts`
- **Type:** Feature Incomplete
- **Current State:** Stub returning `{ ok: true }`
- **Requirement:** User accepts collaboration terms
- **Implementation Needed:**
  - Validate collaboration exists
  - Mark terms as accepted in DynamoDB
  - Set acceptance timestamp
  - Trigger workflow if both parties accepted
- **Estimated Effort:** 2 hours
- **Dependencies:** Workflow orchestration

#### TODO #4: `collab/admin-review.ts`
- **Type:** Feature Incomplete
- **Current State:** Stub returning `{ ok: true }`
- **Requirement:** Admin reviews collab requests
- **Implementation Needed:**
  - Load collaboration details
  - Validate admin role
  - Apply approval/rejection logic
  - Update collaboration status
  - Emit events for acceptance/rejection
  - Notify both parties
- **Estimated Effort:** 3 hours
- **Dependencies:** Admin role validation, event system

#### TODO #5: `collab/deadline-reminder.ts`
- **Type:** Feature Incomplete
- **Current State:** Stub returning `{ ok: true }`
- **Requirement:** Send reminders for collab deadlines
- **Implementation Needed:**
  - Query active collaborations with upcoming deadlines
  - Calculate days until deadline
  - Send SMS/push notifications
  - Log reminder sent to DynamoDB
- **Estimated Effort:** 3 hours
- **Dependencies:** Notification system, DynamoDB query

#### TODO #6: `collab/presign-upload.ts`
- **Type:** Feature Incomplete
- **Current State:** Stub returning `{ ok: true }`
- **Requirement:** Presign uploads for collaborative content
- **Implementation Needed:**
  - Validate user is part of collaboration
  - Generate S3 presigned URL (POST)
  - Scope to shared collaboration prefix: `collabs/{collabId}/{userId}/{fileName}`
  - Return signed URL + upload metadata
- **Estimated Effort:** 2 hours
- **Dependencies:** S3 permissions, collaboration validation

---

### Group 2: Prime Bank Economy (4 TODOs)
**Status:** ⚠️ 50% complete (logic stubbed, validation missing)  
**Impact:** Core monetization/rewards system  
**Files:** `lambda/prime-bank/*`

#### TODO #7: `prime-bank/award-prime-coins.ts`
- **Type:** Validation Missing
- **Current State:** Writes to account without validation
- **Requirement:** Add validation, caps, etc.
- **Implementation Needed:**
  - Validate userId exists
  - Validate amount > 0 and <= max single award (1000)
  - Check daily cap not exceeded
  - Verify source is valid enum (dailyLogin, viewContent, etc)
  - Log award with source for audit trail
  - Emit event to analytics
- **Estimated Effort:** 2 hours
- **Dependencies:** Config service, event pipeline

#### TODO #8: `prime-bank/calculate-bank-meter.ts`
- **Type:** Logic Placeholder
- **Current State:** Hardcoded `newMeterValue = 10`
- **Requirement:** Use real logic for bank meter calculation
- **Implementation Needed:**
  - Load user's account stats (totalCoins, totalXP, tier)
  - Calculate meter based on:
    - Coins spent this month
    - Items unlocked
    - Creator tier level
    - Account age
  - Return progress percentage (0-100)
  - Include breakdown of what earned points
- **Estimated Effort:** 3 hours
- **Dependencies:** Account data model, metrics

#### TODO #9: `prime-bank/enforce-earning-caps.ts`
- **Type:** Config Hardcoded
- **Current State:** Caps hardcoded in code
  ```typescript
  const dailyCap = role === "Bestie" ? 100 : 50;
  const weeklyCap = role === "Bestie" ? 500 : 250;
  ```
- **Requirement:** Pull from config, implement reset logic
- **Implementation Needed:**
  - Load caps from DynamoDB config or environment
  - Track dailyCoinTotal / weeklyCoinTotal per user
  - Implement reset timers:
    - Daily reset at midnight UTC
    - Weekly reset on Monday UTC
  - Return remaining cap + reset time
- **Estimated Effort:** 3 hours
- **Dependencies:** Config service, time utilities

#### TODO #10: `prime-bank/calculate-bank-meter.ts` (collab context)
- **Type:** Feature Incomplete
- **Current State:** Logic only considers individual progress
- **Requirement:** Support collaborative earnings visibility
- **Implementation Needed:**
  - Show shared collab earnings pool
  - Split earnings between collaborators
  - Track individual vs shared coins
- **Estimated Effort:** 3 hours
- **Dependencies:** Collaboration data model

---

### Group 3: Content Moderation (1 TODO)
**Status:** ❌ Not implemented  
**Impact:** Safety & compliance critical  
**Files:** `lambda/closet/moderation.ts`

#### TODO #11: `closet/moderation.ts`
- **Type:** Feature Incomplete
- **Current State:** Stub logging event, returning OK
- **Requirement:** Implement real moderation logic
- **Implementation Needed:**
  - Load item from DynamoDB
  - Apply moderation rules:
    - Text content: profanity filter, character limits
    - Images: explicit content detection (AWS Rekognition)
    - Metadata: validate tags, descriptions
  - Apply AI checks (if enabled)
  - Update item status:
    - `pending` → `approved` or `rejected`
    - Send rejection reason if failed
  - Emit events:
    - `item.moderated` (status + reason)
    - `item.rejected` (if blocked)
  - Notify user of decision
- **Estimated Effort:** 6 hours
- **Dependencies:** Rekognition API, moderation rules engine

---

## 🟡 MEDIUM PRIORITY - Before General Availability

### Group 4: Layout Validation (1 TODO)
**Status:** ❌ Incomplete  
**Impact:** Closet UI stability  
**Files:** `lambda/layout/validate-layout.ts`

#### TODO #12: `layout/validate-layout.ts`
- **Type:** Validation Placeholder
- **Current State:** Returns `layoutValid: true` for any parseable JSON
- **Requirement:** Apply real JSON Schema validation + accessibility rules
- **Implementation Needed:**
  - Load JSON Schema from S3 or config
  - Validate layout structure:
    - Required fields: `anchors`, `bounds`, `version`
    - Type checking for coordinates
    - Size constraints
  - Accessibility checks:
    - Minimum tap targets: 48x48px
    - Color contrast: WCAG AA minimum
    - Tab order consistency
  - Return validation report:
    - `layoutValid: boolean`
    - `issues: { field, rule, message }[]`
  - Cache schema (TTL 1 hour)
- **Estimated Effort:** 4 hours
- **Dependencies:** JSON Schema library, accessibility rules

---

### Group 5: Analytics & Metrics (2 TODOs)
**Status:** ❌ Incomplete  
**Impact:** Admin dashboard, business intelligence  
**Files:** `lambda/analytics/admin-metrics.ts`, `lambda/emotional-pr/goalCompassAnalytics.ts`

#### TODO #13: `analytics/admin-metrics.ts`
- **Type:** Backend Integration Needed
- **Current State:** Returns stub with placeholder message
- **Requirement:** Hook into S3 logs / DynamoDB pipeline
- **Implementation Needed:**
  - Query CloudWatch Logs for usage metrics
  - Aggregate from DynamoDB:
    - Active users per day
    - Coins distributed per day
    - Items created/approved per day
    - Avg session duration
    - Creator tier distribution
  - Calculate:
    - Growth rate (week-over-week)
    - Retention rate
    - Engagement score
  - Return dashboard-ready data:
    ```json
    {
      "generatedAt": "ISO string",
      "dailyActiveUsers": 0,
      "totalCoinsDistributed": 0,
      "itemsModerated": 0,
      "avgSessionDuration": 0,
      "contentMixMetrics": {}
    }
    ```
- **Estimated Effort:** 5 hours
- **Dependencies:** CloudWatch Logs API, metrics aggregation

#### TODO #14: `emotional-pr/goalCompassAnalytics.ts`
- **Type:** Logic Placeholder
- **Current State:** Wobbles target mix randomly
- **Requirement:** Calculate actual mix based on real data
- **Implementation Needed:**
  - Query user's actual content consumption history
  - Aggregate by pillar:
    - Personality: selfie posts, personal stories
    - Nurture: supportive content, comments
    - Authority: expertise posts, tutorials
  - Calculate weighted average (last 30 days)
  - Compare actual vs target
  - Return recommendations if significantly skewed
- **Estimated Effort:** 4 hours
- **Dependencies:** Content analytics data model

---

### Group 6: Episode Components (1 TODO)
**Status:** ❌ Stub  
**Impact:** Story/episode system  
**Files:** `lambda/prime/episode-components.ts`

#### TODO #15: `prime/episode-components.ts`
- **Type:** Feature Incomplete
- **Current State:** Stubs empty component records
- **Requirement:** Generate modular parts from template
- **Implementation Needed:**
  - Load episode template from DynamoDB
  - Generate component instances:
    - Invite component: collection setup
    - Envelope component: message/story wrapper
    - Closet component: outfit display
    - Commerce component: product recommendations
  - Set component-specific config
  - Return fully initialized episode structure
- **Estimated Effort:** 3 hours
- **Dependencies:** Template data model

---

## 🟢 LOW PRIORITY - Nice to Have

### Group 7: Closet Item Cleanup (1 TODO)
**Status:** ⚠️ Optional  
**Impact:** Data consistency, storage optimization  
**Files:** `lambda/closet/resolver.ts` (line 547)

#### TODO #16: `closet/resolver.ts` - Delete cascade
- **Type:** Data Cleanup
- **Current State:** Deletes closet item record only
- **Requirement:** Optionally delete likes/comments/etc under closet item
- **Implementation Needed:**
  - Optional flag: `cascadeDelete: boolean` (default false)
  - If true, delete all:
    - Likes: Query `GSI1 = itemId`, delete batch
    - Comments: Query `GSI2 = itemId`, delete batch
    - Notifications mentioning this item
  - Return summary: `{ deletedLikes, deletedComments, deletedNotifications }`
  - Add safeguard: Only allow admin or item owner
- **Estimated Effort:** 2 hours
- **Dependencies:** Batch delete utilities

---

## 🔵 BACKLOG - Post-MVP

### Group 8: Promo System (2 TODOs)
**Status:** ❌ Incomplete  
**Impact:** Marketing & creator promotion  
**Files:** `lambda/promo/*`

#### TODO #17: `promo/generate-promo-kit.ts`
- **Type:** Feature Incomplete
- **Current State:** Stub returning OK
- **Requirement:** Implement real invite logic for promo kit generation
- **Implementation Needed:**
  - Load creator's brand assets from S3
  - Generate promotional templates:
    - Instagram story template (1080x1920)
    - TikTok video intro (1080x1920, MP4)
    - Discord invite graphic
  - Customize with creator name/handle
  - Generate shareable links with tracking UTM
  - Return ZIP of assets + social post templates
- **Estimated Effort:** 5 hours
- **Dependencies:** Image generation service, S3 upload

#### TODO #18: `promo/generate-preview.ts` & `promo/hall-of-slay.ts`
- **Type:** Feature Incomplete
- **Current State:** Both stubs returning OK
- **Requirement:** Implement promo preview + hall of slay logic
- **Implementation Needed:**
  - **generate-preview.ts:**
    - Generate preview image of creator's closet
    - Show sample outfits + engagement metrics
    - Create shareable preview card
  - **hall-of-slay.ts:**
    - Rank creators by metrics (engagement, coins earned, items)
    - Generate leaderboard HTML/image
    - Cache results (update hourly)
    - Return top 10 creators with badges
- **Estimated Effort:** 6 hours
- **Dependencies:** Image generation, ranking algorithms

---

## 📋 Implementation Priority Queue

**For MVP Ship (Must Complete):**
1. ✅ Security hardening (COMPLETE)
2. ❌ Collaboration system (6 TODOs)
3. ❌ Moderation system (1 TODO)
4. ❌ Prime Bank validation (4 TODOs)

**Before General Availability:**
5. ❌ Layout validation (1 TODO)
6. ❌ Analytics pipeline (2 TODOs)

**Post-MVP Polish:**
7. ❌ Episode components (1 TODO)
8. ⚠️ Closet cleanup cascade (1 TODO)
9. ❌ Promo system (2 TODOs)

---

## 🔧 Developer Quick Links

### Files Needing Work
- `lambda/collab/` - 6 files, 10-20 hours
- `lambda/prime-bank/` - 4 files, 8-10 hours
- `lambda/closet/moderation.ts` - 6 hours
- `lambda/layout/validate-layout.ts` - 4 hours
- `lambda/analytics/admin-metrics.ts` - 5 hours
- `lambda/emotional-pr/goalCompassAnalytics.ts` - 4 hours
- `lambda/promo/` - 11 hours
- `lambda/prime/episode-components.ts` - 3 hours
- `lambda/closet/resolver.ts` - 2 hours

### Total Estimated Effort
- **MVP Critical:** 40-50 hours
- **Pre-GA:** 11-12 hours
- **Post-MVP:** 21-23 hours
- **Total:** 72-85 hours of development

---

## ✅ Migration Checklist

When implementing these features:

- [ ] Use LambdaLogger from `lambda/_shared/logger.ts` (not console.log)
- [ ] Follow LOGGING.md best practices (no full events, hash userId)
- [ ] Add input validation (types, ranges, enum values)
- [ ] Add error handling with proper HTTP status codes
- [ ] Add unit tests for validation + happy path
- [ ] Document feature in resolver/schema comments
- [ ] Add feature flag if partial rollout needed
- [ ] Link implementation to GitHub Issue
- [ ] Update this audit when moving features from TODO → Implementation

---

**Last Reviewed:** December 21, 2025 (Commit 6ea8972)  
**Next Review:** After first MVP feature implementation  
**Maintained By:** Engineering team
