import React, { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import AuthStatus from "./AuthStatus";
import { getSA } from "../lib/sa";

export default function Layout() {
  const [role, setRole] = useState("FAN");

  useEffect(() => {
    (async () => {
      const sa = await getSA();
      setRole(sa?.getRole?.() || "FAN");
    })();
  }, []);

  return (
    <>
      <style>{`
        :root{
          --bg:#f7f7fb; --card:#ffffff; --ink:#0f172a; --muted:#6b7280;
          --ring:#e5e7eb; --brand:#111827; --brand-ink:#ffffff;
        }
        *{box-sizing:border-box}
        body{background:var(--bg); color:var(--ink);}
        .container{max-width:1100px; margin:0 auto; padding:0 20px;}
        header.site{position:sticky; top:0; z-index:50; backdrop-filter:saturate(180%) blur(6px);
          background:rgba(255,255,255,0.75); border-bottom:1px solid var(--ring);}
        .site-inner{display:flex; align-items:center; gap:16px; height:64px;}
        .brand{display:flex; align-items:center; gap:10px; font-weight:800; letter-spacing:.2px; font-size:22px; white-space:nowrap;}
        nav.nav{display:flex; gap:10px; margin-left:16px; overflow:auto; scrollbar-width:none;}
        nav.nav::-webkit-scrollbar{display:none}
        .pill{display:inline-flex; align-items:center; justify-content:center; height:36px; padding:0 14px; border-radius:999px;
          background:var(--card); border:1px solid var(--ring); color:var(--ink); text-decoration:none; font-weight:600; font-size:14px;
          transition:background .15s,border-color .15s,color .15s,transform .02s; will-change:transform;}
        .pill:hover{background:#fbfbfe; border-color:#dcdfe5;}
        .pill:active{transform:translateY(1px);}
        .pill.active{background:var(--brand); color:var(--brand-ink); border-color:var(--brand);}
        .spacer{flex:1 1 auto;}
        main.page{padding:28px 0 36px;}
        footer.site{border-top:1px solid var(--ring); background:#fff; color:var(--muted); font-size:13px;}
        .foot-inner{height:56px; display:flex; align-items:center; justify-content:space-between;}
        @media (max-width:720px){ .site-inner{gap:10px;} nav.nav{margin-left:4px;} .brand{font-size:20px;} .hide-sm{display:none;} }
      `}</style>

      <header className="site">
        <div className="container site-inner">
          <div className="brand">Styling Adventures</div>

          <nav className="nav" aria-label="Primary">
            <NavLink to="/" end className={({isActive}) => `pill ${isActive ? "active" : ""}`}>Home</NavLink>
            <NavLink to="/fan" className={({isActive}) => `pill ${isActive ? "active" : ""}`}>Fan</NavLink>
            {(role === "BESTIE" || role === "ADMIN") && (
              <NavLink to="/bestie" className={({isActive}) => `pill ${isActive ? "active" : ""}`}>Bestie</NavLink>
            )}
          </nav>

          <div className="spacer" />
          <AuthStatus />
        </div>
      </header>

      <main className="container page">
        <Outlet />
      </main>

      <footer className="site">
        <div className="container foot-inner">
          <div>© Styling Adventures</div>
          <div className="hide-sm">Made with ❤️ and good hair days.</div>
        </div>
      </footer>
    </>
  );
}


