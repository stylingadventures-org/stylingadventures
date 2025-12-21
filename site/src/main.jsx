// main.js
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
import FanCharacters from "./routes/fan/Characters.jsx";
import FanPrimeTea from "./routes/fan/PrimeTea.jsx";
import FanJoinBesties from "./routes/fan/JoinBesties.jsx";
import FanShop from "./routes/fan/Shop.jsx";

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
import BestieStylingStudio from "./routes/bestie/StylingStudio.jsx";
import VoteAndPlay from "./routes/bestie/VoteAndPlay.jsx";
import BestieNews from "./routes/bestie/BestieNews.jsx";
import PrimeTeaFull from "./routes/bestie/PrimeTeaFull.jsx";
import RewardsAndBadges from "./routes/bestie/RewardsAndBadges.jsx";
import ClosetUploadImproved from "./routes/bestie/ClosetUploadImproved.jsx";
import MyClosetInventory from "./routes/bestie/MyClosetInventory.jsx";
import OutfitBuilder from "./routes/bestie/OutfitBuilder.jsx";
import StyleCalendar from "./routes/bestie/StyleCalendar.jsx";
import ShoppingCart from "./routes/bestie/ShoppingCart.jsx";
import StyleAnalytics from "./routes/bestie/StyleAnalytics.jsx";
import CapsuleWardrobe from "./routes/bestie/CapsuleWardrobe.jsx";
import BestieCommunity from "./routes/bestie/Community.jsx";

// 🔹 Creator section
import CreatorLayout from "./routes/creator/Layout.jsx";
import CreatorDashboard from "./routes/creator/Dashboard.jsx"; // Creator Home (overview)
import CreatorTools from "./routes/creator/Tools.jsx"; // legacy AI tools (optional)

// NEW Creator operating system pages
import BrandProfile from "./routes/creator/BrandProfile.jsx";
import ContentStrategy from "./routes/creator/ContentStrategy.jsx";
import AIContentStudio from "./routes/creator/AIContentStudio.jsx";
import FunnelAutomation from "./routes/creator/FunnelAutomation.jsx";
import Analytics from "./routes/creator/Analytics.jsx";
import Education from "./routes/creator/Education.jsx";
import GrowthTracker from "./routes/creator/GrowthTracker.jsx";
import CreatorCircle from "./routes/creator/CreatorCircle.jsx";
import CreatorSettings from "./routes/creator/CreatorSettings.jsx";
import Scheduling from "./routes/creator/Scheduling.jsx";
import CreatorUpgrade from "./routes/creator/CreatorUpgrade.jsx";
import ResourceLibrary from "./routes/creator/ResourceLibrary.jsx";
import Optimization from "./routes/creator/Optimization.jsx";

// Asset Library (existing)
import CreatorLibrary from "./routes/creator/Library.jsx"; // list of cabinets + search
import CreatorCabinetView from "./routes/creator/Library/CabinetView.jsx"; // single cabinet view

// Legacy story/earnings (kept for backwards compat)
import CreatorStories from "./routes/creator/Stories.jsx";
import CreatorEarnings from "./routes/creator/Earnings.jsx";
import CreatorMonetization from "./routes/creator/Monetization.jsx";

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
import AdminSettings from "./routes/admin/AdminSettings.jsx";
import BadgeRuleEditor from "./routes/admin/BadgeRuleEditor.jsx";
import AdminUserManagement from "./routes/admin/UserManagement.jsx";

// 🔹 New admin pages
import AdminEpisodeStudio from "./routes/admin/AdminEpisodeStudio.jsx";
import AdminGameRules from "./routes/admin/AdminGameRules.jsx";
import AdminGameOverview from "./routes/admin/AdminGameOverview.jsx";
import CreatorAssetsAdmin from "./routes/admin/CreatorAssetsAdmin.jsx";
import AdminModeration from "./routes/admin/Moderation.jsx";
import AdminEconomy from "./routes/admin/Economy.jsx";
import AdminAnalytics from "./routes/admin/Analytics.jsx";
import PrimeStudio from "./routes/admin/PrimeStudio.jsx";
import AIManagement from "./routes/admin/AIManagement.jsx";
import RolesPermissions from "./routes/admin/RolesPermissions.jsx";
import FeatureFlags from "./routes/admin/FeatureFlags.jsx";
import Support from "./routes/admin/Support.jsx";
import Automations from "./routes/admin/Automations.jsx";
import Integrations from "./routes/admin/Integrations.jsx";
import Security from "./routes/admin/Security.jsx";
import Roadmap from "./routes/admin/Roadmap.jsx";
import BrandSettings from "./routes/admin/BrandSettings.jsx";
import PromptLibrary from "./routes/admin/PromptLibrary.jsx";

// New optional creator pages
import CreatorMissions from "./routes/creator/Missions.jsx";

