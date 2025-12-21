# Build #22: Feature Development Plan

**Status:** Planning Phase  
**Start Date:** December 21, 2025  
**Estimated Duration:** 40-50 hours across 5 feature groups  
**GitHub Branch:** feature/build-22-features

---

## Executive Summary

Build #22 implements 5 critical feature systems enabling the core LaLa Universe gameplay loops:
1. **Collaboration System** - Creator partnerships & shared workflows
2. **Prime Bank Economy** - Gamified rewards & progression
3. **Content Moderation** - Safety & compliance for user-generated content
4. **Layout Validation** - Accessible, stable UI framework
5. **Analytics Dashboard** - Business intelligence for Prime Studios

**Key Business Drivers:**
- Enable creator partnerships (Collaboration)
- Unlock monetization/engagement (Prime Bank)
- Ensure content safety (Moderation)
- Provide admin visibility (Analytics)
- Build accessible product (Layout)

---

## Architecture Overview

### System Dependencies
```
Collaboration System
├── User auth (✅ complete)
├── DynamoDB collaborations table
├── Notification system
└── S3 shared workspace

Prime Bank Economy  
├── User tier system (✅ complete)
├── DynamoDB accounts table
├── Analytics event pipeline
└── Config service (caps, rates)

Content Moderation
├── DynamoDB content table
├── AWS Rekognition API
├── Notification system
└── Audit logging

Layout Validation
├── JSON Schema validation library
├── Accessibility rule engine
└── Schema caching (Redis/DynamoDB)

Analytics Dashboard
├── CloudWatch Logs query
├── DynamoDB aggregation
├── Time-series data model
└── GraphQL resolvers
```

---

## Task 1: Collaboration System (6 Features)

### Overview
Enables creators to invite, partner, and collaborate on shared content.

**Files to Create/Modify:**
- `lambda/collab/create-invite.ts`
- `lambda/collab/accept-invite.ts`
- `lambda/collab/accept-terms.ts`
- `lambda/collab/admin-review.ts`
- `lambda/collab/deadline-reminder.ts`
- `lambda/collab/presign-upload.ts`
- `lib/types/collaboration.ts` (types)
- `lib/services/collaboration.service.ts` (business logic)
- `appsync/schema/collaboration.graphql` (API)

### DynamoDB Schema
```
COLLABORATIONS Table:
- PK: collabId (uuid)
- SK: status#createdAt
- GSI1: inviterId#status | GSI2: inviteeId#status
- masterTermsAccepted: {inviterId: timestamp, inviteeId: timestamp}
- addendumTermsAccepted: {inviterId: timestamp, inviteeId: timestamp}
- addendumConfig: {deliverables: [], deadlines: {}, customSplit: {prime_pct, creator_pct}, exclusivityTier}
- sharedPrefix, totalEarningsPool, earningsSplit: {prime_pct, creator_pct}
- createdAt, expiresAt, deadline, notifications

COLLAB_INVITES Table:
- PK: inviteId (uuid) | SK: expiresAt (14 days from creation)
- token, collabId, inviterId, inviteeId, masterTermsVersion, createdAt

PRIME_ACCOUNTS Table:
- PK: userId
- dailyCoins, weeklyCoinTotal, monthlyCoinTotal
- lastResetDaily, lastResetWeekly, lastResetMonthly (timestamps)
- creatorMultiplier (1.0x | 1.5x | 2.0x-3.0x)
- repeatOffenderStrikes, accountTier, accountCreatedAt

PRIME_TRANSACTIONS Table:
- PK: userId | SK: transactionId#timestamp
- amount, source (dailyLogin|viewContent|creatorReward|collabEarnings)
- reason, metadata, timestamp

PRIME_BANK_CONFIG Table:
- PK: configKey ("caps", "sources", "multipliers", "moderation")
- dailyCapFan: 10, dailyCapBestie: 15, dailyCapCreator: 25
- weeklyCapFan: 60, weeklyCapBestie: 90, weeklyCapCreator: 150
- sourceRates, multipliers, repeatingOffenderStrikes

MODERATION_CONFIG Table:
- PK: "rekognition_thresholds"
- autoRejectThreshold: 95%, humanReviewThreshold: 85%, autoApproveThreshold: 60%
- repeatOffenderStrikes, minorsShadowModerationRules

MODERATION_AUDIT Table:
- PK: itemId | SK: timestamp#reviewer
- status (pending|approved|rejected|pending_human_review)
- rekognitionResults, confidence, reason, actionTaken
```

### Feature Breakdown

**#1.1 Create Invite** (2 hours)
- Validate inviter is authenticated + has creator role
- Generate invite token
- Create COLLAB_INVITES record (expires in 14 days)
- Create COLLABORATIONS record (status: pending_invite)
- Send notification to invitee
- Return invite link + metadata

