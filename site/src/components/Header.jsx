import React, { useEffect, useState } from "react";
import { hostedUiLoginUrl, hostedUiLogoutUrl } from "@/lib/sa-login";

export default function Header() {
  const [session, setSession] = useState(() => {
    const id = localStorage.getItem("sa:idToken");
    return id ? { idToken: id } : null;
  });

  // Simple poll or hook to keep session in sync
  useEffect(() => {
    const t = setInterval(() => {
      const id = localStorage.getItem("sa:idToken");
      setSession(id ? { idToken: id } : null);
    }, 1500);
    return () => clearInterval(t);
  }, []);

  const signIn = () => {
    sessionStorage.setItem("sa:returnTo", location.pathname + location.search);
    window.location.href = hostedUiLoginUrl(window.sa.cfg);
  };

  const signOut = () => {
    // Clear local tokens before bouncing to HostedUI logout
    try {
      localStorage.removeItem("sa:idToken");
      localStorage.removeItem("sa:accessToken");
      localStorage.removeItem("sa:expiresAt");
    } catch {}
    window.location.href = hostedUiLogoutUrl(window.sa.cfg);
  };

  return (
    <nav className="topbar">
      {/* ... your nav tabs ... */}
      {session ? (
        <button className="btn btn-primary" onClick={signOut}>Sign out</button>
      ) : (
        <button className="btn" onClick={signIn}>Sign in</button>
      )}
    </nav>
  );
}