// Collaborator section
import CollabLayout from "./routes/collab/Layout.jsx";
import CollabHome from "./routes/collab/Home.jsx";
import CollabTools from "./routes/collab/Tools.jsx";
import CollabCampaigns from "./routes/collab/Campaigns.jsx";
import CollabAssets from "./routes/collab/Assets.jsx";
import CollabPerformance from "./routes/collab/Performance.jsx";

// Prime Studios section
import PrimeLayout from "./routes/prime/Layout.jsx";
import PrimeHome from "./routes/prime/Home.jsx";
import PrimeMagazine from "./routes/prime/Magazine.jsx";
import PrimeContent from "./routes/prime/Content.jsx";
import PrimeSpotlight from "./routes/prime/Spotlight.jsx";
import PrimeAbout from "./routes/prime/About.jsx";
import PrimeCreatorHub from "./routes/prime/CreatorHub.jsx";
import PrimeEpisodes from "./routes/prime/Episodes.jsx";
import PrimeSchedule from "./routes/prime/Schedule.jsx";
import PrimeProduction from "./routes/prime/Production.jsx";
import PrimeStoryContentStudio from "./routes/prime/StoryContentStudio.jsx";
import PrimeStoryProfile from "./routes/prime/StoryProfile.jsx";
import PrimeErasSeasons from "./routes/prime/ErasSeasons.jsx";
import PrimeShowsSeries from "./routes/prime/ShowsSeries.jsx";
import PrimePlannerCalendar from "./routes/prime/PlannerCalendar.jsx";

import LandingRedirect from "./routes/util/LandingRedirect.jsx";

// Auth signup pages (role-specific)
import SignupFan from "./routes/auth/SignupFan.jsx";
import SignupBestie from "./routes/auth/SignupBestie.jsx";
import SignupCreator from "./routes/auth/SignupCreator.jsx";
import SignupCollab from "./routes/auth/SignupCollab.jsx";
import SignupAdmin from "./routes/auth/SignupAdmin.jsx";

// Auth callback
import Callback from "./routes/auth/Callback.jsx";

// 🔐 Logout route
import Logout from "./routes/Logout.jsx";

// Route protection
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { SignupPage } from "./components/SignupPage.jsx";

// GraphQL + Auth providers
import { AuthProvider } from "./context/AuthContext.jsx";
import { GraphQLProvider } from "./context/GraphQLProvider.jsx";

// Global Login Modal
import { GlobalLoginModal } from "./components/GlobalLoginModal.jsx";

// Error Boundary
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";

// Test component for GraphQL + Cognito verification
import { TestGraphQLQuery } from "./components/TestGraphQLQuery.jsx";

import "./styles.css";

