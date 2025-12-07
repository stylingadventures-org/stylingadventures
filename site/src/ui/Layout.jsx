// site/src/ui/Layout.jsx
import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Auth, getRoleFlags, getSessionFromStorage } from "../lib/sa";

export default function Layout() {
  const { pathname } = useLocation();

  const { isAdmin, isCreator, isBestie } = getRoleFlags();
  const { email, idToken } = getSessionFromStorage();
  const isAuthed = !!idToken;

  // Bestie path: if you’re Bestie/Creator/Admin, go straight to /bestie.
  // Otherwise land on the fan upsell page.
  const bestiePath =
    pathname.startsWith("/bestie") || pathname.startsWith("/fan/bestie")
      ? pathname // keep current section when possible
      : isBestie
      ? "/bestie"
      : "/fan/bestie";

  const onSignIn = () => {
    // Remember destination (optional)
    sessionStorage.setItem("sa:returnTo", pathname || "/fan");
    Auth.login();
  };

  const onSignOut = () => {
    sessionStorage.removeItem("sa:returnTo");
    Auth.logout();
  };

  return (
    <>
      <style>{`
        :root {
          --bg: #f8f5ff;
          --card: #ffffff;
          --ink: #0f172a;
          --muted: #6b7280;
          --ring: #e5e7eb;
          --brand: #4f46e5;
          --accent-pink: #ec4899;
          --brand-ink: #ffffff;
        }

        * { box-sizing:border-box; }

        body {
          margin:0;
          min-height:100vh;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text",
            "Segoe UI", sans-serif;
          color:var(--ink);
          background:
            radial-gradient(circle at top left, rgba(236,72,153,0.16), transparent 55%),
            radial-gradient(circle at top right, rgba(79,70,229,0.18), transparent 60%),
            var(--bg);
        }

        .container {
          max-width:1100px;
          margin:0 auto;
          padding:0 20px;
        }

        header.site {
          position:sticky;
          top:0;
          z-index:50;
          backdrop-filter:saturate(180%) blur(10px);
          background:linear-gradient(
            180deg,
            rgba(255,255,255,0.92),
            rgba(248,250,252,0.9)
          );
          border-bottom:1px solid rgba(226,232,240,0.9);
          box-shadow:0 12px 30px rgba(15,23,42,0.06);
        }

        .site-inner {
          display:flex;
          align-items:center;
          gap:16px;
          height:64px;
        }

        .brand {
          display:flex;
          align-items:center;
          gap:10px;
          font-weight:800;
          letter-spacing:.02em;
          font-size:22px;
          white-space:nowrap;
          background:linear-gradient(90deg, #111827, #4b5563);
          -webkit-background-clip:text;
          color:transparent;
        }

        nav.nav {
          display:flex;
          gap:10px;
          margin-left:16px;
          overflow:auto;
          scrollbar-width:none;
        }
        nav.nav::-webkit-scrollbar { display:none; }

        .pill {
          display:inline-flex;
          align-items:center;
          justify-content:center;
          height:36px;
          padding:0 14px;
          border-radius:999px;
          background:var(--card);
          border:1px solid var(--ring);
          color:var(--ink);
          text-decoration:none;
          font-weight:600;
          font-size:14px;
          transition:
            background .15s ease,
            border-color .15s ease,
            color .15s ease,
            box-shadow .16s ease,
            transform .02s;
          will-change:transform;
          white-space:nowrap;
        }

        .pill:hover {
          background:#fbfbfe;
          border-color:#dcdfe5;
          box-shadow:0 8px 20px rgba(148,163,184,0.35);
        }

        .pill:active {
          transform:translateY(1px);
          box-shadow:none;
        }

        /* default active pill (Fan / Bestie / Admin) */
        .pill.active {
          background:linear-gradient(90deg, var(--brand), var(--accent-pink));
          color:var(--brand-ink);
          border-color:transparent;
          box-shadow:
            0 12px 30px rgba(79,70,229,0.55),
            0 0 24px rgba(236,72,153,0.55);
        }

        /* Creator pill – more neutral / studio look */
        .pill--creator.active {
          background:linear-gradient(135deg, #111827, #4b5563);
          color:#f9fafb;
          border-color:#111827;
          box-shadow:0 10px 26px rgba(15,23,42,0.55);
        }
        .pill--creator:hover {
          background:#111827;
          color:#f9fafb;
          border-color:#111827;
        }

        /* Admin pill – compact badge feel */
        .pill--admin {
          font-size:12px;
          letter-spacing:0.08em;
          text-transform:uppercase;
        }
        .pill--admin.active {
          background:#111827;
          color:#f9fafb;
          border-color:#111827;
          box-shadow:0 10px 26px rgba(15,23,42,0.55);
        }

        .spacer {
          flex:1 1 auto;
        }

        .user-controls {
          display:flex;
          align-items:center;
          gap:8px;
          font-size:0.8rem;
          color:var(--muted);
        }

        .user-email {
          max-width:200px;
          white-space:nowrap;
          text-overflow:ellipsis;
          overflow:hidden;
        }

        .user-controls button {
          border-radius:999px;
          border:1px solid var(--ring);
          background:#ffffff;
          padding:6px 12px;
          font-size:0.8rem;
          cursor:pointer;
        }

        .user-controls button:hover {
          border-color:#cbd5f5;
          box-shadow:0 6px 14px rgba(148,163,184,0.35);
        }

        main.page {
          padding:28px 0 36px;
        }

        footer.site {
          border-top:1px solid rgba(226,232,240,0.9);
          background:#ffffff;
          color:var(--muted);
          font-size:13px;
        }

        .foot-inner {
          height:56px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
        }

        @media (max-width:720px) {
          .site-inner { gap:10px; }
          nav.nav { margin-left:4px; }
          .brand { font-size:20px; }
          .hide-sm { display:none; }
          .user-email { max-width:120px; }
        }
      `}</style>

      <header className="site">
        <div className="container site-inner">
          <div className="brand">Styling Adventures</div>

          <nav className="nav" aria-label="Primary">
            <Link
              to="/"
              className={`pill ${pathname === "/" ? "active" : ""}`}
            >
              Home
            </Link>

            <Link
              to="/fan"
              className={`pill ${
                pathname.startsWith("/fan") && !pathname.startsWith("/fan/bestie")
                  ? "active"
                  : ""
              }`}
            >
              Fan
            </Link>

            {/* Bestie tab – visible to everyone, path depends on membership */}
            <Link
              to={bestiePath}
              className={`pill ${
                pathname.startsWith("/bestie") || pathname.startsWith("/fan/bestie")
                  ? "active"
                  : ""
              }`}
            >
              Bestie
            </Link>

            {/* Creator tab – only for Creators/Admins (via role flags) */}
            {isCreator && (
              <Link
                to="/creator"
                className={`pill pill--creator ${
                  pathname.startsWith("/creator") ? "active" : ""
                }`}
              >
                Creator
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className={`pill pill--admin ${
                  pathname.startsWith("/admin") ? "active" : ""
                }`}
              >
                ADMIN
              </Link>
            )}
          </nav>

          <div className="spacer" />

          <div className="user-controls">
            {isAuthed ? (
              <>
                {email && <span className="user-email">{email}</span>}
                <button type="button" onClick={onSignOut}>
                  Sign out
                </button>
              </>
            ) : (
              <button type="button" onClick={onSignIn}>
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container page">
        <Outlet />
      </main>

      <footer className="site">
        <div className="container foot-inner">
          <div>© Styling Adventures</div>
          <div className="hide-sm">Made with ❤️ and good style days.</div>
        </div>
      </footer>
    </>
  );
}

