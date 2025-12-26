# 🎨 FRONTEND PAGE TEMPLATES & PATTERNS

## Established Page Structure Template

All pages follow this pattern (use as basis for remaining 25 pages):

```tsx
/**
 * [TIER] Tier - [PAGE NAME]
 * Features: [List 3-5 key features]
 */

import React, { useState } from 'react';
import { Card, StatCard } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { MainLayout } from '../../components/Layout';
import { ChartContainer, [ChartType] } from '../../components/Charts';
import { [DataDisplayComponent] } from '../../components/DataDisplay';

export function [PageName]() {
  const [currentPage, setCurrentPage] = useState('[pagename]');
  const [currentUser] = useState({
    id: 'user_123',
    name: 'Sarah',
    tier: '[tier]' as const,
  });

  // Page-specific state
  const [selected, setSelected] = useState('[default]');

  // Page statistics
  const pageStats = {
    statName: value,
    // ... more stats
  };

  return (
    <MainLayout
      tier={currentUser.tier}
      username={currentUser.name}
      currentPage={currentPage}
      onNavigate={setCurrentPage}
    >
      <div className="space-y-8 pb-8">
        {/* Header Section */}
        {/* Stats Section with StatCard components */}
        {/* Main Content Sections */}
        {/* Data Visualization with Charts */}
        {/* Call-to-Action Buttons */}
      </div>
    </MainLayout>
  );
}

export default [PageName];
```

## BESTIE Tier Pages (✅ Complete - Use as Reference)

### Features Per Page
- **BestieHome**: 5 stat cards, 4 recommendation cards, 2 charts, leaderboard
- **BestieCloset**: 4 stat cards, 7 category buttons, 1 pie chart, item table, 3 outfit cards
- **BestieStudio**: 4 stat cards, 4 tool cards, skill progress bars, feedback cards, challenge card
- **SceneClub**: 4 stat cards, 3 event cards, 6 channel cards, 3 member cards, perks grid
- **TrendStudio**: 4 stat cards, 3 trend tabs, 3 trend cards, 2 charts, prediction table, leaderboard
- **BestieStories**: 4 stat cards, 3 story items, story detail view, reactions, replies, 6 templates
- **BestieInbox**: 4 conversations, chat window, message thread, suggested creators
- **PrimeBank**: 4 stat cards, coin progress bar, 6 redemption cards, activities table, tiers grid
- **BestieProfile**: Profile header, 6 stat cards, 4 tabs, achievements, followers, settings
- **AchievementCenter**: 4 stat cards, 6 categories, 9 achievements, 5 milestones, leaderboard

---

## Remaining Pages to Build (25 Total)

### CREATOR Tier (9 Pages)

**1. CreatorHome** - Creator dashboard
- Stats: Projects created, followers, revenue, opportunities
- Content: Revenue chart, opportunity cards, trending projects
- Features: Analytics overview, pitch editor

**2. CreatorStudio** - Content production tools
- Stats: Videos produced, courses created, students, earnings
- Content: Video editor, course builder, asset library
- Features: Templates, collaboration tools

**3. CreatorShop** - Merchandise & products
- Stats: Products listed, sales, revenue per product
- Content: Product grid, sales chart, analytics per product
- Features: Inventory, pricing, shipping

**4. CreatorAnalytics** - Detailed performance metrics
- Stats: Views, engagement rate, growth, conversions
- Content: Multiple charts (views/likes/follows/comments over time)
- Features: Audience demographics, referral tracking

**5. CreatorNetwork** - Connect with other creators
- Stats: Connections, messages, collaboration requests
- Content: Creator profiles, collaboration opportunities
- Features: Direct messaging, project collaboration

**6. CreatorEarnings** - Revenue & financial dashboard
- Stats: Total earned, this month, pending payout
- Content: Earnings chart, payout schedule, tax docs
- Features: Withdraw funds, invoice generation