**#1.2 Accept Invite** (2.5 hours)
- Validate invite exists + not expired + invitee matches
- Create COLLABORATIONS entry (status: pending_terms)
- Provision shared S3 prefix: `collabs/{collabId}/`
- Create shared DynamoDB read access
- Send acceptance notification to inviter
- Return collaboration workspace metadata

**#1.3 Accept Terms** (1.5 hours)
- Load collaboration by ID
- Validate requesting user is participant
- Mark terms as accepted + timestamp
- If both parties accepted → status: active, emit event
- Trigger workflow orchestration

**#1.4 Admin Review** (2 hours)
- Load collaboration details
- Validate admin role
- Apply approval/rejection logic
- Update status: approved | rejected
- Send notifications to both parties
- Emit events to audit log

**#1.5 Deadline Reminder** (1.5 hours)
- Query active collaborations with upcoming deadlines
- Filter: 3-day window, 1-day window, overdue
- Send SMS/push notifications
- Log reminder sent in DynamoDB
- Handle notification preference fallback

**#1.6 Presign Shared Upload** (1.5 hours)
- Validate user is part of collaboration
- Generate S3 POST presigned URL
- Scope to: `collabs/{collabId}/{userId}/`
- Return signed URL + metadata
- Log upload initiation

### Estimated Effort: **11 hours**

---

## Task 2: Prime Bank Economy (4 Features)

### Overview
Gamified rewards system with coins, caps, tiers, and progression.

**Files to Create/Modify:**
- `lambda/prime-bank/award-prime-coins.ts`
- `lambda/prime-bank/calculate-bank-meter.ts`
- `lambda/prime-bank/enforce-earning-caps.ts`
- `lambda/prime-bank/collaborative-earnings.ts`
- `lib/services/prime-bank.service.ts` (business logic)
- `lib/config/bank-config.ts` (caps, rates)
- `appsync/schema/prime-bank.graphql` (API)

### DynamoDB Schema
```
PRIME_ACCOUNTS Table:
- PK: userId
- Fields: totalCoins, totalXP, tier, accountAge, monthlyEarnings, dailyEarnings, weeklyEarnings, lastResetDaily, lastResetWeekly, accountCreatedAt

PRIME_TRANSACTIONS Table:
- PK: userId
- SK: transactionId#timestamp
- Fields: amount, source (dailyLogin|viewContent|creatorReward|collabEarnings), reason, metadata, timestamp

PRIME_BANK_CONFIG Table:
- PK: configKey
- Fields: dailyCapBestie, dailyCapFree, weeklyCap, monthlyMax, singleAwardMax, sourceRates{}
```

### Feature Breakdown

**#2.1 Validate Award Coins** (1.5 hours)
- Validate userId exists
- Validate amount > 0 and <= 1000
- Check daily cap not exceeded (tier-dependent)
- Verify source is valid enum
- Load account + check monthly cap
- Create PRIME_TRANSACTIONS record
- Emit analytics event
- Return updated balance

**#2.2 Calculate Bank Meter** (2 hours)
- Load user account stats
- Calculate meter based on:
  - Coins earned this month (40% weight)
  - Items unlocked (30% weight)
  - Creator tier level (20% weight)
  - Account age multiplier (10% weight)
- Return progress 0-100
- Include breakdown array: `[{component, value, weight}]`
- Cache result (TTL 1 hour)

**#2.3 Enforce Earning Caps** (2 hours)
- Load config for daily/weekly/monthly caps
- Caps vary by tier (Bestie vs Free)
- Track: dailyCoinTotal, weeklyCoinTotal, monthlyCoinTotal
- Implement reset logic:
  - Daily: midnight UTC
  - Weekly: Monday UTC
  - Monthly: 1st UTC
- Return: remaining cap + reset timestamp
- Apply to all award operations

**#2.4 Collaborative Earnings** (1.5 hours)
- Track shared earnings pool per collaboration
- Split earnings between collaborators (50/50 default)
- Show individual vs shared coins in dashboard
- Emit collab_earnings event
- Support custom split percentages
- Update both users' accounts atomically

### Estimated Effort: **7 hours**

---

## Task 3: Content Moderation System (1 Feature)

### Overview
AI-powered content review ensuring safety and brand compliance.

**Files to Create/Modify:**
- `lambda/closet/moderation.ts`
- `lambda/closet/moderation-rules.ts`
- `lib/services/moderation.service.ts`
- `lib/services/rekognition.service.ts`
- `appsync/schema/moderation.graphql`

