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

// Fallback if window.sa.graphql isn’t ready
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
    headers: {
      "content-type": "application/json",
      authorization: idToken,
    },
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

  const episodes = useMemo(() => EPISODES, []);

  const refetchMembershipAndGates = useCallback(async () => {
    setLoading(true);
    try {
      try {
        const d = await runGql(GQL.meBestie);
        if (d?.meBestieStatus) setBestie(d.meBestieStatus);
      } catch {
        // ignore sign-in/network
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
              d?.isEpisodeEarlyAccess ??
              { allowed: false, reason: "unknown" };
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
        } catch {
          /* not signed in */
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
                d?.isEpisodeEarlyAccess ??
                { allowed: false, reason: "unknown" };
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
    return () => {
      gone = true;
    };
  }, [episodes, runGql]);

  async function unlockBestie(returnTo = "/fan/episodes") {
    try {
      setErr("");
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
        location.assign(
          `${(cfg._hostBase || cfg.cognitoDomain)}/login?${qp.toString()}`
        );
        return;
      }

      // Try checkout (if Stripe is configured)
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
      } catch {
        /* ignore */
      }

      // Fallback: free trial demo
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
              title={
                bestie?.active
                  ? `Bestie • until ${bestie.until || "—"}`
                  : "Unlock Bestie for early access"
              }
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
        {(loading
          ? Array.from({ length: episodes.length || 3 })
          : episodes
        ).map((maybeEp, idx) => {
          const ep = loading
            ? {
                id: `skeleton-${idx}`,
                title: "Loading…",
                publicAt: Date.now() + 1000,
                hasEarly: false,
              }
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
            <article
              key={ep.id}
              className={`card ep-card ${loading ? "is-loading" : ""}`}
            >
              <header className="ep-card__head">
                <div className="ep-card__title">{ep.title}</div>
                <div className="ep-card__tags">
                  {showEarlyChip && (
                    <span className="pill pill--tiny">Early</span>
                  )}
                  {earlyAllowed && !isPublic && (
                    <span className="pill pill--bestie pill--tiny">
                      Unlocked
                    </span>
                  )}
                  {locked && (
                    <span className="lock" aria-label="Locked">
                      🔒
                    </span>
                  )}
                </div>
              </header>

              <div className="ep-meta">
                <span className="pill">{countdownText}</span>
                {!loading && (
                  <span className="ep-date">
                    Public:{" "}
                    {new Date(Number(ep.publicAt)).toLocaleString()}
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
                  <button
                    className="btn btn-secondary"
                    onClick={() => unlockBestie("/fan/episodes")}
                  >
                    Unlock with Bestie
                  </button>
                )}

                {!loading && (
                  <button
                    className="btn btn-ghost"
                    onClick={() => window.location.reload()}
                  >
                    Refresh
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </main>

      {loading && <p className="ep-loading">Checking early access…</p>}

      {/* styles identical to what you already had – omitted here for brevity */}
    </div>
  );
}