const router = createBrowserRouter([
  // Utility landing – sends people to fan/bestie/admin based on role
  { path: "/landing", element: <LandingRedirect /> },

  // 🧪 Test GraphQL + Cognito integration
  { path: "/test-graphql", element: <TestGraphQLQuery /> },
  // Role-specific signup pages (wrapped to redirect authenticated users)
  { path: "/signup/fan", element: <SignupPage><SignupFan /></SignupPage> },
  { path: "/signup/bestie", element: <SignupPage><SignupBestie /></SignupPage> },
  { path: "/signup/creator", element: <SignupPage><SignupCreator /></SignupPage> },
  { path: "/signup/collab", element: <SignupPage><SignupCollab /></SignupPage> },
  { path: "/signup/admin", element: <SignupPage><SignupAdmin /></SignupPage> },

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
          { path: "shop", element: <FanShop /> },
          { path: "bestie", element: <FanBestie /> },
          { path: "characters", element: <FanCharacters /> },
          { path: "tea", element: <FanPrimeTea /> },
          { path: "join", element: <FanJoinBesties /> },
          // 🔹 Fan-facing money rules page
          { path: "rules", element: <FanGameRules /> },
          // 🔹 Lala Bank
          { path: "bank", element: <Bank /> },
        ],
      },

      // ---------- BESTIE section ----------
      {
        path: "bestie",
        element: <ProtectedRoute requiredGroups={["BESTIE"]}><BestieLayout /></ProtectedRoute>,
        children: [
          { index: true, element: <BestieHome /> },
          { path: "closet-inventory", element: <MyClosetInventory /> },
          { path: "outfit-builder", element: <OutfitBuilder /> },
          { path: "style-calendar", element: <StyleCalendar /> },
          { path: "shopping-cart", element: <ShoppingCart /> },
          { path: "analytics", element: <StyleAnalytics /> },
          { path: "capsule", element: <CapsuleWardrobe /> },
          { path: "community", element: <BestieCommunity /> },
          { path: "content", element: <BestieContent /> },
          { path: "perks", element: <BestiePerks /> },
          { path: "styling-studio", element: <BestieStylingStudio /> },
          { path: "vote-and-play", element: <VoteAndPlay /> },
          { path: "news", element: <BestieNews /> },
          { path: "prime-tea", element: <PrimeTeaFull /> },
          { path: "rewards", element: <RewardsAndBadges /> },
          { path: "closet-upload", element: <ClosetUploadImproved /> },
        ],
      },

      // ---------- CREATOR section ----------
      {
        path: "creator",
        element: <ProtectedRoute requiredGroups={["CREATOR"]}><CreatorLayout /></ProtectedRoute>,
        children: [
          // Home
          { index: true, element: <CreatorDashboard /> },

          // NEW Creator operating system pages
          { path: "brand-profile", element: <BrandProfile /> },
          { path: "content-strategy", element: <ContentStrategy /> },
          { path: "ai-content-studio", element: <AIContentStudio /> },
          { path: "funnel-automation", element: <FunnelAutomation /> },
          { path: "analytics", element: <Analytics /> },
          { path: "education", element: <Education /> },
          { path: "growth-tracker", element: <GrowthTracker /> },
          { path: "creator-circle", element: <CreatorCircle /> },
          { path: "settings", element: <CreatorSettings /> },
          { path: "scheduling", element: <Scheduling /> },
          { path: "upgrade", element: <CreatorUpgrade /> },
          { path: "resources", element: <ResourceLibrary /> },
          { path: "optimization", element: <Optimization /> },

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
          { path: "monetization", element: <CreatorMonetization /> },
          
          // New optional mission system
          { path: "missions", element: <CreatorMissions /> },
        ],
      },

      // ---------- ADMIN section ----------
      {
        path: "admin",
        element: <ProtectedRoute requiredGroups={["ADMIN"]}><AdminLayout /></ProtectedRoute>,
        children: [
          { index: true, element: <AdminHome /> },
          { path: "bestie", element: <BestieTools /> },
          { path: "closet-upload", element: <ClosetUpload /> },
          { path: "closet-library", element: <ClosetLibrary /> },
          { path: "users", element: <AdminUserManagement /> },
          { path: "moderation", element: <AdminModeration /> },
          { path: "economy", element: <AdminEconomy /> },
          { path: "analytics", element: <AdminAnalytics /> },
          { path: "creator-assets", element: <CreatorAssetsAdmin /> },
          { path: "game-overview", element: <AdminGameOverview /> },
          { path: "episodes", element: <AdminEpisodeStudio /> },
          { path: "game-rules", element: <AdminGameRules /> },
          { path: "prime-studio", element: <PrimeStudio /> },
          { path: "settings", element: <AdminSettings /> },
          { path: "badges", element: <BadgeRuleEditor /> },
          // New admin ecosystem pages
          { path: "ai-management", element: <AIManagement /> },
          { path: "roles-permissions", element: <RolesPermissions /> },
          { path: "feature-flags", element: <FeatureFlags /> },
          { path: "support", element: <Support /> },
          { path: "automations", element: <Automations /> },
          { path: "integrations", element: <Integrations /> },
          { path: "security", element: <Security /> },
          { path: "roadmap", element: <Roadmap /> },
          { path: "brand-settings", element: <BrandSettings /> },
          { path: "prompt-library", element: <PromptLibrary /> },
        ],
      },

      // ---------- COLLABORATOR section ----------
      {
        path: "collab",
        element: <CollabLayout />,
        children: [
          { index: true, element: <CollabHome /> },
          { path: "tools", element: <CollabTools /> },
          { path: "campaigns", element: <CollabCampaigns /> },
          { path: "assets", element: <CollabAssets /> },
          { path: "performance", element: <CollabPerformance /> },
        ],
      },

      // ---------- PRIME STUDIOS section ----------
      {
        path: "prime",
        element: <ProtectedRoute requiredGroups={["PRIME"]}><PrimeLayout /></ProtectedRoute>,
        children: [
          { index: true, element: <PrimeHome /> },
          { path: "magazine", element: <PrimeMagazine /> },
          { path: "about", element: <PrimeAbout /> },
          { path: "creators", element: <PrimeCreatorHub /> },
          { path: "content", element: <PrimeContent /> },
          { path: "spotlight", element: <PrimeSpotlight /> },
          { path: "episodes", element: <PrimeEpisodes /> },
          { path: "production", element: <PrimeProduction /> },
          { path: "schedule", element: <PrimeSchedule /> },
          { path: "story-studio", element: <PrimeStoryContentStudio /> },
          { path: "story-profile", element: <PrimeStoryProfile /> },
          { path: "eras-seasons", element: <PrimeErasSeasons /> },
          { path: "shows-series", element: <PrimeShowsSeries /> },
          { path: "planner", element: <PrimePlannerCalendar /> },
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
        // Silently fail if not signed in - this is expected on first load
        // Only log if it's a real error (not "Not signed in")
        if (err?.message && !err.message.includes("Not signed in")) {
          console.error("[AppBoot] dailyLoginOnce error:", err);
        }
      }
    })();
  }, []);

  return <RouterProvider router={router} />;
}

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <AuthProvider>
      <GraphQLProvider>
        <GlobalLoginModal />
        <AppBoot />
      </GraphQLProvider>
    </AuthProvider>
  </ErrorBoundary>
);

export {};
