# 🚀 QUICK START GUIDE - LALAVERSE DASHBOARD

## 5-Minute Setup

### 1. Install Dependencies
```bash
cd site
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Navigate to `http://localhost:5173`

### 3. View FAN Tier Pages
- Click through navigation in sidebar
- All 6 pages fully functional with mock data
- Dark mode toggle in system settings

---

## 📁 File Structure (Key Files)

```
site/
├── src/
│   ├── components/         ← Reusable UI components (20+)
│   │   ├── Button.tsx      (5 variants)
│   │   ├── Card.tsx        (base + stats)
│   │   ├── Badge.tsx       (5 variants + tags)
│   │   ├── Layout.tsx      (Sidebar, TopNav, MainLayout)
│   │   ├── Charts.tsx      (Recharts wrappers)
│   │   ├── DataDisplay.tsx (Leaderboard, Table, etc)
│   │   └── index.ts        (exports)
│   │
│   ├── pages/              ← Complete FAN tier (6 pages)
│   │   ├── FanHome.tsx
│   │   ├── FanEpisodes.tsx
│   │   ├── FanStyling.tsx
│   │   ├── FanCloset.tsx
│   │   ├── FanBlog.tsx
│   │   └── FanMagazine.tsx
│   │
│   ├── utils/
│   │   └── mockData.ts     ← All mock data generators
│   │
│   ├── App.tsx             ← Main app router
│   ├── main.tsx            ← Entry point
│   └── index.css           ← Tailwind + styles
│
├── tailwind.config.js      ← Design system config
├── vite.config.ts          ← Build config
└── package.json            ← Dependencies
```

---

## 🎨 Key Components

### Button
```tsx
<Button variant="primary" size="md">Click me</Button>
// Variants: primary | secondary | ghost | danger | success
// Sizes: sm | md | lg
```

### Card
```tsx
<Card hoverable>
  <div>Content here</div>
</Card>
```

### StatCard
```tsx
<StatCard 
  label="Level"
  value={25}
  icon="⭐"
  trend={{ value: 2, isPositive: true }}
  color="purple"
/>
```

### MainLayout
```tsx
<MainLayout
  tier="fan"
  username="Sarah"
  currentPage="home"
  onNavigate={(page) => setPage(page)}
  onLogout={() => handleLogout()}
>
  {/* Page content here */}
</MainLayout>
```

### Charts
```tsx
<ChartContainer title="My Chart">
  <SimpleBarChart data={data} color="#8B5CF6" />
</ChartContainer>
```

---

## 🗂️ Adding a New Page

### Step 1: Create File
```tsx
// site/src/pages/FanNewPage.tsx
import React, { useState } from 'react';
import { MainLayout } from '../components/Layout';

export function FanNewPage() {
  const [currentPage, setCurrentPage] = useState('newpage');
  const [user] = useState({
    id: 'user_123',
    name: 'Sarah',
    tier: 'fan' as const,
  });

  return (
    <MainLayout
      tier={user.tier}
      username={user.name}
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onLogout={() => console.log('Logout')}
    >
      {/* Your page content */}
    </MainLayout>
  );
}

export default FanNewPage;
```

### Step 2: Add to Navigation
```tsx
// site/src/components/Layout.tsx
const tierNavigation: Record<UserTier, Array<{ ... }>> = {
  fan: [
    // ... existing items
    { id: 'newpage', label: 'New Page', icon: '✨' },
  ],
};
```

### Step 3: Add Route to App
```tsx
// site/src/App.tsx
import FanNewPage from './pages/FanNewPage';

function App() {
  const renderPage = () => {
    switch (currentPage) {
      case 'newpage':
        return <FanNewPage />;
      // ... other cases
    }
  };
}
```

---

## 🎨 Customizing Colors

### Brand Colors
Edit `site/tailwind.config.js`:
```js
colors: {
  purple: {
    600: '#8B5CF6', // Change primary
  },
  pink: {
    600: '#EC4899', // Change secondary
  },
}
```

### Tier Colors
```js
fan: '#4F46E5',
bestie: '#06B6D4',
creator: '#10B981',
collaborator: '#F59E0B',
admin: '#EF4444',
'prime-studios': '#8B5CF6',
```

---

## 📊 Using Mock Data

