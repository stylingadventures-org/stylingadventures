import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Layout from "./ui/Layout.jsx";
import Home from "./routes/Home.jsx";

// Fan subpages (we'll mount them under /fan)
import Episodes from "./routes/Episodes.jsx";
import Closet from "./routes/Closet.jsx";
import Community from "./routes/Community.jsx";
import Profile from "./routes/Profile.jsx";

// Fan section layout + dashboard
import FanLayout from "./routes/fan/FanLayout.jsx";
import FanDashboard from "./routes/fan/FanDashboard.jsx";

// Bestie home
import BestieHome from "./routes/bestie/BestieHome.jsx";

import LandingRedirect from "./routes/util/LandingRedirect.jsx";
import "./styles.css";

const router = createBrowserRouter([
  { path: "/landing", element: <LandingRedirect /> },

  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },

      // FAN section with a secondary tab bar:
      {
        path: "fan",
        element: <FanLayout />,
        children: [
          { index: true, element: <FanDashboard /> }, // /fan
          { path: "episodes", element: <Episodes /> }, // /fan/episodes
          { path: "closet", element: <Closet /> },     // /fan/closet
          { path: "community", element: <Community /> }, // /fan/community
          { path: "profile", element: <Profile /> },   // /fan/profile
        ],
      },

      // Bestie is its own SPA section
      { path: "bestie", element: <BestieHome /> },
    ],
  },

  { path: "/callback", element: <div>Signing you in…</div> },
]);

createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