**7. CreatorCourses** - Sell courses & lessons
- Stats: Courses published, students enrolled, revenue
- Content: Course cards, enrollment chart, student reviews
- Features: Course builder, certificate generation

**8. CreatorSupport** - Help & community resources
- Stats: Tickets opened, response time, satisfaction
- Content: FAQ, knowledge base, support tickets
- Features: Live chat, community forum

**9. CreatorSettings** - Creator account & profile
- Stats: Profile views, content views
- Content: Profile editor, payouts setup, integrations
- Features: API keys, webhook management

### COLLABORATOR Tier (4 Pages)

**1. CollaboratorHub** - Project collaboration dashboard
- Stats: Active projects, team members, tasks completed
- Content: Project cards, timeline view, team activity
- Features: Project management, task tracking

**2. CollaboratorContent** - Shared content management
- Stats: Assets shared, team size, usage rights
- Content: Asset library, version control, comments
- Features: File upload, permission management

**3. CollaboratorPayments** - Revenue sharing
- Stats: Revenue earned, pending payments, contributors
- Content: Payment table, split breakdown, history
- Features: Custom split setup, automatic payouts

**4. CollaboratorCommunication** - Team messaging
- Stats: Active chats, team members, unread messages
- Content: Message threads, file sharing
- Features: Video calls, screen sharing, notifications

### ADMIN Tier (6 Pages)

**1. AdminDashboard** - System overview
- Stats: Total users, active sessions, platform health
- Content: System status, user chart, activity feed
- Features: Server monitoring, error tracking

**2. AdminUsers** - User management
- Stats: Total users, active today, new this month
- Content: User table, status filters, user details modal
- Features: Disable accounts, send messages, view history

**3. AdminContent** - Content moderation
- Stats: Posts flagged, approved, rejected
- Content: Content queue, moderation tools
- Features: Approve/reject, add warnings, ban users

**4. AdminAnalytics** - Platform analytics
- Stats: DAU, MAU, retention, revenue
- Content: Multiple performance charts
- Features: Export data, custom date ranges

**5. AdminPayments** - Financial management
- Stats: Total revenue, pending payouts, disputes
- Content: Payment ledger, dispute resolution
- Features: Manual payouts, refunds, tax setup

**6. AdminSettings** - Platform configuration
- Stats: Configuration status, updates pending
- Content: Feature flags, API keys, email templates
- Features: System settings, integrations, webhooks

### PRIME STUDIOS Tier (6 Pages)

**1. StudiosHome** - Enterprise dashboard
- Stats: Studio members, content produced, revenue, impact
- Content: Studio overview, performance metrics
- Features: Team management, resource allocation

**2. StudiosManagement** - Studio administration
- Stats: Team size, projects, workflows
- Content: Staff directory, project list, workflows
- Features: Onboarding, role management, training

**3. StudiosContent** - Enterprise content library
- Stats: Assets created, reused, in library
- Content: Asset management, usage tracking
- Features: Digital asset management, versioning

**4. StudiosAnalytics** - Advanced analytics suite
- Stats: Multiple metrics, custom dashboards
- Content: Comprehensive analytics, predictive charts
- Features: Custom reports, data export, ML insights

**5. StudiosIntegrations** - Third-party connections
- Stats: Integrations active, API calls, data synced
- Content: Integration list, config page, logs
- Features: Webhook setup, API management, SLA monitoring

**6. StudiosSupport** - Enterprise support & SLA
- Stats: Support tickets, response time, SLA met
- Content: Ticket management, documentation
- Features: Priority support, account manager, consulting

---

## Component Distribution Pattern

### Common Components Used (All Pages)
- `MainLayout` - Sidebar + TopNav wrapper
- `Button` - Primary, secondary, ghost, danger variants
- `Card` - Content containers
- `Badge` - Status indicators

### Per-Page Components

**Stat Cards**: All pages (1-4 statcard per page)
- `StatCard` with icon + trend

