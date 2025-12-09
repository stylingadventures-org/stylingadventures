import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { dailyLoginOnce } from "./lib/sa";

// Shell + top-level pages
import Layout from "./ui/Layout.jsx";
import MarketingHome from "./routes/Home.jsx"; // top-level marketing home
import Watch from "./routes/episodes/Watch.jsx";

// Fan subpages (mounted under /fan)
import Episodes from "./routes/episodes/Episodes.jsx";
import Closet from "./routes/fan/Closet.jsx";
import Community from "./routes/fan/Community.jsx";
import Profile from "./routes/Profile.jsx";
import ClosetFeed from "./routes/fan/ClosetFeed.jsx";

// Fan section layout + home/dashboard
import FanLayout from "./routes/fan/FanLayout.jsx";
import FanHome from "./routes/fan/Home.jsx";
// 🔹 Fan Bestie upsell page (lives at /fan/bestie)
import FanBestie from "./routes/fan/Bestiegateway.jsx";

// 🔹 Fan-facing game rules sheet
import FanGameRules from "./routes/fan/FanGameRules.jsx";
// 🔹 Fan bank page
import Bank from "./routes/fan/Bank.jsx";

// Bestie section (gated by BestieLayout)
import BestieLayout from "./routes/bestie/Layout.jsx";
import BestieHome from "./routes/bestie/Home.jsx";
import BestiePerks from "./routes/bestie/Perks.jsx";
import BestieContent from "./routes/bestie/Content.jsx";
import BestieCloset from "./routes/bestie/BestieCloset.jsx";

// 🔹 Creator section
import CreatorLayout from "./routes/creator/Layout.jsx";
import CreatorDashboard from "./routes/creator/Dashboard.jsx"; // Creator Home (overview)
import CreatorTools from "./routes/creator/Tools.jsx"; // legacy AI tools (optional)

// Asset Library (existing)
import CreatorLibrary from "./routes/creator/Library.jsx"; // list of cabinets + search
import CreatorCabinetView from "./routes/creator/Library/CabinetView.jsx"; // single cabinet view

// Legacy story/earnings (kept for backwards compat)
import CreatorStories from "./routes/creator/Stories.jsx";
import CreatorEarnings from "./routes/creator/Earnings.jsx";

// NEW Creator HQ sub-pages

// CREATE
import DirectorSuite from "./routes/creator/create/DirectorSuite.jsx";
import ScenePacks from "./routes/creator/create/ScenePacks.jsx";
import NicheDirectors from "./routes/creator/create/NicheDirectors.jsx";
import OnSetAssistant from "./routes/creator/create/OnSetAssistant.jsx";

// ALIGN
import GoalCompass from "./routes/creator/align/GoalCompass.jsx";

// IMPROVE
import BusinessContentFixer from "./routes/creator/improve/BusinessContentFixer.jsx";
import AestheticBrandStudio from "./routes/creator/improve/AestheticBrandStudio.jsx";

// GROW
import SocialPulse from "./routes/creator/grow/SocialPulse.jsx";
import SocialOS from "./routes/creator/grow/SocialOS.jsx";

// STORY & CONTENT STUDIO
import StoryProfile from "./routes/creator/story/StoryProfile.jsx";
import ErasSeasons from "./routes/creator/story/ErasSeasons.jsx";
import ShowsSeries from "./routes/creator/story/ShowsSeries.jsx";
import ContentPlannerCalendar from "./routes/creator/story/ContentPlannerCalendar.jsx";

// MONETIZATION HQ
import RevenueOverview from "./routes/creator/monetization/RevenueOverview.jsx";
import SocialMonetization from "./routes/creator/monetization/SocialMonetization.jsx";
import BrandDeals from "./routes/creator/monetization/BrandDeals.jsx";
import ProductSales from "./routes/creator/monetization/ProductSales.jsx";
import Affiliate from "./routes/creator/monetization/Affiliate.jsx";

// Admin section
import AdminLayout from "./routes/admin/AdminLayout.jsx";
import AdminHome from "./routes/admin/AdminHome.jsx";
import BestieTools from "./routes/admin/BestieTools.jsx";
import ClosetUpload from "./routes/admin/ClosetUpload.jsx";
import Users from "./routes/admin/Users.jsx";
import ClosetLibrary from "./routes/admin/ClosetLibrary.jsx";
// ⬇️ removed AdminBestieCloset import
import AdminSettings from "./routes/admin/AdminSettings.jsx";
import BadgeRuleEditor from "./routes/admin/BadgeRuleEditor.jsx";

// 🔹 New admin pages
import AdminEpisodeStudio from "./routes/admin/AdminEpisodeStudio.jsx";
import AdminGameRules from "./routes/admin/AdminGameRules.jsx";
import AdminGameOverview from "./routes/admin/AdminGameOverview.jsx";
import CreatorAssetsAdmin from "./routes/admin/CreatorAssetsAdmin.jsx";

import LandingRedirect from "./routes/util/LandingRedirect.jsx";

// Auth callback
import Callback from "./routes/auth/Callback.jsx";

// 🔐 Logout route
import Logout from "./routes/Logout.jsx";

import "./styles.css";

