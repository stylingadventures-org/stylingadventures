import React, { useEffect, useMemo, useState, useCallback } from "react";
import { EPISODES, fmtCountdown } from "../../lib/episodes";

const GQL = {
  meBestie: /* GraphQL */ `
    query MeBestie { meBestieStatus { active until } }
  `,
  early: /* GraphQL */ `
    query Early($id: ID!) { isEpisodeEarlyAccess(id: $id) { allowed reason } }
  `,
};

// Plain helper if window.sa.graphql isn't ready for some reason
async function fallbackGraphql(query, variables) {
  const url = window.sa?.cfg?.appsyncUrl || window.__cfg?.appsyncUrl;
  const idToken =
    window.sa?.session?.idToken ||
    localStorage.getItem("sa:idToken") ||
    localStorage.getItem("sa_id_token") ||
    sessionStorage.getItem("id_token");
  if (!url || !idToken) throw new Error("Not signed in");
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: idToken },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors?.length) throw new Error(j.errors[0].message);
  return j.data;
}

export default function Episodes() {
  const [bestie, setBestie] = useState({ active: false, until: null });
  const [gate, setGate] = useState({}); // { [id]: { allowed, reason } }
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // tick every second to refresh countdown chips
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const runGql = useCallback(async (q, v) => {
    if (window.sa?.graphql) return window.sa.graphql(q, v);
    return fallbackGraphql(q, v);
  }, []);

  // Use your centralized catalog from lib
  const episodes = useMemo(() => EPISODES, []);

  const refetchMembershipAndGates = useCallback(async () => {
    setLoading(true);
    try {
      try {
        const d = await runGql(GQL.meBestie);
        if (d?.meBestieStatus) setBestie(d.meBestieStatus);
      } catch {
        /* ignore sign-in/network */
      }

      const results = {};
      await Promise.all(
        episodes.map(async (ep) => {
          if (!ep.hasEarly) {
            results[ep.id] = { allowed: false, reason: "no_early" };
            return;
          }
          try {
            const d = await runGql(GQL.early, { id: ep.id });
            results[ep.id] =
              d?.isEpisodeEarlyAccess ?? { allowed: false, reason: "unknown" };
          } catch {
            results[ep.id] = { allowed: false, reason: "not_signed_in" };
          }
        })
      );
      setGate(results);
    } finally {
      setLoading(false);
    }
  }, [episodes, runGql]);

  // initial load
  useEffect(() => {
    let gone = false;
    (async () => {
      try {
        setErr("");
        setLoading(true);

        try {
          const d = await runGql(GQL.meBestie);
          if (!gone && d?.meBestieStatus) setBestie(d.meBestieStatus);
        } catch { /* not signed in */ }

        const results = {};
        await Promise.all(
          episodes.map(async (ep) => {
            if (!ep.hasEarly) {
              results[ep.id] = { allowed: false, reason: "no_early" };
              return;
            }
            try {
              const d = await runGql(GQL.early, { id: ep.id });
              results[ep.id] =
                d?.isEpisodeEarlyAccess ?? { allowed: false, reason: "unknown" };
            } catch {
              results[ep.id] = { allowed: false, reason: "not_signed_in" };
            }
          })
        );
        if (!gone) setGate(results);
      } catch (e) {
        if (!gone) setErr(String(e.message || e));
      } finally {
        if (!gone) setLoading(false);
      }
    })();
    return () => { gone = true; };
  }, [episodes, runGql]);

  // Start checkout if available; otherwise grant the demo trial
  async function unlockBestie(returnTo = "/fan/episodes") {
    try {
      setErr("");
      // Not signed in? kick to Cognito
      const idTok =
        window.sa?.session?.idToken ||
        localStorage.getItem("sa:idToken") ||
        localStorage.getItem("sa_id_token") ||
        sessionStorage.getItem("id_token");
      if (!idTok) {
        if (window.SA?.startLogin) {
          window.SA.startLogin();
          return;
        }
        const cfg = window.__cfg || {};
        const scope = (cfg._scopes && cfg._scopes.join(" ")) || "openid email";
        const qp = new URLSearchParams({
          client_id: String(cfg.clientId || ""),
          response_type: "code",
          scope,
          redirect_uri: cfg.redirectUri || `${location.origin}/callback`,
        });
        location.assign(`${(cfg._hostBase || cfg.cognitoDomain)}/login?${qp.toString()}`);
        return;
      }

      // Try checkout (if STRIPE is configured on the backend)
      try {
        const res = await (window.sa?.graphql || fallbackGraphql)(
          /* GraphQL */ `
            mutation Start($successPath: String) {
              startBestieCheckout(successPath: $successPath) { url }
            }
          `,
          { successPath: returnTo }
        );
        const url = res?.startBestieCheckout?.url;
        if (url) {
          window.location.assign(url);
          return;
        }
      } catch { /* ignore */ }

      // Fallback: free trial for demo
      const trial = await (window.sa?.graphql || fallbackGraphql)(
        /* GraphQL */ `mutation { claimBestieTrial { active } }`
      );
      if (trial?.claimBestieTrial?.active) {
        await refetchMembershipAndGates();
      }
    } catch (e) {
      setErr(e?.message || String(e));
    }
  }

  const now = Date.now();

  return (
    <div className="ep-wrap">
      <header className="ep-hero">
        <div className="ep-hero__inner">
          <div className="ep-hero__titlebar">
            <h1 className="ep-hero__title">Episodes</h1>
            <span
              className={`pill ${bestie?.active ? "pill--bestie" : ""}`}
              title={bestie?.active ? `Bestie • until ${bestie.until || "—"}` : "Unlock Bestie for early access"}
            >
              {bestie?.active ? "Bestie" : "Fan"}
            </span>
          </div>
          <p className="ep-hero__subtitle">
            Besties get early drops. Public releases unlock on their dates.
          </p>
          {err && <div className="notice notice--error">{err}</div>}
        </div>
      </header>

      <main className="ep-grid">
        {(loading ? Array.from({ length: episodes.length || 3 }) : episodes).map((maybeEp, idx) => {
          const ep = loading
            ? { id: `skeleton-${idx}`, title: "Loading…", publicAt: Date.now() + 1000, hasEarly: false }
            : maybeEp;

          const isPublic = !loading && now >= Number(ep.publicAt);
          const earlyAllowed = !loading && gate[ep.id]?.allowed === true;
          const locked = !loading && !isPublic && !earlyAllowed;

          const showEarlyChip = !!ep.hasEarly && !loading;
          const countdownText = loading
            ? "Checking…"
            : !isPublic
              ? `Public in ${fmtCountdown(Number(ep.publicAt))}`
              : "Unlocked";

          return (
            <article key={ep.id} className={`card ep-card ${loading ? "is-loading" : ""}`}>
              <header className="ep-card__head">
                <div className="ep-card__title">{ep.title}</div>
                <div className="ep-card__tags">
                  {showEarlyChip && <span className="pill pill--tiny">Early</span>}
                  {earlyAllowed && !isPublic && (
                    <span className="pill pill--bestie pill--tiny">Unlocked</span>
                  )}
                  {locked && <span className="lock" aria-label="Locked">🔒</span>}
                </div>
              </header>

              <div className="ep-meta">
                <span className="pill">{countdownText}</span>
                {!loading && (
                  <span className="ep-date">
                    Public: {new Date(Number(ep.publicAt)).toLocaleString()}
                  </span>
                )}
              </div>

              <div className="ep-actions">
                {loading ? (
                  <div className="skeleton skeleton-btn" />
                ) : isPublic || earlyAllowed ? (
                  <a className="btn btn-primary" href={`/watch/${ep.id}`}>
                    Watch
                  </a>
                ) : (
                  <button className="btn btn-secondary" onClick={() => unlockBestie("/fan/episodes")}>
                    Unlock with Bestie
                  </button>
                )}

                {!loading && (
                  <button className="btn btn-ghost" onClick={() => window.location.reload()}>
                    Refresh
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </main>

      {loading && (
        <p className="ep-loading">Checking early access…</p>
      )}

      <style>{`
        /* Layout */
        .ep-wrap { display: flex; flex-direction: column; gap: 16px; }
        .ep-hero {
          background: linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0));
          border-radius: 16px;
          padding: 20px 16px;
        }
        .ep-hero__inner { max-width: 1100px; margin: 0 auto; }
        .ep-hero__titlebar { display: flex; align-items: center; gap: 10px; }
        .ep-hero__title { margin: 0; font-size: 1.75rem; line-height: 1.2; }
        .ep-hero__subtitle { margin: 6px 0 0; color: #586073; }

        .ep-grid {
          max-width: 1100px;
          margin: 0 auto 28px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        /* Cards */
        .card {
          background: #fff;
          border: 1px solid #eceef3;
          border-radius: 14px;
          padding: 14px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          display: grid;
          gap: 10px;
        }
        .ep-card__head {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
          align-items: start;
        }
        .ep-card__title {
          font-weight: 600;
          font-size: 1.05rem;
        }
        .ep-card__tags { display: inline-flex; gap: 6px; align-items: center; }

        .ep-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .ep-date { color: #6b7280; font-size: 0.9rem; }

        .ep-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        /* Pills */
        .pill {
          display: inline-flex;
          align-items: center;
          height: 26px;
          padding: 0 10px;
          border-radius: 999px;
          border: 1px solid #e7e7ef;
          background: #f7f8ff;
          color: #222;
          font-size: 0.85rem;
        }
        .pill--tiny { height: 20px; padding: 0 8px; font-size: 0.75rem; }
        .pill--bestie {
          background: #ecf0ff;
          border-color: #c9d2ff;
          color: #2e47d1;
        }

        /* Buttons */
        .btn {
          appearance: none;
          border: 1px solid #e5e7eb;
          background: #f7f7f9;
          color: #111827;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 0.95rem;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 40ms ease, background 140ms ease, border-color 140ms ease;
        }
        .btn:hover { background: #f2f2f6; }
        .btn:active { transform: translateY(1px); }
        .btn-primary {
          background: #6b8cff;
          border-color: #6b8cff;
          color: #fff;
        }
        .btn-primary:hover { background: #5a7bff; border-color: #5a7bff; }
        .btn-secondary {
          background: #ff5fb2;
          border-color: #ff5fb2;
          color: #fff;
        }
        .btn-secondary:hover { background: #ff4aa7; border-color: #ff4aa7; }
        .btn-ghost {
          background: #fff;
          color: #374151;
        }

        /* Notice / error */
        .notice {
          margin-top: 10px;
          padding: 10px 12px;
          border-radius: 10px;
        }
        .notice--error {
          border: 1px solid #ffd4d4;
          background: #fff6f6;
          color: #7a1a1a;
        }

        .lock { opacity: 0.7; }

        /* Skeletons */
        .is-loading .ep-card__title,
        .is-loading .ep-date {
          position: relative;
          color: transparent;
        }
        .skeleton,
        .is-loading .ep-card__title::after,
        .is-loading .ep-date::after {
          content: "";
          display: block;
          height: 12px;
          border-radius: 6px;
          background: linear-gradient(90deg, #f1f2f6 25%, #e6e8ef 37%, #f1f2f6 63%);
          background-size: 400% 100%;
          animation: shimmer 1.2s ease-in-out infinite;
        }
        .skeleton-btn { width: 110px; height: 38px; border-radius: 10px; }
        .is-loading .ep-card__title::after { width: 60%; height: 18px; }
        .is-loading .ep-date::after { width: 75%; margin-top: 6px; }

        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: 0 0; }
        }

        .ep-loading {
          max-width: 1100px;
          margin: 0 auto 20px;
          color: #586073;
        }
      `}</style>
    </div>
  );
}