### DynamoDB Schema
```
CLOSET_ITEMS Table (enhanced):
- Add fields: moderationStatus (pending|approved|rejected), moderationReason, moderationTimestamp, moderationReviewedBy

MODERATION_AUDIT Table:
- PK: itemId
- SK: timestamp#reviewer
- Fields: status, reason, contentAnalysis, rekognitionResults, actionTaken
```

### Feature Breakdown

**#3.1 Implement Content Moderation** (6 hours)
- Load closet item from DynamoDB
- Extract text content + images
- Apply rule engine:
  - **Text:** Profanity filter, character limits, spam detection
  - **Images:** AWS Rekognition (labels, moderation, explicit content)
  - **Metadata:** Tag whitelist, description length, brand safety
- Apply AI checks (if enabled):
  - Inappropriate poses
  - Brand violation detection
  - Spam pattern matching
- Update item status:
  - `pending_moderation` → `approved` or `rejected`
  - Store rejection reason
- Emit events:
  - `item.moderated` (with status + confidence)
  - `item.rejected` (with detailed reason)
- Send user notification with decision
- Log to MODERATION_AUDIT table
- Cache moderation rules (TTL 4 hours)

### Estimated Effort: **6 hours**

---

## Task 4: Layout Validation Engine (1 Feature)

### Overview
Ensures closet layouts are valid, accessible, and render correctly.

**Files to Create/Modify:**
- `lambda/layout/validate-layout.ts`
- `lib/services/layout-validator.service.ts`
- `lib/schemas/layout.schema.json`
- `lib/utils/accessibility.utils.ts`
- `appsync/schema/layout.graphql`

### Feature Breakdown

**#4.1 Layout Validation Engine** (4 hours)
- Load JSON Schema from S3 (cache TTL 1 hour)
- Validate structure:
  - Required fields: `anchors`, `bounds`, `version`
  - Type checking: coordinates must be numbers
  - Size constraints: width 0-1920, height 0-1440
  - Anchor validation: valid positions, no overlap
- Apply accessibility checks:
  - Minimum tap targets: 48x48px (WCAG AAA)
  - Color contrast: WCAG AA minimum (4.5:1 for text)
  - Tab order: sequential, no gaps
  - Keyboard navigation: all interactive elements accessible
- Return validation report:
  - `layoutValid: boolean`
  - `issues: [{field, rule, severity, message}]`
  - `warnings: [{...}]` (non-blocking)
  - `score: 0-100` (accessibility score)
- Cache schema and rules
- Support versioned schemas

### Estimated Effort: **4 hours**

---

## Task 5: Analytics & Metrics Dashboard (1 Feature)

### Overview
Admin dashboard providing business intelligence and operational metrics.

**Files to Create/Modify:**
- `lambda/analytics/admin-metrics.ts`
- `lib/services/analytics.service.ts`
- `lib/utils/cloudwatch.utils.ts`
- `appsync/resolvers/analytics.resolver.ts`
- `appsync/schema/analytics.graphql`

### Metrics to Track
```
User Engagement:
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Session duration (avg)
- Retention (day 1, 7, 30)

Content:
- Items created per day
- Items approved per day
- Approval rate (%)
- Avg time to approval

Monetization:
- Prime Coins distributed (daily)
- Creator earnings (daily)
- Tier distribution (Free vs Bestie vs Creator)
- ARPU (Average Revenue Per User)

Creator Health:
- Active creators (per tier)
- Collab success rate (%)
- Content velocity (items/creator/week)
- Earnings per creator (median, avg)
```

### Feature Breakdown

**#5.1 Analytics Dashboard** (5 hours)
- Query CloudWatch Logs for usage metrics
- Aggregate from DynamoDB:
  - User metrics: login events, engagement
  - Content metrics: creation, approval pipeline
  - Financial metrics: coin distribution, earnings
  - Creator metrics: tier distribution, activity
- Create time-series data model:
  - Daily snapshots for 90 days
  - Weekly aggregates for 1 year
  - Monthly for long-term trends
- Build GraphQL resolvers:
  - `getMetricsDashboard(timeRange, filters)`
  - `getUserEngagementMetrics(userId, timeRange)`
  - `getCreatorMetrics(creatorId, timeRange)`
  - `getFinancialMetrics(timeRange)`
- Support filters: date range, tier, creator, region
- Export to CSV functionality
- Cache results (TTL 1 hour for daily, 24 hours for monthly)

### Estimated Effort: **5 hours**

---

## Implementation Roadmap

### Phase 1: Foundation (Days 1-2)
- [ ] Create DynamoDB tables + GSIs
- [ ] Create TypeScript types + interfaces
- [ ] Create business logic service layers
- [ ] Create GraphQL schema definitions