### Get Challenge Data
```tsx
import { getMockChallenges } from '../utils/mockData';

const challenges = getMockChallenges();
// Returns: Challenge[]
```

### Generate User Stats
```tsx
import { generateMockGameStats } from '../utils/mockData';

const stats = generateMockGameStats('user_123');
// Returns: GameStats with level, xp, coins, etc.
```

### Get Leaderboard
```tsx
import { getMockLeaderboard } from '../utils/mockData';

const leaderboard = getMockLeaderboard();
// Returns: 100 leaderboard entries
```

---

## 🚀 Building for Production

### Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deploy
Built files in `site/dist/` ready for deployment:
- **Netlify**: Drag & drop `dist/` folder
- **Vercel**: Connect repo, auto-deploys
- **AWS S3 + CloudFront**: Upload `dist/` to S3
- **Docker**: Add Dockerfile with `npm run build`

---

## 🎯 Common Tasks

### Change a Component's Color
```tsx
// In any component
<Button className="bg-pink-600 hover:bg-pink-700">
  Custom Color
</Button>
```

### Add Hover Effect
```tsx
<Card hoverable onClick={() => navigate('/page')}>
  Click me to navigate
</Card>
```

### Create a New Stat Card
```tsx
<StatCard
  label="My Metric"
  value={12345}
  icon="📊"
  trend={{ value: 25, isPositive: true }}
  color="purple"
/>
```

### Add a Form
```tsx
<input
  type="email"
  placeholder="Enter email"
  className="px-4 py-2 rounded-lg border"
/>
<Button variant="primary">Subscribe</Button>
```

---

## 🌙 Dark Mode

Automatically works! All components have dark mode support via Tailwind's `dark:` prefix.

No additional setup needed - system automatically detects preference.

---

## 📱 Responsive Design

All components mobile-first responsive:
- Mobile: 320px
- Tablet: 768px (use `md:` prefix)
- Desktop: 1024px (use `lg:` prefix)
- Large: 1280px (use `xl:` prefix)

---

## 🧪 Testing a Page

1. Start dev server: `npm run dev`
2. Navigate to page via sidebar
3. Check browser console (F12) for errors
4. Test on mobile via device or DevTools responsive mode

---

## 📚 Resources

- **React Docs**: https://react.dev
- **Tailwind Docs**: https://tailwindcss.com/docs
- **Recharts Docs**: https://recharts.org/
- **TypeScript Docs**: https://www.typescriptlang.org/docs/

---

## 💡 Pro Tips

1. **Use Component Library** - Don't create new components, reuse existing ones
2. **Check mockData.ts** - Tons of realistic data available
3. **Copy & Modify** - Duplicate pages and edit content
4. **Mobile First** - Design for mobile, then scale up
5. **Dark Mode Works** - Add `dark:` prefix for dark theme
6. **TypeScript Helps** - Hover on types to see available options
7. **Tailwind Utilities** - Combine classes instead of custom CSS

---

## 🚨 Troubleshooting

### Port Already in Use
```bash
npm run dev -- --port 3000
```

### Component Not Found
Check `src/components/index.ts` - make sure it's exported

### Style Not Applying
- Check spelling in `tailwind.config.js`
- Ensure `tailwindcss` in `package.json`
- Try adding `!` prefix: `!bg-purple-600`

### Dark Mode Not Working
- System preference should auto-detect
- Check `tailwind.config.js` has `darkMode: 'class'`

---

## 🎓 Next Steps

1. **Explore FAN Pages** - Understand structure
2. **Copy FanHome.tsx** - Template for BESTIE pages
3. **Extend mockData.ts** - Add BESTIE-specific data
4. **Create BESTIE Pages** - Start with 2-3 pages
5. **Build Component Library** - Add new components as needed

---

## ✅ Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Dev server running (`npm run dev`)
- [ ] Can navigate all 6 FAN pages
- [ ] Dark mode toggles correctly
- [ ] Mobile view works
- [ ] No console errors
- [ ] Components display correctly
- [ ] Mock data loads
- [ ] Ready to build BESTIE tier!

---

## 🎉 You're Ready!

All tools are in place. Architecture is proven. Now build! 🚀

```
FAN: ✅ Complete
BESTIE: Ready to build
CREATOR: Ready to build
ADMIN: Ready to build
STUDIOS: Ready to build
```

**Let's make LALAVERSE amazing!** ✨
