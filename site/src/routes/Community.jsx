// site/src/routes/Community.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { graphql } from "../lib/sa"; // optional: only used if your backend is ready

/**
 * Community.jsx
 * Fan hub for announcements, polls, events, and fan showcase.
 * - Responsive two-column layout on desktop
 * - Sticky sidebar for Events
 * - Local poll voting; easy to wire to GraphQL later
 */

const demoAnnouncements = [
  {
    id: "a1",
    title: "Closet Game XP Weekend 🎉",
    body: "Earn 2× XP from Style It! between Friday 6PM and Sunday midnight.",
    when: "Today",
  },
  {
    id: "a2",
    title: "New Episode — Holiday Glam Drop",
    body: "Besties can unlock early! Public release next month.",
    when: "This week",
  },
];

const demoPolls = [
  {
    id: "p1",
    q: "Which vibe should Lala rock next?",
    options: ["Cozy street", "Glam party", "Vintage chic", "Sporty luxe"],
  },
  { id: "p2", q: "Pick next community game:", options: ["Scavenger Hunt", "Style Bingo", "Look Remix"] },
];

const demoEvents = [
  { id: "e1", title: "Watch Party: Pilot", when: "Fri 7:00 PM ET", desc: "Join chat while we rewatch the Pilot together." },
  { id: "e2", title: "Creator AMA", when: "Sat 3:00 PM ET", desc: "Drop questions for Lala and the team." },
];

const demoShowcase = [
  { id: "s1", by: "Sky", caption: "Cozy street fit!", xp: 42 },
  { id: "s2", by: "Maya", caption: "Holiday glam inspo ✨", xp: 67 },
  { id: "s3", by: "Jae", caption: "Sporty luxe day-out", xp: 38 },
];

