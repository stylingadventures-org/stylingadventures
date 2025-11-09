import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { getSA } from "../lib/sa";
import AuthStatus from "./AuthStatus";

export default function Layout() {
  const signIn  = async () => (await getSA())?.startLogin();
  const signOut = async () => (await getSA())?.logoutEverywhere();

  return (
    <>
      <header>
        <h1>Styling Adventures</h1>
        <nav>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/episodes">Episodes</NavLink>
          <NavLink to="/closet">Closet</NavLink>
          <NavLink to="/community">Community</NavLink>
          <NavLink to="/profile">Profile</NavLink>
        </nav>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 12
          }}
        >
          {/* your existing Sign in / Sign out buttons can stay, or remove them */}
          <AuthStatus />    
        </div>
      </header>

      <main><Outlet /></main>
      <footer style={{ padding: 16 }}>© Styling Adventures</footer>
    </>
  );
}

