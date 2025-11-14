// site/src/main.jsx
import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { Auth, dailyLoginOnce } from "./lib/sa";

// Shell + top-level pages
import Layout from "./ui/Layout.jsx";
import Home from "./routes/Home.jsx";
import Watch from "./routes/Watch.jsx";

// Fan subpages (mounted under /fan)
import Episodes from "./routes/episodes/Episodes.jsx";
import Closet from "./routes/Closet.jsx";
import Community from "./routes/Community.jsx";
import Profile from "./routes/Profile.jsx";
import ClosetFeed from "./routes/fan/ClosetFeed.jsx";

// Fan section layout + dashboard
import FanLayout from "./routes/fan/FanLayout.jsx";
import FanDashboard from "./routes/fan/FanDashboard.jsx";

// Bestie section
import BestieLayout from "./routes/bestie/Layout.jsx";
// 👇 use Home.jsx as the “Overview” page
import BestieOverview from "./routes/bestie/Home.jsx";
import BestiePerks from "./routes/bestie/Perks.jsx";
import BestieContent from "./routes/bestie/Content.jsx";
import BestieCloset from "./routes/bestie/Closet.jsx";

// Admin section
import AdminLayout from "./routes/admin/AdminLayout.jsx";
import BestieTools from "./routes/admin/BestieTools.jsx";
import ClosetQueue from "./routes/admin/ClosetQueue.jsx";
import Users from "./routes/admin/Users.jsx";

import LandingRedirect from "./routes/util/LandingRedirect.jsx";

import "./styles.css";

function CallbackScreen() {
  return <div>Signing you in…</div>;
}

const router = createBrowserRouter([
  // utility landing (optional)
  { path: "/landing", element: <LandingRedirect /> },

  // top-level watch route (also mirrored under /fan/watch)
  { path: "/watch/:id", element: <Watch /> },

  // main app shell
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },

      // FAN section with its own tab bar
      {
        path: "fan",
        element: <FanLayout />,
        children: [
          { index: true, element: <FanDashboard /> }, // /fan
          { path: "episodes", element: <Episodes /> }, // /fan/episodes
          { path: "closet", element: <Closet /> }, // /fan/closet
          { path: "closet-feed", element: <ClosetFeed /> }, // /fan/closet-feed
          { path: "community", element: <Community /> }, // /fan/community
          { path: "profile", element: <Profile /> }, // /fan/profile
          { path: "watch/:id", element: <Watch /> }, // /fan/watch/:id
        ],
      },

      // BESTIE section with its own left-rail + TierTabs
      {
        path: "bestie",
        element: <BestieLayout />,
        children: [
          { index: true, element: <BestieOverview /> }, // /bestie
          { path: "perks", element: <BestiePerks /> }, // /bestie/perks
          { path: "content", element: <BestieContent /> }, // /bestie/content
          { path: "closet", element: <BestieCloset /> }, // /bestie/closet
        ],
      },

      // ADMIN section
      {
        path: "admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <BestieTools /> },
          { path: "bestie", element: <BestieTools /> },
          { path: "closet", element: <ClosetQueue /> },
          { path: "users", element: <Users /> },
        ],
      },
    ],
  },

  // Cognito callback route (standalone so we don't draw Layout chrome)
  { path: "/callback", element: <CallbackScreen /> },
]);

function AppBoot() {
  useEffect(() => {
    (async () => {
      // Handles Cognito /callback redirect (saves tokens & rewrites URL)
      await Auth.handleCallbackIfPresent();
      // Best-effort once/day XP ping
      await dailyLoginOnce();
    })();
  }, []);

  return <RouterProvider router={router} />;
}

createRoot(document.getElementById("root")).render(<AppBoot />);

// Tiny linter pacifier
export {};
