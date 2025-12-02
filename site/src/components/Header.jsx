// site/src/components/Header.jsx
import React, { useEffect, useState } from "react";
import { hostedUiLoginUrl, hostedUiLogoutUrl } from "@/lib/sa-login";
import CoinCounter from "./CoinCounter";

export default function Header() {
  const [session, setSession] = useState(() => {
    const id = localStorage.getItem("sa:idToken");
    return id ? { idToken: id } : null;
  });
  const [coins, setCoins] = useState(() => Number(localStorage.getItem("sa:coins") || 0));

  useEffect(() => {
    const t = setInterval(() => {
      const id = localStorage.getItem("sa:idToken");
      setSession(id ? { idToken: id } : null);
      setCoins(Number(localStorage.getItem("sa:coins") || 0));
    }, 1500);
    return () => clearInterval(t);
  }, []);

  const signIn = () => {
    sessionStorage.setItem("sa:returnTo", location.pathname + location.search);
    window.location.href = hostedUiLoginUrl(window.sa.cfg);
  };

  const signOut = () => {
    try {
      localStorage.removeItem("sa:idToken");
      localStorage.removeItem("sa:accessToken");
      localStorage.removeItem("sa:expiresAt");
      localStorage.removeItem("sa:coins");
    } catch {}
    window.location.href = hostedUiLogoutUrl(window.sa.cfg);
  };

  return (
    <nav className="topbar relative">
      {session ? (
        <button className="btn btn-primary" onClick={signOut}>Sign out</button>
      ) : (
        <button className="btn" onClick={signIn}>Sign in</button>
      )}
      {session && <CoinCounter coins={coins} />}
    </nav>
  );
}