const router = createBrowserRouter([
  // Utility landing – sends people to fan/bestie/admin based on role
  { path: "/landing", element: <LandingRedirect /> },

  // Public watch route (also mirrored inside /fan)
  { path: "/watch/:id", element: <Watch /> },

  // Main app shell
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <MarketingHome /> },

      // ---------- FAN section ----------
      {
        path: "fan",
        element: <FanLayout />,
        children: [
          { index: true, element: <FanHome /> },
          { path: "episodes", element: <Episodes /> },
          { path: "closet", element: <Closet /> },
          { path: "closet-feed", element: <ClosetFeed /> },
          { path: "community", element: <Community /> },
          { path: "profile", element: <Profile /> },
          { path: "watch/:id", element: <Watch /> },
          { path: "bestie", element: <FanBestie /> },
          // 🔹 Fan-facing money rules page
          { path: "rules", element: <FanGameRules /> },
          // 🔹 Lala Bank
          { path: "bank", element: <Bank /> },
        ],
      },

      // ---------- BESTIE section ----------
      {
        path: "bestie",
        element: <BestieLayout />,
        children: [
          { index: true, element: <BestieHome /> },
          { path: "closet", element: <BestieCloset /> },
          { path: "content", element: <BestieContent /> },
          { path: "perks", element: <BestiePerks /> },
        ],
      },

      // ---------- CREATOR section ----------
      {
        path: "creator",
        element: <CreatorLayout />,
        children: [
          // Home
          { index: true, element: <CreatorDashboard /> },

          // Legacy AI tools (kept for now; not in new nav)
          { path: "tools", element: <CreatorTools /> },

          // CREATE – Director Suite
          { path: "create/director-suite", element: <DirectorSuite /> },
          { path: "create/scene-packs", element: <ScenePacks /> },
          { path: "create/niche-directors", element: <NicheDirectors /> },
          { path: "create/on-set-assistant", element: <OnSetAssistant /> },

          // ALIGN – Goal Compass
          { path: "align/goal-compass", element: <GoalCompass /> },

          // IMPROVE – Content & Aesthetic
          {
            path: "improve/business-content-fixer",
            element: <BusinessContentFixer />,
          },
          {
            path: "improve/aesthetic-brand-studio",
            element: <AestheticBrandStudio />,
          },

          // GROW – Social Pulse & OS
          { path: "grow/social-pulse", element: <SocialPulse /> },
          { path: "grow/social-os", element: <SocialOS /> },

          // STORY & CONTENT STUDIO
          { path: "story/profile", element: <StoryProfile /> },
          { path: "story/eras-seasons", element: <ErasSeasons /> },
          { path: "story/shows-series", element: <ShowsSeries /> },
          {
            path: "story/planner-calendar",
            element: <ContentPlannerCalendar />,
          },

          // MONETIZATION HQ
          {
            path: "monetization/overview",
            element: <RevenueOverview />,
          },
          {
            path: "monetization/social",
            element: <SocialMonetization />,
          },
          {
            path: "monetization/brand-deals",
            element: <BrandDeals />,
          },
          {
            path: "monetization/product-sales",
            element: <ProductSales />,
          },
          {
            path: "monetization/affiliate",
            element: <Affiliate />,
          },

          // Asset Library (cabinets)
          { path: "library", element: <CreatorLibrary /> },

          // Single cabinet view – canonical route
          {
            path: "library/cabinet/:cabinetId",
            element: <CreatorCabinetView />,
          },

          // Backwards-compat route for older links (/creator/library/:cabinetId)
          {
            path: "library/:cabinetId",
            element: <CreatorCabinetView />,
          },

          // Legacy Story & Earnings routes (backwards compat)
          { path: "stories", element: <CreatorStories /> },
          { path: "earnings", element: <CreatorEarnings /> },
        ],
      },

      // ---------- ADMIN section ----------
      {
        path: "admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminHome /> },
          { path: "bestie", element: <BestieTools /> },
          { path: "closet-upload", element: <ClosetUpload /> },
          { path: "closet-library", element: <ClosetLibrary /> },
          // ⬇️ removed /admin/closet-library/bestie route

          // Creator uploads moderation
          { path: "creator-assets", element: <CreatorAssetsAdmin /> },

          // 🔹 Game overview + Episode studio + game rules admin
          { path: "game-overview", element: <AdminGameOverview /> },
          { path: "episodes", element: <AdminEpisodeStudio /> },
          { path: "game-rules", element: <AdminGameRules /> },

          { path: "users", element: <Users /> },
          { path: "settings", element: <AdminSettings /> },
          { path: "badges", element: <BadgeRuleEditor /> }, // ✅ route for /admin/badges
        ],
      },
    ],
  },

  { path: "/callback", element: <Callback /> },
  { path: "/logout", element: <Logout /> },
]);

function AppBoot() {
  useEffect(() => {
    (async () => {
      try {
        await dailyLoginOnce();
      } catch (err) {
        console.error("[AppBoot] dailyLoginOnce error", err);
      }
    })();
  }, []);

  return <RouterProvider router={router} />;
}

createRoot(document.getElementById("root")).render(<AppBoot />);

export {};
