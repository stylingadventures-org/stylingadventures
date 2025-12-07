// site/src/main.jsx
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
// 🔹 Fan Bestie upsell page (lives at /fan/Bestiegateway)
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
// Creator section
import CreatorLayout from "./routes/creator/Layout.jsx";
import CreatorDashboard from "./routes/creator/Dashboard.jsx";
import CreatorTools from "./routes/creator/Tools.jsx";
import CreatorLibrary from "./routes/creator/Library.jsx";
import CreatorStories from "./routes/creator/Stories.jsx";
import CreatorEarnings from "./routes/creator/Earnings.jsx";

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
          { index: true, element: <CreatorDashboard /> },
          { path: "tools", element: <CreatorTools /> },
          { path: "library", element: <CreatorLibrary /> },
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
