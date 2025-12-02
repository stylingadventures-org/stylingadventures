// site/src/routes/admin/AdminEpisodeStudio.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const STATUS_OPTIONS = ["DRAFT", "SCHEDULED", "PUBLISHED"];

const defaultForm = {
  id: "",
  title: "",
  season: "",
  episodeNumber: "",
  showId: "",
  shortDescription: "",
  fullDescription: "",
  status: "DRAFT",
  publicAt: "",
  durationSeconds: "",
  unlockCoinCost: "",
  chatEnabled: true,
  thumbnails: [],
};

// ─────────────────────────────────────────
// ECONOMY HINTS CARD
// ─────────────────────────────────────────
function EpisodeEconomyHintsCard() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr("");
        setLoading(true);
        if (window.sa?.ready) {
          await window.sa.ready();
        } else if (window.getSA) {
          await window.getSA();
        }

        const r = await window.sa.graphql(
          `query GetGameEconomyConfig {
             getGameEconomyConfig {
               dailyCoinCap
               weeklyCoinCap
               rules {
                 id
                 category
                 label
                 coins
                 per
                 maxPerDay
               }
             }
           }`
        );
        if (!alive) return;
        setConfig(r?.getGameEconomyConfig || null);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const watchRules =
    config?.rules?.filter((r) => r.category === "WATCH_TIME") ?? [];
  const triviaRules =
    config?.rules?.filter((r) => r.category === "TRIVIA") ?? [];
  const streakRules =
    config?.rules?.filter((r) => r.category === "STREAK") ?? [];

  return (
    <section className="ep-admin-card">
      <h2 className="ep-admin-card-title">Coin economy hints</h2>
      <p className="ep-admin-card-sub">
        These numbers help you pick a fair coin price for unlocking this
        episode. Think about how many days of normal play it should take a fan
        to unlock it.
      </p>

      {loading && (
        <p className="ep-admin-economy-loading">Loading…</p>
      )}
      {err && (
        <p className="ep-admin-economy-error">
          Couldn&apos;t load config: {err}
        </p>
      )}

      {config && (
        <>
          <ul className="fan-rules-list">
            <li>
              Daily coin cap: <strong>{config.dailyCoinCap ?? "–"}</strong>
            </li>
            <li>
              Weekly coin cap: <strong>{config.weeklyCoinCap ?? "–"}</strong>
            </li>
          </ul>

          {watchRules.length > 0 && (
            <>
              <h3 className="ep-admin-economy-subtitle">
                Watch-time rewards
              </h3>
              <ul className="fan-rules-list">
                {watchRules.map((r) => (
                  <li key={r.id}>
                    {r.label}: <strong>{r.coins}</strong> coins{" "}
                    {r.per ? `(${r.per})` : ""}{" "}
                    {r.maxPerDay != null ? `· max ${r.maxPerDay}/day` : ""}
                  </li>
                ))}
              </ul>
            </>
          )}

          {triviaRules.length > 0 && (
            <>
              <h3 className="ep-admin-economy-subtitle">Trivia / games</h3>
              <ul className="fan-rules-list">
                {triviaRules.map((r) => (
                  <li key={r.id}>
                    {r.label}: <strong>{r.coins}</strong> coins{" "}
                    {r.per ? `(${r.per})` : ""}{" "}
                    {r.maxPerDay != null ? `· max ${r.maxPerDay}/day` : ""}
                  </li>
                ))}
              </ul>
            </>
          )}

          {streakRules.length > 0 && (
            <>
              <h3 className="ep-admin-economy-subtitle">Streak bonuses</h3>
              <ul className="fan-rules-list">
                {streakRules.map((r) => (
                  <li key={r.id}>
                    {r.label}: <strong>{r.coins}</strong> coins{" "}
                    {r.per ? `(${r.per})` : ""}{" "}
                    {r.maxPerDay != null ? `· max ${r.maxPerDay}/day` : ""}
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="ep-admin-economy-footnote">
            Example: if a fan can realistically earn ~10 coins/day, then an
            unlock price of 20–30 coins feels like 2–3 days of play.
          </p>
        </>
      )}
    </section>
  );
}

export default function AdminEpisodeStudio() {
  const nav = useNavigate();
  const [form, setForm] = useState(defaultForm);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoFile, setVideoFile] = useState(null);

  const [episodes, setEpisodes] = useState([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // basic stats
  const totalEpisodes = episodes.length;
  const publishedCount = episodes.filter((e) => e.status === "PUBLISHED")
    .length;

  // ---------------------------
  // helpers
  // ---------------------------
  function updateFormField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function resetForm() {
    setForm(defaultForm);
    setVideoFile(null);
  }

  // ---------------------------
  // load episodes
  // ---------------------------
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadingList(true);
        setErr("");

        if (window.sa?.ready) {
          await window.sa.ready();
        }

        const data = await window.sa.graphql(
          `query AdminListEpisodes($status: EpisodeStatus, $limit: Int) {
             adminListEpisodes(status: $status, limit: $limit) {
               items {
                 id
                 title
                 season
                 episodeNumber
                 showId
                 status
                 publicAt
                 unlockCoinCost
                 durationSeconds
                 chatEnabled
                 thumbnails { key primary }
               }
               nextToken
             }
           }`,
          {
            status: filterStatus || null,
            limit: 100,
          }
        );

        if (!alive) return;
        setEpisodes(data?.adminListEpisodes?.items || []);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || String(e));
      } finally {
        if (alive) setLoadingList(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [filterStatus]);

  const filteredEpisodes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return episodes;
    return episodes.filter((e) =>
      (e.title || "").toLowerCase().includes(q)
    );
  }, [episodes, search]);

  // ---------------------------
  // submit: create or update
  // ---------------------------
  async function handleSave(e) {
    e?.preventDefault();
    setSaving(true);
    setErr("");

    try {
      if (window.sa?.ready) await window.sa.ready();

      // TODO: hook videoFile into your uploads pipeline and set a mediaKey
      // For now, assume thumbnails[] + metadata only.

      const input = {
        title: form.title.trim(),
        season: form.season ? Number(form.season) : null,
        episodeNumber: form.episodeNumber
          ? Number(form.episodeNumber)
          : null,
        showId: form.showId || null,
        shortDescription: form.shortDescription || "",
        fullDescription: form.fullDescription || "",
        status: form.status,
        publicAt: form.publicAt || new Date().toISOString(),
        durationSeconds: form.durationSeconds
          ? Number(form.durationSeconds)
          : null,
        unlockCoinCost: form.unlockCoinCost
          ? Number(form.unlockCoinCost)
          : null,
        chatEnabled: !!form.chatEnabled,
        thumbnails: form.thumbnails || [],
      };

      if (!form.id) {
        // create
        const data = await window.sa.graphql(
          `mutation AdminCreateEpisode($input: AdminCreateEpisodeInput!) {
             adminCreateEpisode(input: $input) {
               id
               title
               status
               publicAt
             }
           }`,
          { input }
        );
        const created = data?.adminCreateEpisode;
        if (created) {
          setEpisodes((eps) => [created, ...eps]);
          setForm((f) => ({ ...f, id: created.id }));
        }
      } else {
        // update
        const data = await window.sa.graphql(
          `mutation AdminUpdateEpisode($episodeId: ID!, $input: AdminUpdateEpisodeInput!) {
             adminUpdateEpisode(episodeId: $episodeId, input: $input) {
               id
               title
               status
               publicAt
               season
               episodeNumber
               showId
               unlockCoinCost
               durationSeconds
               chatEnabled
               thumbnails { key primary }
             }
           }`,
          { episodeId: form.id, input }
        );
        const updated = data?.adminUpdateEpisode;
        if (updated) {
          setEpisodes((eps) =>
            eps.map((e) => (e.id === updated.id ? updated : e))
          );
          setForm((f) => ({ ...f, ...updated }));
        }
      }
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------
  // select episode from dashboard
  // ---------------------------
  function handleSelectEpisode(ep) {
    setForm({
      ...defaultForm,
      ...ep,
      season: ep.season ?? "",
      episodeNumber: ep.episodeNumber ?? "",
      durationSeconds: ep.durationSeconds ?? "",
      unlockCoinCost: ep.unlockCoinCost ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------------------------
  // UI
  // ---------------------------
  return (
    <div className="ep-admin-page">
      {/* HERO HEADER */}
      <header className="ep-admin-hero">
        <div className="ep-admin-hero-inner">
          <div className="ep-admin-hero-left">
            <div className="ep-admin-pill">Admin • Episodes</div>
            <h1 className="ep-admin-title">Admin Episode Studio 🎬</h1>
            <p className="ep-admin-sub">
              Upload episodes, manage metadata, link outfits, and control chat
              &amp; coin unlock rules for each drop.
            </p>
          </div>
          <div className="ep-admin-hero-right">
            <div className="ep-admin-stat">
              <span className="ep-admin-stat-label">Total episodes</span>
              <span className="ep-admin-stat-value">{totalEpisodes}</span>
            </div>
            <div className="ep-admin-stat">
              <span className="ep-admin-stat-label">Published</span>
              <span className="ep-admin-stat-value">{publishedCount}</span>
            </div>
            <button
              type="button"
              className="ep-admin-hero-btn"
              onClick={() => resetForm()}
            >
              New episode
            </button>
          </div>
        </div>
      </header>

      {/* NOTICES */}
      <main className="ep-admin-main">
        {err && (
          <div className="ep-admin-notice ep-admin-notice--error">
            {err}
          </div>
        )}

        {/* TWO COLUMN LAYOUT */}
        <div className="ep-admin-grid">
          {/* LEFT: upload / editor */}
          <section className="ep-admin-card">
            <h2 className="ep-admin-card-title">Episode upload</h2>
            <p className="ep-admin-card-sub">
              Upload new episodes, descriptions, thumbnails, and coin unlock
              settings. Fans won&apos;t see drafts until you publish.
            </p>

            {/* Video upload drop area (mirrors closet) */}
            <div className="ep-admin-section">
              <h3 className="ep-admin-section-title">Upload episode video</h3>
              <div className="ep-admin-dropzone">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setVideoFile(file || null);
                  }}
                  disabled={uploadingVideo}
                />
                <div className="ep-admin-dropzone-inner">
                  <div className="ep-admin-drop-icon">＋</div>
                  <div className="ep-admin-drop-text">
                    Drag &amp; drop or click to browse.
                  </div>
                  <div className="ep-admin-drop-hint">
                    Upload one 10-minute episode file (MP4, MOV, etc).
                  </div>
                  {videoFile && (
                    <div className="ep-admin-drop-file">
                      Selected: <strong>{videoFile.name}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Episode details */}
            <form onSubmit={handleSave} className="ep-admin-form">
              <div className="ep-admin-section">
                <h3 className="ep-admin-section-title">Episode details</h3>
                <div className="ep-admin-grid-2">
                  <label className="ep-admin-field">
                    <span>Episode title</span>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) =>
                        updateFormField("title", e.target.value)
                      }
                      required
                    />
                  </label>
                  <label className="ep-admin-field">
                    <span>Show</span>
                    <input
                      type="text"
                      value={form.showId}
                      onChange={(e) =>
                        updateFormField("showId", e.target.value)
                      }
                      placeholder="Styling Adventures"
                    />
                  </label>
                  <label className="ep-admin-field">
                    <span>Season</span>
                    <input
                      type="number"
                      min="1"
                      value={form.season}
                      onChange={(e) =>
                        updateFormField("season", e.target.value)
                      }
                    />
                  </label>
                  <label className="ep-admin-field">
                    <span>Episode #</span>
                    <input
                      type="number"
                      min="1"
                      value={form.episodeNumber}
                      onChange={(e) =>
                        updateFormField("episodeNumber", e.target.value)
                      }
                    />
                  </label>
                </div>

                <label className="ep-admin-field">
                  <span>Short description</span>
                  <input
                    type="text"
                    value={form.shortDescription}
                    onChange={(e) =>
                      updateFormField("shortDescription", e.target.value)
                    }
                    placeholder="Used on preview cards"
                  />
                </label>

                <label className="ep-admin-field">
                  <span>Full description</span>
                  <textarea
                    rows={3}
                    value={form.fullDescription}
                    onChange={(e) =>
                      updateFormField("fullDescription", e.target.value)
                    }
                  />
                </label>
              </div>

              {/* Status, scheduling, coins, chat */}
              <div className="ep-admin-section">
                <h3 className="ep-admin-section-title">Publish & economy</h3>
                <div className="ep-admin-grid-3">
                  <label className="ep-admin-field">
                    <span>Status</span>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        updateFormField("status", e.target.value)
                      }
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="ep-admin-field">
                    <span>Publish at</span>
                    <input
                      type="datetime-local"
                      value={form.publicAt}
                      onChange={(e) =>
                        updateFormField("publicAt", e.target.value)
                      }
                    />
                  </label>

                  <label className="ep-admin-field">
                    <span>Duration (seconds)</span>
                    <input
                      type="number"
                      min="0"
                      value={form.durationSeconds}
                      onChange={(e) =>
                        updateFormField("durationSeconds", e.target.value)
                      }
                    />
                  </label>
                </div>

                <div className="ep-admin-grid-3">
                  <label className="ep-admin-field">
                    <span>Coins required to unlock</span>
                    <input
                      type="number"
                      min="0"
                      value={form.unlockCoinCost}
                      onChange={(e) =>
                        updateFormField("unlockCoinCost", e.target.value)
                      }
                      placeholder="0 = free"
                    />
                  </label>

                  <label className="ep-admin-field ep-admin-field--checkbox">
                    <input
                      type="checkbox"
                      checked={!!form.chatEnabled}
                      onChange={(e) =>
                        updateFormField("chatEnabled", e.target.checked)
                      }
                    />
                    <span>Episode chat enabled</span>
                  </label>
                </div>
              </div>

              {/* Thumbnails (sketch, you can plug your upload component here) */}
              <div className="ep-admin-section">
                <h3 className="ep-admin-section-title">Thumbnails</h3>
                <p className="ep-admin-section-hint">
                  Add up to 3 thumbnails. Mark one as primary.
                </p>
                <div className="ep-admin-thumbs">
                  {form.thumbnails?.map((t, idx) => (
                    <div key={t.key || idx} className="ep-admin-thumb-card">
                      <div className="ep-admin-thumb-label">
                        {t.key}
                      </div>
                      <div className="ep-admin-thumb-actions">
                        <button
                          type="button"
                          className={
                            "ep-admin-chip" +
                            (t.primary ? " ep-admin-chip--active" : "")
                          }
                          onClick={() => {
                            setForm((f) => ({
                              ...f,
                              thumbnails: (f.thumbnails || []).map((x) => ({
                                ...x,
                                primary: x.key === t.key,
                              })),
                            }));
                          }}
                        >
                          {t.primary ? "Primary" : "Set primary"}
                        </button>
                        <button
                          type="button"
                          className="ep-admin-chip"
                          onClick={() => {
                            setForm((f) => ({
                              ...f,
                              thumbnails: (f.thumbnails || []).filter(
                                (x) => x.key !== t.key
                              ),
                            }));
                          }}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ep-admin-actions">
                <button
                  type="submit"
                  className="ep-admin-save-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving…"
                    : form.id
                    ? "Update episode"
                    : "Create episode"}
                </button>
              </div>
            </form>
          </section>

          {/* RIGHT: dashboard + economy hints */}
          <div className="admin-episodes-rightColumn">
            <section className="ep-admin-card">
              <h2 className="ep-admin-card-title">Episode dashboard</h2>
              <p className="ep-admin-card-sub">
                Switch between draft, scheduled, and published episodes, then
                preview what fans will see.
              </p>

              {/* Filters */}
              <div className="ep-admin-toolbar">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All statuses</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Search titles…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button
                  type="button"
                  className="ep-admin-toolbar-btn"
                  onClick={() => window.location.reload()}
                >
                  Refresh
                </button>
              </div>

              {/* List */}
              <div className="ep-admin-list">
                {loadingList && (
                  <div className="ep-admin-empty">Loading episodes…</div>
                )}
                {!loadingList && !filteredEpisodes.length && (
                  <div className="ep-admin-empty">No episodes yet.</div>
                )}

                {filteredEpisodes.map((ep) => (
                  <button
                    key={ep.id}
                    type="button"
                    className="ep-admin-episode-card"
                    onClick={() => handleSelectEpisode(ep)}
                  >
                    <div className="ep-admin-episode-thumb" />
                    <div className="ep-admin-episode-body">
                      <div className="ep-admin-episode-title">
                        {ep.title}
                      </div>
                      <div className="ep-admin-episode-meta">
                        <span className="ep-admin-pill-small">
                          S{ep.season || "1"} · E
                          {ep.episodeNumber || "?"}
                        </span>
                        <span className="ep-admin-pill-small">
                          {ep.status}
                        </span>
                        {typeof ep.unlockCoinCost === "number" && (
                          <span className="ep-admin-pill-small">
                            {ep.unlockCoinCost} coins
                          </span>
                        )}
                      </div>
                      <div className="ep-admin-episode-meta2">
                        <span>
                          Public:{" "}
                          {ep.publicAt
                            ? new Date(ep.publicAt).toLocaleString()
                            : "—"}
                        </span>
                        {ep.chatEnabled && (
                          <span className="ep-admin-chip ep-admin-chip--chat">
                            Chat on
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <EpisodeEconomyHintsCard />
          </div>
        </div>
      </main>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.ep-admin-page {
  display:flex;
  flex-direction:column;
  gap:16px;
}

/* Hero */
.ep-admin-hero {
  border-radius:22px;
  padding:14px 18px;
  background:
    radial-gradient(circle at top left,#ffe7f6,#fff5fb 35%,transparent 70%),
    radial-gradient(circle at bottom right,#f3e8ff,#eef2ff 35%,transparent 75%),
    linear-gradient(135deg,#6366f1,#ec4899);
  box-shadow:0 18px 40px rgba(129,140,248,0.45);
  color:#0f172a;
}
.ep-admin-hero-inner {
  max-width:1120px;
  margin:0 auto;
  display:flex;
  justify-content:space-between;
  gap:16px;
  flex-wrap:wrap;
}
.ep-admin-hero-left {
  max-width:560px;
}
.ep-admin-pill {
  display:inline-flex;
  padding:4px 10px;
  border-radius:999px;
  background:rgba(255,255,255,0.92);
  border:1px solid rgba(216,180,254,0.9);
  font-size:11px;
  letter-spacing:0.14em;
  text-transform:uppercase;
}
.ep-admin-title {
  margin:4px 0;
  font-size:1.7rem;
  letter-spacing:-0.03em;
  color:#0f172a;
}
.ep-admin-sub {
  margin:0;
  font-size:0.92rem;
  color:#374151;
}
.ep-admin-hero-right {
  display:flex;
  align-items:flex-start;
  gap:10px;
  flex-wrap:wrap;
}
.ep-admin-stat {
  padding:8px 10px;
  border-radius:14px;
  background:rgba(255,255,255,0.94);
  border:1px solid rgba(216,180,254,0.9);
  min-width:90px;
}
.ep-admin-stat-label {
  display:block;
  font-size:11px;
  text-transform:uppercase;
  letter-spacing:0.12em;
  color:#6b7280;
}
.ep-admin-stat-value {
  display:block;
  font-size:1.1rem;
  font-weight:700;
  color:#111827;
}
.ep-admin-hero-btn {
  border-radius:999px;
  border:none;
  padding:8px 14px;
  font-size:0.9rem;
  font-weight:600;
  cursor:pointer;
  background:linear-gradient(135deg,#ec4899,#a855f7);
  color:#ffffff;
  box-shadow:0 10px 22px rgba(236,72,153,0.45);
}

/* Main layout */
.ep-admin-main {
  max-width:1120px;
  margin:0 auto 32px;
}
.ep-admin-notice {
  padding:10px 12px;
  border-radius:10px;
  margin-bottom:10px;
  font-size:0.9rem;
}
.ep-admin-notice--error {
  border:1px solid #fecaca;
  background:#fef2f2;
  color:#7f1d1d;
}

.ep-admin-grid {
  margin-top:12px;
  display:grid;
  grid-template-columns:minmax(0, 1.4fr) minmax(0, 1.2fr);
  gap:16px;
}
@media (max-width: 960px) {
  .ep-admin-grid {
    grid-template-columns:minmax(0,1fr);
  }
}

.ep-admin-card {
  background:#ffffff;
  border-radius:20px;
  border:1px solid #e5e7eb;
  box-shadow:0 16px 40px rgba(148,163,184,0.25);
  padding:14px 16px 16px;
}
.ep-admin-card-title {
  margin:0 0 4px;
  font-size:1.1rem;
  font-weight:600;
}
.ep-admin-card-sub {
  margin:0 0 10px;
  font-size:0.88rem;
  color:#6b7280;
}

/* Sections / form */
.ep-admin-section {
  margin-top:10px;
  padding-top:10px;
  border-top:1px dashed #e5e7eb;
}
.ep-admin-section:first-of-type {
  border-top:none;
  padding-top:0;
}
.ep-admin-section-title {
  margin:0 0 6px;
  font-size:0.95rem;
  font-weight:600;
}
.ep-admin-section-hint {
  margin:0 0 6px;
  font-size:0.8rem;
  color:#9ca3af;
}

.ep-admin-form {
  display:flex;
  flex-direction:column;
  gap:8px;
}

.ep-admin-grid-2 {
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:8px;
}
.ep-admin-grid-3 {
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:8px;
}
@media (max-width: 720px) {
  .ep-admin-grid-2,
  .ep-admin-grid-3 {
    grid-template-columns:minmax(0,1fr);
  }
}

.ep-admin-field {
  display:flex;
  flex-direction:column;
  gap:3px;
  font-size:0.85rem;
}
.ep-admin-field span {
  color:#4b5563;
  font-weight:500;
}
.ep-admin-field input,
.ep-admin-field select,
.ep-admin-field textarea {
  border-radius:10px;
  border:1px solid #e5e7eb;
  padding:6px 9px;
  font-size:0.9rem;
  font-family:inherit;
}
.ep-admin-field textarea {
  resize:vertical;
}
.ep-admin-field input:focus,
.ep-admin-field select:focus,
.ep-admin-field textarea:focus {
  outline:none;
  border-color:#a855f7;
  box-shadow:0 0 0 1px rgba(168,85,247,0.25);
}

.ep-admin-field--checkbox {
  flex-direction:row;
  align-items:center;
  gap:8px;
}
.ep-admin-field--checkbox span {
  font-weight:500;
}

/* Dropzone */
.ep-admin-dropzone {
  border-radius:16px;
  border:1px dashed #e5e7eb;
  background:#f9fafb;
  padding:10px;
  position:relative;
}
.ep-admin-dropzone input[type="file"] {
  position:absolute;
  inset:0;
  opacity:0;
  cursor:pointer;
}
.ep-admin-dropzone-inner {
  text-align:center;
  font-size:0.85rem;
  color:#4b5563;
}
.ep-admin-drop-icon {
  font-size:1.6rem;
}
.ep-admin-drop-hint {
  font-size:0.8rem;
  color:#9ca3af;
}
.ep-admin-drop-file {
  margin-top:6px;
  font-size:0.8rem;
}

/* Thumbnails */
.ep-admin-thumbs {
  display:flex;
  flex-direction:column;
  gap:6px;
}
.ep-admin-thumb-card {
  border-radius:12px;
  border:1px solid #e5e7eb;
  padding:6px 8px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:8px;
  font-size:0.8rem;
}
.ep-admin-thumb-label {
  flex:1;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.ep-admin-thumb-actions {
  display:flex;
  gap:6px;
}

/* Chips / actions */
.ep-admin-chip {
  border-radius:999px;
  border:1px solid #e5e7eb;
  background:#f9fafb;
  padding:3px 8px;
  font-size:0.76rem;
  cursor:pointer;
}
.ep-admin-chip--active {
  border-color:#a855f7;
  background:#fdf2ff;
  color:#6b21a8;
}
.ep-admin-chip--chat {
  border-color:#22c55e;
  background:#ecfdf5;
  color:#15803d;
}

.ep-admin-actions {
  margin-top:10px;
}
.ep-admin-save-btn {
  border-radius:999px;
  border:none;
  padding:8px 16px;
  font-size:0.9rem;
  font-weight:600;
  cursor:pointer;
  background:linear-gradient(135deg,#ec4899,#a855f7);
  color:#ffffff;
  box-shadow:0 8px 20px rgba(236,72,153,0.45);
}

/* Dashboard list */
.ep-admin-toolbar {
  display:flex;
  gap:8px;
  margin:8px 0 10px;
  flex-wrap:wrap;
}
.ep-admin-toolbar select,
.ep-admin-toolbar input {
  border-radius:999px;
  border:1px solid #e5e7eb;
  padding:6px 10px;
  font-size:0.85rem;
}
.ep-admin-toolbar input {
  min-width:160px;
}
.ep-admin-toolbar-btn {
  border-radius:999px;
  border:1px solid #e5e7eb;
  padding:6px 12px;
  font-size:0.85rem;
  background:#ffffff;
  cursor:pointer;
}

.ep-admin-list {
  display:flex;
  flex-direction:column;
  gap:6px;
  max-height:520px;
  overflow:auto;
}
.ep-admin-empty {
  font-size:0.85rem;
  color:#9ca3af;
  padding:6px 0;
}

.ep-admin-episode-card {
  display:grid;
  grid-template-columns:84px minmax(0,1fr);
  gap:8px;
  align-items:stretch;
  padding:6px 8px;
  border-radius:14px;
  border:1px solid #e5e7eb;
  background:#f9fafb;
  cursor:pointer;
  text-align:left;
  transition:background 140ms ease, border-color 140ms ease, transform 40ms ease;
}
.ep-admin-episode-card:hover {
  background:#f3e8ff;
  border-color:#ddd6fe;
  transform:translateY(-1px);
}
.ep-admin-episode-thumb {
  border-radius:10px;
  background:linear-gradient(135deg,#e0e7ff,#fbcfe8);
}
.ep-admin-episode-body {
  display:flex;
  flex-direction:column;
  gap:2px;
}
.ep-admin-episode-title {
  font-size:0.9rem;
  font-weight:600;
}
.ep-admin-episode-meta,
.ep-admin-episode-meta2 {
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  font-size:0.78rem;
  color:#4b5563;
}
.ep-admin-pill-small {
  border-radius:999px;
  padding:2px 8px;
  border:1px solid #e5e7eb;
  background:#ffffff;
}

/* Right column wrapper */
.admin-episodes-rightColumn {
  display:flex;
  flex-direction:column;
  gap:12px;
}

/* Economy hints card styles */
.fan-rules-list {
  margin:6px 0;
  padding-left:18px;
  font-size:0.82rem;
  color:#4b5563;
}
.ep-admin-economy-loading {
  font-size:0.82rem;
  color:#6b7280;
}
.ep-admin-economy-error {
  font-size:0.82rem;
  color:#b91c1c;
}
.ep-admin-economy-subtitle {
  margin:6px 0 2px;
  font-size:0.82rem;
  font-weight:600;
  color:#111827;
}
.ep-admin-economy-footnote {
  margin-top:6px;
  font-size:0.78rem;
  color:#9ca3af;
}

/* Responsive tweaks */
@media (max-width: 960px) {
  .admin-episodes-rightColumn {
    gap:10px;
  }
}
`;