### Phase 2: Core Implementation (Days 3-8)
- [ ] Implement Collaboration System (6 features)
- [ ] Implement Prime Bank Economy (4 features)
- [ ] Implement Content Moderation

### Phase 3: Validation & Analytics (Days 9-10)
- [ ] Implement Layout Validation
- [ ] Implement Analytics Dashboard

### Phase 4: Testing & QA (Days 10-11)
- [ ] Add unit tests for all new features
- [ ] Integration testing
- [ ] End-to-end testing with sample data

### Phase 5: Documentation & Deployment (Days 11-12)
- [ ] Create feature documentation
- [ ] Update architecture diagrams
- [ ] Deploy to staging
- [ ] Production readiness review

---

## Success Criteria

### Collaboration System
- ✅ Invites expire after 14 days
- ✅ Both parties must accept terms
- ✅ Shared S3 prefix provisioned on acceptance
- ✅ All notifications delivered
- ✅ Admin can review and approve/reject

### Prime Bank Economy
- ✅ Coins awarded with validation
- ✅ Daily/weekly caps enforced per tier
- ✅ Bank meter calculates correctly with tier weighting
- ✅ Collaborative earnings split correctly
- ✅ All transactions logged for audit

### Content Moderation
- ✅ Text + image analysis completes
- ✅ Items auto-approved/rejected based on rules
- ✅ User receives notification with reason
- ✅ Full audit trail maintained
- ✅ Admin can override decisions

### Layout Validation
- ✅ Invalid layouts rejected with issues list
- ✅ Accessibility score calculated
- ✅ Schema versioning supported
- ✅ No false negatives on valid layouts

### Analytics Dashboard
- ✅ DAU/MAU calculated correctly
- ✅ Financial metrics accurate
- ✅ Creator tier distribution correct
- ✅ Time-series data queryable
- ✅ CSV export working

---

## Known Dependencies & Risks

### External APIs
- AWS Rekognition (might have latency, cost)
- CloudWatch Logs (query costs)

### Database
- Need DynamoDB capacity planning
- May need GSI adjustments during load testing

### Notification System
- Assumes notification service exists
- Fallback to email if SMS fails

### Performance Considerations
- Moderation API calls might be slow (async job queue recommended)
- Analytics queries might timeout on large datasets (pagination needed)

---

## Product Requirements (CONFIRMED) ✅

### 1. Collaboration Terms
**Master Collaboration Agreement** (required - checkbox + scroll):
- **Content Ownership:** Prime/LaLa owns final edited assets; creator retains pre-existing IP + raw uploads
- **License Grant:** Worldwide, royalty-free for deliverables + promotion
- **Exclusivity:** Default none; negotiable per brand/tier
- **Duration:** 12 months promotional; perpetual archival for published episodes
- **Approvals:** Creator gets one review pass on watermarked preview; final cut by Prime Studios
- **Brand Safety:** No hate, minors, explicit content; creator compliance required
- **Attribution:** Prime credits creator in-app + captions (ties to Credits Studio)
- **Termination:** Prime can cancel for violations; refund per policy if Prime cancels without cause

**Project Addendum** (per collaboration):
- Deliverables list, custom earnings split, deadlines, exclusivity clause

### 2. Prime Bank Economy ✅
**Prime Coins (daily caps by tier):**
- Free: 10/day, 60/week | Bestie: 15/day, 90/week | Creator+: 25/day, 150/week
- **Creator Credits** with tier multipliers: Starter 1.0x, Plus 1.5x, Prime Pro 2.0x-3.0x
- Repeat offender rule: X strikes → manual review required
- No unlimited coins (prevents inflation/abuse); leverage multipliers instead

### 3. Moderation Confidence (AWS Rekognition) ✅
**Two-Threshold System:**
- **Auto-reject (95%):** Explicit sexual content, nudity, graphic violence
- **Human review (85%):** Suggestive, partial nudity, weapons, moderation flags
- **Auto-approve (<60%):** Low-risk items
- **Special rules:** Repeat offender tracking, shadow moderation for minors+sexual content (immediate block + escalation)

### 4. Notification Channels ✅
**Push + Email default** (with user preferences)
- Transactional/critical (security, billing, collab deadlines): Email + Push
- Engagement (missions, streaks, drops): Push default
- SMS: Optional for later (high-value wins, urgent deadlines)

### 5. Analytics Retention ✅
- Detailed event-level: 90 days
- Aggregated summaries: 1 year
- Archived: 5 years (longitudinal creator performance)

### 6. Collab Earnings Split ✅
- **Default:** 50/50 split
- **Custom support:** From day 1 (config fields: prime_pct, creator_pct, must total 100)

---

**Ready to proceed with Phase 1: Foundation Setup**