**Data Display**: Most pages (select which fits)
- `Table` - Lists of items
- `Leaderboard` - Ranked entries  
- `ContentCard` - Media items
- `AchievementGrid` - Grid layouts

**Charts**: 60% of pages (select type)
- `SimpleBarChart` - Categorical data
- `SimpleLineChart` - Trends over time
- `SimplePieChart` - Distribution/percentages

**Specialized**:
- Tabs/buttons for filtering
- Input fields for editing
- Toggle switches for settings
- Progress bars for status

---

## Data Structure Pattern

Every page uses this data pattern:

```tsx
// 1. Page stats (top metrics)
const pageStats = { stat1: value, stat2: value };

// 2. Main content items (cards/list items)
const items = [
  { id, name, emoji, description, progress },
  // ... more items
];

// 3. Chart data (if needed)
const chartData = [
  { name: 'Jan', value: 100 },
  // ... more data points
];

// 4. Table rows (if needed)
const tableData = [
  { id, field1, field2, status },
  // ... more rows
];
```

---

## Responsive Breakpoints Used

```
Tailwind Breakpoints in Use:
- sm: 640px   (Tablets)
- md: 768px   (Tablets/Small laptops)
- lg: 1024px  (Desktops)
- xl: 1280px  (Large desktops)
- 2xl: 1536px (Ultra-wide)

Grid Patterns Used:
- Single column: 320px-640px
- Two columns: 640px-1024px
- Three columns: 1024px+
- Four columns: 1280px+
```

---

## Color Scheme Constants

```tsx
// Tier Colors
'Fan': 'cyan-500',
'Bestie': 'cyan-500',      // Uses cyan-500 (#06B6D4)
'Creator': 'purple-500',    // Uses purple-500 (#A855F7)
'Collaborator': 'blue-500', // Uses blue-500 (#3B82F6)
'Admin': 'red-500',         // Uses red-500 (#EF4444)
'Prime Studios': 'amber-500' // Uses amber-500 (#F59E0B)

// Component Colors
Primary: 'bg-cyan-600'
Secondary: 'bg-gray-700'
Success: 'bg-green-600'
Warning: 'bg-amber-600'
Danger: 'bg-red-600'
Ghost: 'bg-transparent'

// Backgrounds
Dark: 'bg-gray-800/50'
Darker: 'bg-gray-900'
Overlay: 'bg-gray-800/70'
```

---

## Quick Build Checklist (For Next 25 Pages)

- [ ] Create new page file in appropriate tier folder
- [ ] Import needed components (always: MainLayout, Button, Card, Badge)
- [ ] Create page stats object
- [ ] Create main content items/data
- [ ] Build JSX with MainLayout wrapper
- [ ] Add 1-4 StatCard components
- [ ] Add main content section with cards/table
- [ ] Add 1-2 charts if needed
- [ ] Add Call-to-action buttons
- [ ] Update App.tsx with import + route
- [ ] Test in dev server (npm run dev)
- [ ] Verify responsive on mobile/tablet/desktop

---

## Estimated Build Times

Using BESTIE pages as benchmark:
- Simple page (like Profile): 15-20 min
- Medium page (like Closet): 25-30 min
- Complex page (like Studio): 30-40 min

**Total Remaining**:
- CREATOR (9): ~4.5 hours
- COLLABORATOR (4): ~1.5 hours
- ADMIN (6): ~2.5 hours
- PRIME STUDIOS (6): ~2.5 hours
- **Total: ~11 hours** (can be done in 1-2 sessions)

---

## Success Criteria

✅ All pages:
- Use consistent layout (MainLayout wrapper)
- Responsive on all devices
- Follow component patterns
- Have proper TypeScript types
- Use Tailwind CSS only
- Include meaningful mock data
- Have footer spacing (pb-8)
- Pass dev server compilation

---

**You now have the pattern and template for building the remaining 25 pages quickly!**

Use the BESTIE pages as exact reference for structure and styling.
