// site/src/main.jsx
import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { dailyLoginOnce } from "./lib/sa";

// Shell + top-level pages
import Layout from "./ui/Layout.jsx";
import MarketingHome from "./routes/Home.jsx";          // <- top-level home
import Watch from "./routes/episodes/Watch.jsx";

// Fan subpages (mounted under /fan)
import Episodes from "./routes/episodes/Episodes.jsx";
import Closet from "./routes/fan/Closet.jsx";
import Community from "./routes/fan/Community.jsx";
import Profile from "./routes/Profile.jsx";
import ClosetFeed from "./routes/fan/ClosetFeed.jsx";

// Fan section layout + home/dashboard
import FanLayout from "./routes/fan/FanLayout.jsx";
// if you renamed FanDashboard.jsx to Home.jsx:
import FanHome from "./routes/fan/Home.jsx";
// if you kept FanDashboard.jsx instead, use:
// import FanHome from "./routes/fan/FanDashboard.jsx";

// Bestie section
import BestieLayout from "./routes/bestie/Layout.jsx";
import BestieOverview from "./routes/bestie/Home.jsx";
import BestiePerks from "./routes/bestie/Perks.jsx";
import BestieContent from "./routes/bestie/Content.jsx";
import BestieCloset from "./routes/bestie/Closet.jsx";

// Admin section
import AdminLayout from "./routes/admin/AdminLayout.jsx";
import AdminHome from "./routes/admin/AdminHome.jsx";
import BestieTools from "./routes/admin/BestieTools.jsx";
import ClosetUpload from "./routes/admin/ClosetUpload.jsx";
import Users from "./routes/admin/Users.jsx";
// 🔹 NEW: admin closet library
import ClosetLibrary from "./routes/admin/ClosetLibrary.jsx";

import LandingRedirect from "./routes/util/LandingRedirect.jsx";

// 🔹 REAL auth callback handler
import Callback from "./routes/auth/Callback.jsx";

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
      // /  → marketing home
      { index: true, element: <MarketingHome /> },

      // FAN section with left sidebar
      {
        path: "fan",
        element: <FanLayout />,
        children: [
          { index: true, element: <FanHome /> },            // /fan
          { path: "episodes", element: <Episodes /> },      // /fan/episodes
          { path: "closet", element: <Closet /> },          // /fan/closet
          { path: "closet-feed", element: <ClosetFeed /> }, // /fan/closet-feed
          { path: "community", element: <Community /> },    // /fan/community
          { path: "profile", element: <Profile /> },        // /fan/profile
          { path: "watch/:id", element: <Watch /> },        // /fan/watch/:id
        ],
      },

      // BESTIE section with left rail + tiers
      {
        path: "bestie",
        element: <BestieLayout />,
        children: [
          { index: true, element: <BestieOverview /> }, // /bestie
          { path: "perks", element: <BestiePerks /> },  // /bestie/perks
          { path: "content", element: <BestieContent /> }, // /bestie/content
          { path: "closet", element: <BestieCloset /> },   // /bestie/closet
        ],
      },

      // ADMIN section
      {
        path: "admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminHome /> },  // /admin
          { path: "bestie", element: <BestieTools /> },
          { path: "closet-upload", element: <ClosetUpload /> },
          // 🔹 NEW subpage
          { path: "closet-library", element: <ClosetLibrary /> },
          { path: "users", element: <Users /> },
        ],
      },
    ],
  },

  // Cognito callback route (no Layout chrome)
  { path: "/callback", element: <Callback /> },
]);

function AppBoot() {
  useEffect(() => {
    (async () => {
      // Best-effort once/day XP ping
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

// Tiny linter pacifier
export {};
