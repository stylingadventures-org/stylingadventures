// site/src/routes/fan/Community.jsx
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { graphql } from "../../lib/sa"; // optional: only used if your backend is ready

/**
 * Community.jsx
 * Social-style hub:
 * - Page-style header (cover + avatar, like FB/TikTok profile)
 * - Center feed with posts (announcements, polls, fan outfits)
 * - Right sidebar with events & quick links
 */

const demoAnnouncements = [
  {
    id: "a1",
    title: "Closet Game XP Weekend 🎉",
    body: "Earn 2× XP from Style It! between Friday 6PM and Sunday midnight.",
    when: "Today",
    tag: "Event",
  },
  {
    id: "a2",
    title: "New Episode — Holiday Glam Drop",
    body: "Besties can unlock early! Public release next month.",
    when: "This week",
    tag: "Episodes",
  },
];

const demoPolls = [
  {
    id: "p1",
    q: "Which vibe should Lala rock next?",
    options: ["Cozy street", "Glam party", "Vintage chic", "Sporty luxe"],
  },
  {
    id: "p2",
    q: "Pick next community game:",
    options: ["Scavenger Hunt", "Style Bingo", "Look Remix"],
  },
];

const demoEvents = [
  {
    id: "e1",
    title: "Watch Party: Pilot",
    when: "Fri 7:00 PM ET",
    desc: "Join chat while we rewatch the Pilot together.",
  },
  {
    id: "e2",
    title: "Creator AMA",
    when: "Sat 3:00 PM ET",
    desc: "Drop questions for Lala and the team.",
  },
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

  const [votes, setVotes] = useState({}); // { [pollId]: optionIndex }
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // simple local "post" composer state
  const [composerText, setComposerText] = useState("");
  const [fanPosts, setFanPosts] = useState([]);

  const canGraphQL =
    typeof window !== "undefined" &&
    !!(window.sa?.graphql || window.__cfg?.appsyncUrl);

  // Optional: fetch from backend if available (placeholder)
  const loadFromBackend = useCallback(async () => {
    if (!canGraphQL) return false;
    try {
      setLoading(true);
      setErr("");

      // Example only — replace with your schema when ready:
      // const data = await graphql(`
      //   query {
      //     community {
      //       announcements { id title body when tag }
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

  const handlePost = (e) => {
    e.preventDefault();
    if (!composerText.trim()) return;
    const text = composerText.trim();
    setComposerText("");
    setFanPosts((prev) => [
      {
        id: `fan-${Date.now()}`,
        text,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const votedCount = useMemo(
    () => Object.keys(votes).length,
    [votes],
  );

  // Build a "feed" sequence: new fan posts, announcements, polls, then showcase
  const feedItems = useMemo(() => {
    const posts = [];

    // Fan posts (local)
    fanPosts.forEach((p) => {
      posts.push({
        type: "fanPost",
        id: p.id,
        data: p,
      });
    });

    // Announcements
    announcements.forEach((a) => {
      posts.push({
        type: "announcement",
        id: a.id,
        data: a,
      });
    });

    // Polls
    polls.forEach((p) => {
      posts.push({
        type: "poll",
        id: p.id,
        data: p,
      });
    });

    // Showcase (as style posts)
    showcase.forEach((s) => {
      posts.push({
        type: "showcase",
        id: s.id,
        data: s,
      });
    });

    return posts;
  }, [fanPosts, announcements, polls, showcase]);

  return (
    <div className="comm-page">
      {/* PAGE HEADER – like a Facebook / TikTok profile page */}
      <header className="comm-header">
        <div className="comm-cover" />
        <div className="comm-header-inner">
          <div className="comm-header-left">
            <div className="comm-avatar-wrap">
              <div className="comm-avatar">L</div>
            </div>
            <div className="comm-header-info">
              <h1 className="comm-title">Lala&apos;s Community</h1>
              <div className="comm-subline">
                <span className="comm-subline-main">
                  Styling Adventures • Fan hub
                </span>
                <span className="comm-dot">•</span>
                <span className="comm-subline-pill">
                  {votedCount > 0
                    ? `You’ve joined ${votedCount} poll${
                        votedCount === 1 ? "" : "s"
                      }`
                    : "Jump into the conversation"}
                </span>
              </div>
              <div className="comm-header-tags">
                <span className="comm-tag">#fits</span>
                <span className="comm-tag">#episodes</span>
                <span className="comm-tag">#besties</span>
                <span className="comm-tag">#styleLab</span>
              </div>
            </div>
          </div>

          <div className="comm-header-right">
            <a href="/fan/closet" className="comm-btn comm-btn-primary">
              💄 Style a look
            </a>
            <a href="/fan/closet-feed" className="comm-btn comm-btn-ghost">
              ✨ Lala&apos;s Closet
            </a>
            <a href="/fan/episodes" className="comm-btn comm-btn-ghost">
              🎬 Episodes
            </a>
          </div>
        </div>

        <div className="comm-tabs">
          <button className="comm-tab comm-tab--active">Feed</button>
          <button className="comm-tab">Fits</button>
          <button className="comm-tab">Episode chat</button>
          <button className="comm-tab">Events</button>
        </div>
      </header>

      {err && (
        <div className="comm-global-notice">
          <div className="notice notice--error">{err}</div>
        </div>
      )}

      {/* MAIN: center feed + right sidebar */}
      <main className="comm-main">
        {/* CENTER FEED COLUMN */}
        <section className="comm-main-left">
          {/* Composer – like FB "What's on your mind?" */}
          <section className="comm-card comm-composer">
            <div className="comm-composer-head">
              <div className="comm-composer-avatar">U</div>
              <div className="comm-composer-meta">
                <div className="comm-composer-title">
                  Share something with Lala&apos;s fans
                </div>
                <div className="comm-composer-sub">
                  Talk about an episode, share a fit idea, or hype a look.
                </div>
              </div>
            </div>

            <form
              onSubmit={handlePost}
              className="comm-composer-body"
            >
              <textarea
                className="comm-input"
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                placeholder="What did you think of the last episode or outfit drop?"
                rows={3}
              />
              <div className="comm-composer-footer">
                <div className="comm-composer-actions">
                  <button
                    type="button"
                    className="comm-chip-btn"
                    onClick={() =>
                      setComposerText((t) =>
                        t
                          ? t + " #episodeThoughts"
                          : "#episodeThoughts ",
                      )
                    }
                  >
                    🎬 Episode
                  </button>
                  <button
                    type="button"
                    className="comm-chip-btn"
                    onClick={() =>
                      setComposerText((t) =>
                        t ? t + " #fitCheck" : "#fitCheck ",
                      )
                    }
                  >
                    👗 Fit check
                  </button>
                  <button
                    type="button"
                    className="comm-chip-btn"
                    onClick={() =>
                      setComposerText((t) =>
                        t ? t + " #bestie" : "#bestie ",
                      )
                    }
                  >
                    💖 Bestie
                  </button>
                </div>
                <button
                  type="submit"
                  className="comm-btn comm-btn-primary comm-post-btn-primary"
                  disabled={!composerText.trim()}
                >
                  Post
                </button>
              </div>
            </form>
          </section>

          {/* FEED – announcements, polls, fan showcase styled as posts */}
          <section className="comm-feed-card comm-card">
            <div className="comm-feed-head">
              <h2 className="comm-feed-title">Community feed</h2>
              {loading && (
                <span className="comm-pill comm-pill--tiny">
                  Syncing…
                </span>
              )}
              {!loading && canGraphQL && (
                <button
                  className="comm-btn comm-btn-ghost comm-btn-small"
                  type="button"
                  onClick={() => loadFromBackend().catch(() => {})}
                >
                  Refresh
                </button>
              )}
            </div>

            <div className="comm-feed">
              {feedItems.map((item) => {
                if (item.type === "fanPost") {
                  const fp = item.data;
                  return (
                    <article
                      key={item.id}
                      className="comm-post"
                    >
                      <div className="comm-post-head">
                        <div className="comm-post-avatar comm-post-avatar--user">
                          U
                        </div>
                        <div className="comm-post-meta">
                          <div className="comm-post-author">
                            You
                          </div>
                          <div className="comm-post-subline">
                            Fan post
                            <span className="comm-dot">•</span>
                            <span className="comm-post-time">
                              {fp.createdAt
                                ? new Date(
                                    fp.createdAt,
                                  ).toLocaleString()
                                : "Just now"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="comm-post-text">{fp.text}</p>
                      <div className="comm-post-footer">
                        <button
                          type="button"
                          className="comm-post-action"
                        >
                          ❤️ React
                        </button>
                        <button
                          type="button"
                          className="comm-post-action"
                        >
                          💬 Reply (soon)
                        </button>
                      </div>
                    </article>
                  );
                }

                if (item.type === "announcement") {
                  const a = item.data;
                  return (
                    <article
                      key={item.id}
                      className="comm-post"
                    >
                      <div className="comm-post-head">
                        <div className="comm-post-avatar">L</div>
                        <div className="comm-post-meta">
                          <div className="comm-post-author">
                            Lala&apos;s Styling Adventures
                          </div>
                          <div className="comm-post-subline">
                            Announcement
                            {a.tag && (
                              <>
                                <span className="comm-dot">•</span>
                                <span className="comm-tag-pill">
                                  {a.tag}
                                </span>
                              </>
                            )}
                            <span className="comm-dot">•</span>
                            <span className="comm-post-time">
                              {a.when}
                            </span>
                          </div>
                        </div>
                      </div>
                      <h3 className="comm-post-title">
                        {a.title}
                      </h3>
                      <p className="comm-post-text">{a.body}</p>
                      <div className="comm-post-footer">
                        <button
                          type="button"
                          className="comm-post-action"
                        >
                          ❤️ Hype this
                        </button>
                        <button
                          type="button"
                          className="comm-post-action"
                        >
                          🔁 Share (soon)
                        </button>
                      </div>
                    </article>
                  );
                }

                if (item.type === "poll") {
                  const p = item.data;
                  const choice = votes[p.id];
                  return (
                    <article
                      key={item.id}
                      className="comm-post"
                    >
                      <div className="comm-post-head">
                        <div className="comm-post-avatar">📊</div>
                        <div className="comm-post-meta">
                          <div className="comm-post-author">
                            Lala&apos;s team
                          </div>
                          <div className="comm-post-subline">
                            Style poll
                            {choice != null && (
                              <>
                                <span className="comm-dot">•</span>
                                <span className="comm-post-time">
                                  You voted
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <h3 className="comm-post-title">{p.q}</h3>
                      <div className="comm-poll-options">
                        {p.options.map((opt, i) => (
                          <button
                            key={`${p.id}-${i}`}
                            type="button"
                            className={
                              "comm-chip" +
                              (choice === i
                                ? " comm-chip--picked"
                                : "")
                            }
                            onClick={() => onVote(p.id, i)}
                            aria-pressed={choice === i}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                      {choice != null && (
                        <div className="comm-poll-picked">
                          You picked:{" "}
                          <strong>{p.options[choice]}</strong>
                        </div>
                      )}
                    </article>
                  );
                }

                if (item.type === "showcase") {
                  const s = item.data;
                  return (
                    <article
                      key={item.id}
                      className="comm-post"
                    >
                      <div className="comm-post-head">
                        <div className="comm-post-avatar comm-post-avatar--fit">
                          👗
                        </div>
                        <div className="comm-post-meta">
                          <div className="comm-post-author">
                            {s.by}
                          </div>
                          <div className="comm-post-subline">
                            Fan fit • {s.xp} XP
                          </div>
                        </div>
                      </div>
                      <div className="comm-fit-thumb" />
                      <p className="comm-post-text">
                        {s.caption}
                      </p>
                      <div className="comm-post-footer">
                        <button
                          type="button"
                          className="comm-post-action"
                        >
                          💜 Save inspo
                        </button>
                        <a
                          href="/fan/closet"
                          className="comm-post-action comm-post-link"
                        >
                          ✨ Make my own
                        </a>
                      </div>
                    </article>
                  );
                }

                return null;
              })}
            </div>
          </section>
        </section>

        {/* RIGHT SIDEBAR – events, trending fits, quick links */}
        <aside className="comm-main-right">
          {/* Events (sticky-ish) */}
          <section className="comm-card comm-card-sticky">
            <div className="comm-card-head">
              <h2 className="comm-card-title">Upcoming events</h2>
            </div>
            <ul className="comm-event-list">
              {events.map((e) => (
                <li key={e.id} className="comm-event-row">
                  <div className="comm-event-main">
                    <div className="comm-event-title">
                      {e.title}
                    </div>
                    <div className="comm-event-desc">
                      {e.desc}
                    </div>
                  </div>
                  <div className="comm-event-meta">
                    <span className="comm-pill comm-pill--tiny">
                      {e.when}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="comm-card-actions">
              <button
                type="button"
                className="comm-btn comm-btn-primary comm-btn-full"
                onClick={() =>
                  alert("Add to calendar coming soon!")
                }
              >
                Add to my calendar
              </button>
              <button
                type="button"
                className="comm-btn comm-btn-ghost comm-btn-full"
                onClick={() => alert("RSVP coming soon!")}
              >
                RSVP / Remind me
              </button>
            </div>
          </section>

          {/* Trending outfits / favorites rail */}
          <section className="comm-card">
            <div className="comm-card-head">
              <h2 className="comm-card-title">Trending fits</h2>
              <span className="comm-card-sub">
                Pulled from fan showcase
              </span>
            </div>
            <div className="comm-trending-fits">
              {showcase.map((s) => (
                <div
                  key={s.id}
                  className="comm-trend-card"
                >
                  <div className="comm-trend-thumb" />
                  <div className="comm-trend-meta">
                    <div className="comm-trend-caption">
                      {s.caption}
                    </div>
                    <div className="comm-trend-bottom">
                      <span className="comm-trend-by">
                        by {s.by}
                      </span>
                      <span className="comm-trend-xp">
                        {s.xp} XP
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <a href="/fan/closet-feed" className="comm-link">
              Browse Lala&apos;s Closet feed →
            </a>
          </section>

          {/* Quick links / episode talk */}
          <section className="comm-card">
            <div className="comm-card-head">
              <h2 className="comm-card-title">Episode chat</h2>
            </div>
            <p className="comm-episode-text">
              Watch the latest Styling Adventures episode, then
              drop your thoughts here with{" "}
              <span className="comm-tag-inline">
                #episodeThoughts
              </span>
              .
            </p>
            <a
              href="/fan/episodes"
              className="comm-btn comm-btn-primary comm-btn-full"
            >
              Go to episodes
            </a>
          </section>
        </aside>
      </main>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.comm-page {
  max-width: 1100px;
  margin: 0 auto 32px;
  display:flex;
  flex-direction:column;
  gap:14px;
}

/* HEADER / PAGE PROFILE ---------------------------------- */

.comm-header {
  background:#ffffff;
  border-radius:20px;
  border:1px solid #e5e7eb;
  box-shadow:0 18px 40px rgba(148,163,184,0.35);
  overflow:hidden;
}

.comm-cover {
  height:130px;
  background:
    radial-gradient(circle at top left,#f9a8d4,#fdf2ff 50%,transparent 80%),
    radial-gradient(circle at bottom right,#bfdbfe,#eff6ff 55%,transparent 80%),
    linear-gradient(135deg,#6366f1,#ec4899);
}

.comm-header-inner {
  display:flex;
  justify-content:space-between;
  align-items:flex-end;
  gap:12px;
  padding:0 16px 10px;
  position:relative;
}

.comm-header-left {
  display:flex;
  align-items:flex-end;
  gap:10px;
  margin-top:-40px; /* avatar overlap */
}

.comm-avatar-wrap {
  position:relative;
}
.comm-avatar {
  width:76px;
  height:76px;
  border-radius:999px;
  background:linear-gradient(135deg,#6366f1,#ec4899);
  color:#f9fafb;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:2rem;
  font-weight:700;
  box-shadow:0 0 0 3px #ffffff,0 12px 26px rgba(129,140,248,0.7);
}

.comm-header-info {
  display:flex;
  flex-direction:column;
  gap:4px;
}
.comm-title {
  margin:0;
  font-size:1.6rem;
  letter-spacing:-0.03em;
  color:#0f172a;
}
.comm-subline {
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  align-items:center;
  font-size:0.86rem;
}
.comm-subline-main {
  font-weight:500;
  color:#4b5563;
}
.comm-subline-pill {
  padding:3px 9px;
  border-radius:999px;
  font-size:0.8rem;
  background:#eef2ff;
  color:#4338ca;
}
.comm-dot {
  color:#d1d5db;
}

.comm-header-tags {
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  margin-top:2px;
}
.comm-tag {
  padding:3px 8px;
  border-radius:999px;
  font-size:0.78rem;
  background:#fdf2ff;
  color:#9d174d;
  border:1px solid #f9a8d4;
}

/* header actions */

.comm-header-right {
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  align-items:center;
  padding-bottom:6px;
}

/* tabs */

.comm-tabs {
  border-top:1px solid #e5e7eb;
  padding:6px 12px 4px;
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}
.comm-tab {
  border:none;
  background:transparent;
  border-radius:999px;
  padding:6px 12px;
  font-size:0.85rem;
  cursor:pointer;
  color:#4b5563;
}
.comm-tab--active {
  background:#eef2ff;
  color:#4338ca;
  font-weight:600;
}

/* GLOBAL ERROR */

.comm-global-notice {
  max-width:1100px;
  margin:0 auto;
}

/* MAIN LAYOUT -------------------------------------------- */

.comm-main {
  max-width:1100px;
  margin:0 auto;
  display:grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(0, 1.1fr);
  gap:14px;
  align-items:flex-start;
}
@media (max-width: 880px) {
  .comm-main {
    grid-template-columns:minmax(0,1fr);
  }
}

.comm-main-left,
.comm-main-right {
  display:flex;
  flex-direction:column;
  gap:10px;
}

/* GENERIC CARDS ------------------------------------------ */

.comm-card {
  background:#ffffff;
  border-radius:16px;
  border:1px solid #e5e7eb;
  padding:12px 14px 14px;
  box-shadow:0 12px 30px rgba(148,163,184,0.18);
}
.comm-card-sticky {
  position:sticky;
  top:76px;
}

.comm-card-head {
  display:flex;
  justify-content:space-between;
  gap:8px;
  align-items:flex-start;
}
.comm-card-title {
  margin:0;
  font-size:1.05rem;
  font-weight:600;
  color:#111827;
}
.comm-card-sub {
  font-size:0.8rem;
  color:#9ca3af;
}

/* COMPOSER ----------------------------------------------- */

.comm-composer-head {
  display:flex;
  align-items:flex-start;
  gap:10px;
}
.comm-composer-avatar {
  width:40px;
  height:40px;
  border-radius:999px;
  background:#e5e7eb;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:1.1rem;
  font-weight:600;
  color:#4b5563;
  flex-shrink:0;
}
.comm-composer-meta {
  flex:1;
  min-width:0;
}
.comm-composer-title {
  font-size:0.96rem;
  font-weight:600;
}
.comm-composer-sub {
  font-size:0.84rem;
  color:#6b7280;
}

.comm-composer-body {
  margin-top:8px;
  display:flex;
  flex-direction:column;
  gap:6px;
}
.comm-input {
  width:100%;
  min-height:70px;
  border-radius:12px;
  border:1px solid #e5e7eb;
  padding:8px 10px;
  font-size:0.9rem;
  resize:vertical;
  font-family:inherit;
}
.comm-input:focus {
  outline:none;
  border-color:#a855f7;
  box-shadow:0 0 0 1px rgba(168,85,247,0.25);
}

.comm-composer-footer {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:8px;
  flex-wrap:wrap;
}
.comm-composer-actions {
  display:flex;
  flex-wrap:wrap;
  gap:6px;
}

.comm-chip-btn {
  border:none;
  padding:5px 10px;
  border-radius:999px;
  font-size:0.8rem;
  cursor:pointer;
  background:#f9fafb;
  color:#4b5563;
  border:1px solid #e5e7eb;
}
.comm-chip-btn:hover {
  background:#eff6ff;
  border-color:#bfdbfe;
}

/* FEED ---------------------------------------------------- */

.comm-feed-card {
  padding-top:10px;
}
.comm-feed-head {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
  margin-bottom:4px;
}
.comm-feed-title {
  margin:0;
  font-size:1.05rem;
  font-weight:600;
}

.comm-feed {
  margin-top:4px;
  display:flex;
  flex-direction:column;
  gap:10px;
}

/* Post */

.comm-post {
  border-radius:14px;
  border:1px solid #e5e7eb;
  background:#f9fafb;
  padding:10px 10px 9px;
}

.comm-post-head {
  display:flex;
  align-items:flex-start;
  gap:8px;
}
.comm-post-avatar {
  width:34px;
  height:34px;
  border-radius:999px;
  background:linear-gradient(135deg,#6366f1,#ec4899);
  color:#f9fafb;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:0.9rem;
  font-weight:600;
  flex-shrink:0;
}
.comm-post-avatar--user {
  background:#e5e7eb;
  color:#4b5563;
}
.comm-post-avatar--fit {
  background:#f9a8d4;
  color:#9d174d;
}
.comm-post-meta {
  display:flex;
  flex-direction:column;
}
.comm-post-author {
  font-size:0.9rem;
  font-weight:600;
}
.comm-post-subline {
  font-size:0.78rem;
  color:#6b7280;
}
.comm-post-time {
  color:#9ca3af;
}

.comm-post-title {
  margin:8px 0 2px;
  font-size:0.96rem;
  font-weight:600;
  color:#111827;
}
.comm-post-text {
  margin:4px 0 2px;
  font-size:0.9rem;
  color:#111827;
}

.comm-post-footer {
  margin-top:6px;
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}
.comm-post-action {
  border:none;
  background:transparent;
  font-size:0.8rem;
  cursor:pointer;
  color:#4b5563;
  padding:3px 0;
}
.comm-post-action:hover {
  text-decoration:underline;
}
.comm-post-link {
  text-decoration:none;
}

/* poll in post */

.comm-poll-options {
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  margin-top:4px;
}
.comm-chip {
  border:1px solid #e5e7eb;
  background:#ffffff;
  color:#111827;
  border-radius:999px;
  padding:6px 11px;
  font-size:0.86rem;
  cursor:pointer;
  transition:transform 40ms ease, background 140ms ease, border-color 140ms ease;
}
.comm-chip:hover {
  background:#f3f4ff;
}
.comm-chip:active {
  transform:translateY(1px);
}
.comm-chip--picked {
  background:#eef2ff;
  border-color:#c7d2fe;
  color:#4338ca;
}
.comm-poll-picked {
  margin-top:6px;
  font-size:0.84rem;
  color:#374151;
}

/* showcase image placeholder */

.comm-fit-thumb {
  margin-top:6px;
  width:100%;
  border-radius:12px;
  aspect-ratio:16/9;
  background:linear-gradient(135deg,#e0e7ff,#fbcfe8);
}

/* EVENTS (SIDEBAR) --------------------------------------- */

.comm-event-list {
  list-style:none;
  padding:0;
  margin:4px 0 0;
  display:flex;
  flex-direction:column;
  gap:6px;
}
.comm-event-row {
  display:grid;
  grid-template-columns: minmax(0,1fr) auto;
  gap:8px;
  border-radius:10px;
  border:1px solid #e5e7eb;
  padding:8px;
  background:#f9fafb;
  font-size:0.88rem;
}
.comm-event-main {
  display:flex;
  flex-direction:column;
  gap:2px;
}
.comm-event-title {
  font-weight:600;
}
.comm-event-desc {
  color:#4b5563;
  font-size:0.84rem;
}
.comm-event-meta {
  align-self:center;
}

.comm-card-actions {
  margin-top:8px;
  display:flex;
  flex-direction:column;
  gap:6px;
}

/* Trending fits rail ------------------------------------- */

.comm-trending-fits {
  margin-top:6px;
  display:flex;
  flex-direction:column;
  gap:6px;
}
.comm-trend-card {
  display:grid;
  grid-template-columns:70px minmax(0,1fr);
  gap:8px;
  border-radius:10px;
  border:1px solid #e5e7eb;
  padding:6px;
  background:#f9fafb;
}
.comm-trend-thumb {
  border-radius:8px;
  background:linear-gradient(135deg,#6366f1,#ec4899);
}
.comm-trend-meta {
  display:flex;
  flex-direction:column;
  gap:2px;
}
.comm-trend-caption {
  font-size:0.88rem;
  font-weight:600;
}
.comm-trend-bottom {
  display:flex;
  justify-content:space-between;
  font-size:0.78rem;
  color:#6b7280;
}
.comm-trend-xp {
  font-weight:600;
}

.comm-episode-text {
  font-size:0.9rem;
  color:#4b5563;
  margin:4px 0 8px;
}

/* LINKS / TAGS ------------------------------------------- */

.comm-link {
  display:inline-block;
  margin-top:6px;
  font-size:0.86rem;
  color:#4f46e5;
  text-decoration:none;
}
.comm-link:hover {
  text-decoration:underline;
}
.comm-tag-pill {
  padding:2px 7px;
  border-radius:999px;
  font-size:0.7rem;
  background:#f3e8ff;
  color:#6b21a8;
}
.comm-tag-inline {
  padding:2px 6px;
  border-radius:999px;
  background:#eef2ff;
  color:#4338ca;
  font-size:0.8rem;
}

/* BUTTONS & PILLS ---------------------------------------- */

.comm-btn {
  border-radius:999px;
  border:1px solid #e5e7eb;
  background:#ffffff;
  color:#111827;
  padding:8px 14px;
  font-size:0.86rem;
  font-weight:500;
  cursor:pointer;
  text-decoration:none;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  transition:
    transform 40ms ease,
    background 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease;
}
.comm-btn:hover {
  background:#f5f3ff;
  border-color:#e0e7ff;
  box-shadow:0 6px 16px rgba(129,140,248,0.35);
}
.comm-btn:active {
  transform: translateY(1px);
}
.comm-btn-primary {
  background:linear-gradient(135deg,#6366f1,#ec4899);
  border-color:#6366f1;
  color:#ffffff;
  box-shadow:0 8px 18px rgba(236,72,153,0.45);
}
.comm-btn-primary:hover {
  background:linear-gradient(135deg,#4f46e5,#db2777);
  border-color:#4f46e5;
}
.comm-btn-ghost {
  background:#ffffff;
  color:#374151;
}
.comm-btn-full {
  width:100%;
}
.comm-btn-small {
  padding:5px 10px;
  font-size:0.8rem;
}
.comm-post-btn-primary {
  min-width:88px;
}

/* Pills */

.comm-pill {
  display:inline-flex;
  align-items:center;
  height:24px;
  padding:0 9px;
  border-radius:999px;
  border:1px solid #e7e7ef;
  background:#f7f8ff;
  color:#222;
  font-size:0.8rem;
}
.comm-pill--tiny {
  height:20px;
  padding:0 8px;
  font-size:0.75rem;
}

/* Notices ------------------------------------------------ */

.notice {
  padding:10px 12px;
  border-radius:10px;
}
.notice--error {
  border:1px solid #ffd4d4;
  background:#fff6f6;
  color:#7a1a1a;
}

/* RESPONSIVE -------------------------------------------- */

@media (max-width: 640px) {
  .comm-header-inner {
    flex-direction:column;
    align-items:flex-start;
  }
  .comm-header-right {
    padding-bottom:8px;
  }
  .comm-title {
    font-size:1.4rem;
  }
}
`;


