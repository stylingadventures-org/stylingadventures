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

// Bestie section (gated by BestieLayout)
import BestieLayout from "./routes/bestie/Layout.jsx";
import BestieHome from "./routes/bestie/Home.jsx";
import BestiePerks from "./routes/bestie/Perks.jsx";
import BestieContent from "./routes/bestie/Content.jsx";
// NOTE: file on disk is BestieCloset.jsx (capital B/C)
import BestieCloset from "./routes/bestie/BestieCloset.jsx";

// Admin section
import AdminLayout from "./routes/admin/AdminLayout.jsx";
import AdminHome from "./routes/admin/AdminHome.jsx";
import BestieTools from "./routes/admin/BestieTools.jsx";
import ClosetUpload from "./routes/admin/ClosetUpload.jsx";
import Users from "./routes/admin/Users.jsx";
import ClosetLibrary from "./routes/admin/ClosetLibrary.jsx";
import AdminBestieCloset from "./routes/admin/AdminBestieCloset.jsx";

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
      // /  → marketing home
      { index: true, element: <MarketingHome /> },

      // ---------- FAN section ----------
      {
        path: "fan",
        element: <FanLayout />,
        children: [
          { index: true, element: <FanHome /> }, // /fan
          { path: "episodes", element: <Episodes /> },
          { path: "closet", element: <Closet /> },
          { path: "closet-feed", element: <ClosetFeed /> },
          { path: "community", element: <Community /> },
          { path: "profile", element: <Profile /> },
          { path: "watch/:id", element: <Watch /> },

          // 🔹 Bestie upsell / explainer is here:
          // /fan/bestie – where non-Besties get sent from BestieLayout.
          { path: "bestie", element: <FanBestie /> },
        ],
      },

      // ---------- BESTIE section ----------
      // Gated by BestieLayout; redirects non-Besties to /fan/bestie.
      {
        path: "bestie",
        element: <BestieLayout />,
        children: [
          { index: true, element: <BestieHome /> }, // /bestie
          { path: "closet", element: <BestieCloset /> }, // /bestie/closet
          { path: "content", element: <BestieContent /> }, // /bestie/content
          { path: "perks", element: <BestiePerks /> }, // /bestie/perks
          // (optional) you can add /bestie/overview later if you want
        ],
      },

      // ---------- ADMIN section ----------
      {
        path: "admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminHome /> }, // /admin
          { path: "bestie", element: <BestieTools /> },
          { path: "closet-upload", element: <ClosetUpload /> },
          { path: "closet-library", element: <ClosetLibrary /> },

          // 🔹 Bestie closet admin subpage that matches the sidebar link
          // URL: /admin/closet-library/bestie
          { path: "closet-library/bestie", element: <AdminBestieCloset /> },

          { path: "users", element: <Users /> },
        ],
      },
    ],
  },

  // Cognito callback route (no Layout chrome)
  { path: "/callback", element: <Callback /> },

  // Hosted UI logout route – clears tokens + redirects to Cognito logout
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

// Tiny linter pacifier
export {};