export default function Community() {
  const [announcements, setAnnouncements] = useState(demoAnnouncements);
  const [polls, setPolls] = useState(demoPolls);
  const [events, setEvents] = useState(demoEvents);
  const [showcase, setShowcase] = useState(demoShowcase);

  // vote state { [pollId]: optionIndex }
  const [votes, setVotes] = useState({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const canGraphQL = typeof window !== "undefined" && !!(window.sa?.graphql || window.__cfg?.appsyncUrl);

  // Optional: fetch from backend if available (placeholder queries)
  const loadFromBackend = useCallback(async () => {
    if (!canGraphQL) return false;
    try {
      setLoading(true);
      setErr("");

      // Example only — replace with your schema when ready:
      // const data = await graphql(`
      //   query {
      //     community {
      //       announcements { id title body when }
      //       polls { id q options }
      //       events { id title when desc }
      //       showcase { id by caption xp }
      //     }
      //   }
      // `);
      // const c = data?.community ?? {};
      // setAnnouncements(c.announcements ?? demoAnnouncements);
      // setPolls(c.polls ?? demoPolls);
      // setEvents(c.events ?? demoEvents);
      // setShowcase(c.showcase ?? demoShowcase);

      return true;
    } catch (e) {
      setErr(String(e?.message || e));
      return false;
    } finally {
      setLoading(false);
    }
  }, [canGraphQL]);

  useEffect(() => {
    loadFromBackend().catch(() => {});
  }, [loadFromBackend]);

  const onVote = async (pollId, optionIdx) => {
    try {
      setVotes((v) => ({ ...v, [pollId]: optionIdx }));
      // Optional backend:
      // await graphql(
      //   `mutation ($id:ID!, $i:Int!){ votePoll(id:$id, optionIndex:$i){ id } }`,
      //   { id: pollId, i: optionIdx }
      // );
    } catch (e) {
      setErr(String(e?.message || e));
    }
  };

  const votedCount = useMemo(() => Object.keys(votes).length, [votes]);

  return (
    <div className="comm-wrap">
      <header className="comm-hero">
        <div className="comm-hero__inner">
          <div className="comm-titlebar">
            <h1 className="comm-title">Community</h1>
            <span className="pill">{votedCount ? `Voted in ${votedCount}` : "Welcome"}</span>
          </div>
          <p className="comm-subtitle">Games, polls, events, and fan magic ✨</p>
          {err && <div className="notice notice--error">{err}</div>}
        </div>
      </header>

      {/* --- Two-column content grid --- */}
      <div className="comm-grid">
        {/* MAIN FEED COLUMN */}
        <div className="comm-col comm-col--main">
          {/* Announcements */}
          <section className="card section">
            <div className="section__head">
              <h2 className="section__title">Announcements</h2>
              {loading && <span className="pill pill--tiny">Syncing…</span>}
            </div>

            <ul className="list">
              {announcements.map((a) => (
                <li key={a.id} className="list__row">
                  <div className="list__main">
                    <div className="list__title">{a.title}</div>
                    <div className="list__desc">{a.body}</div>
                  </div>
                  <div className="list__meta">{a.when}</div>
                </li>
              ))}
            </ul>
          </section>

          {/* Polls */}
          <section className="card section">
            <div className="section__head">
              <h2 className="section__title">Polls</h2>
              <div className="section__actions">
                <button className="btn btn-ghost" onClick={() => loadFromBackend().catch(() => {})}>
                  Refresh
                </button>
              </div>
            </div>

            <div className="polls">
              {polls.map((p) => {
                const choice = votes[p.id];
                return (
                  <article key={p.id} className="poll">
                    <header className="poll__q">{p.q}</header>
                    <div className="poll__options">
                      {p.options.map((opt, i) => (
                        <button
                          key={`${p.id}-${i}`}
                          className={`chip ${choice === i ? "chip--picked" : ""}`}
                          onClick={() => onVote(p.id, i)}
                          aria-pressed={choice === i}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {choice != null && (
                      <div className="poll__picked">
                        You picked: <strong>{p.options[choice]}</strong>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        {/* SIDEBAR COLUMN */}
        <aside className="comm-col comm-col--side">
          {/* Events (sticky) */}
          <section className="card section section--sticky">
            <div className="section__head">
              <h2 className="section__title">Upcoming events</h2>
            </div>
            <ul className="list">
              {events.map((e) => (
                <li key={e.id} className="list__row">
                  <div className="list__main">
                    <div className="list__title">{e.title}</div>
                    <div className="list__desc">{e.desc}</div>
                  </div>
                  <div className="list__meta">
                    <span className="pill pill--tiny">{e.when}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="section__actions">
              <button className="btn btn-primary" onClick={() => alert("Add to calendar coming soon!")}>
                Add to my calendar
              </button>
              <button className="btn btn-ghost" onClick={() => alert("RSVP coming soon!")}>
                RSVP
              </button>
            </div>
          </section>

          {/* Fan Showcase */}
          <section className="card section">
            <div className="section__head">
              <h2 className="section__title">Fan showcase</h2>
              <div className="section__actions">
                <button className="btn btn-secondary" onClick={() => alert("Upload coming soon!")}>
                  Submit your look
                </button>
              </div>
            </div>
            <div className="showcase">
              {showcase.map((s) => (
                <div key={s.id} className="tile">
                  <div className="tile__img" aria-hidden />
                  <div className="tile__meta">
                    <span className="tile__by">{s.by}</span>
                    <span className="tile__xp">{s.xp} XP</span>
                  </div>
                  <div className="tile__caption">{s.caption}</div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {/* Styles */}
      <style>{`
        .comm-wrap { display:flex; flex-direction:column; gap:16px; }

        .comm-hero {
          background: linear-gradient(180deg, rgba(255,95,178,0.12), rgba(255,255,255,0));
          border-radius: 16px; padding: 20px 16px;
        }
        .comm-hero__inner { max-width: 1100px; margin: 0 auto; }
        .comm-titlebar { display:flex; align-items:center; gap:10px; }
        .comm-title { margin:0; font-size:1.75rem; line-height:1.2; }
        .comm-subtitle { margin:6px 0 0; color:#586073; }

        /* --- Grid layout --- */
        .comm-grid {
          max-width: 1100px; margin: 0 auto 28px;
          display: grid; gap: 16px;
        }
        @media (min-width: 960px) {
          .comm-grid { grid-template-columns: 2fr 1fr; align-items: start; }
        }
        .comm-col { display: grid; gap: 16px; }
        .comm-col--side { position: relative; }

        /* --- Sticky card (events) --- */
        .section--sticky {
          position: sticky;
          top: 84px; /* keeps below your top nav */
          z-index: 1;
        }

        /* --- Section framing --- */
        .card {
          background:#fff; border:1px solid #eceef3; border-radius:14px; padding:14px;
          box-shadow:0 1px 3px rgba(0,0,0,0.05);
        }
        .section { padding: 14px; }
        .section__head {
          display:flex; align-items:center; justify-content:space-between; gap:12px;
          border-bottom:1px solid #f1f2f6; padding-bottom:8px; margin-bottom:8px;
        }
        .section__title { margin:0; font-size:1.1rem; }
        .section__actions { display:flex; gap:10px; flex-wrap:wrap; }

        /* --- Lists --- */
        .list { margin:0; padding:0; list-style:none; display:grid; gap:8px; }
        .list__row {
          display:grid; grid-template-columns: 1fr auto; gap:10px;
          border:1px solid #f0f0f5; border-radius:10px; padding:10px; background:#fff;
        }
        .list__title { font-weight:600; }
        .list__desc { color:#4a4f5a; margin-top:2px; }
        .list__meta { color:#6b7280; white-space:nowrap; align-self:center; }

        /* --- Polls --- */
        .polls { display:grid; gap:12px; }
        .poll { border:1px solid #f0f0f5; border-radius:12px; padding:12px; }
        .poll__q { font-weight:600; margin-bottom:10px; }
        .poll__options { display:flex; gap:8px; flex-wrap:wrap; }
        .poll__picked { margin-top:8px; color:#374151; }

        .chip {
          border:1px solid #e5e7eb; background:#fff; color:#111827;
          border-radius:999px; padding:8px 12px; cursor:pointer;
          transition:transform 40ms ease, background 140ms ease;
        }
        .chip:hover { background:#f8f9ff; }
        .chip:active { transform: translateY(1px); }
        .chip--picked { background:#ecf0ff; border-color:#c9d2ff; color:#2e47d1; }

        /* --- Showcase grid (sidebar) --- */
        .showcase { display:grid; gap:10px; grid-template-columns: 1fr; }
        .tile { border:1px solid #f0f0f5; border-radius:12px; padding:10px; display:grid; gap:8px; }
        .tile__img { background:linear-gradient(120deg,#f6f7ff,#fff); border-radius:10px; height:120px; }
        .tile__meta { display:flex; justify-content:space-between; align-items:center; color:#374151; }
        .tile__by { font-weight:600; }
        .tile__xp { color:#0b6bcb; font-weight:600; }
        .tile__caption { color:#4a4f5a; }

        /* --- Buttons & Pills --- */
        .btn {
          appearance:none; border:1px solid #e5e7eb; background:#f7f7f9; color:#111827;
          border-radius:10px; padding:10px 14px; font-size:0.95rem; cursor:pointer;
          text-decoration:none; display:inline-flex; align-items:center; justify-content:center;
          transition:transform 40ms ease, background 140ms ease, border-color 140ms ease;
        }
        .btn:hover { background:#f2f2f6; }
        .btn:active { transform: translateY(1px); }
        .btn-primary { background:#6b8cff; border-color:#6b8cff; color:#fff; }
        .btn-primary:hover { background:#5a7bff; border-color:#5a7bff; }
        .btn-secondary { background:#ff5fb2; border-color:#ff5fb2; color:#fff; }
        .btn-secondary:hover { background:#ff4aa7; border-color:#ff4aa7; }
        .btn-ghost { background:#fff; color:#374151; }

        .pill {
          display:inline-flex; align-items:center; height:26px; padding:0 10px;
          border-radius:999px; border:1px solid #e7e7ef; background:#f7f8ff;
          color:#222; font-size:0.85rem;
        }
        .pill--tiny { height:20px; padding:0 8px; font-size:0.75rem; }

        /* --- Notices --- */
        .notice { padding:10px 12px; border-radius:10px; margin-top:10px; }
        .notice--error { border:1px solid #ffd4d4; background:#fff6f6; color:#7a1a1a; }
      `}</style>
    </div>
  );
}
