// site/src/routes/admin/AdminGameRules.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const CATEGORY_LABELS = {
  WATCH_TIME: "Watch time",
  CHAT: "Chat",
  TRIVIA: "Trivia / Games",
  STREAK: "Streaks",
  SOCIAL: "Social / Shares",
  EVENT: "Events",
  REDEMPTION: "Redemptions",
};

const AI_SUGGESTED_RULES = [
  {
    id: "ai-watch-premiere",
    category: "WATCH_TIME",
    label: "Premiere watch party bonus",
    description:
      "Earn extra coins for watching during a live episode premiere window.",
    coins: 2,
    per: "PER_PREMIERE",
    maxPerDay: 1,
    meta: '{"windowMinutes":30}',
  },
  {
    id: "ai-chat-first-10",
    category: "CHAT",
    label: "Early chat squad",
    description:
      "First 10 meaningful messages in chat get a small bonus during streams.",
    coins: 1,
    per: "PER_EARLY_MESSAGE",
    maxPerDay: 3,
    meta: '{"firstN":10}',
  },
  {
    id: "ai-outfit-challenge",
    category: "TRIVIA",
    label: "Outfit challenge complete",
    description:
      "Earn coins for styling an outfit inspired by the latest episode and submitting it.",
    coins: 3,
    per: "PER_CHALLENGE",
    maxPerDay: 1,
    meta: '{"requiresClosetSubmission":true}',
  },
];

function emptyRule() {
  return {
    id: `rule-${Date.now()}`,
    category: "WATCH_TIME",
    label: "",
    description: "",
    coins: 0,
    per: "",
    maxPerDay: null,
    meta: "",
  };
}

export default function AdminGameRules() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [config, setConfig] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [filterCategory, setFilterCategory] = useState("ALL");

  // ------------- load config -------------
  useEffect(() => {
    let alive = true;

    async function loadConfig() {
      try {
        setError("");
        setLoading(true);

        if (window.sa?.ready) {
          await window.sa.ready();
        } else if (window.getSA) {
          await window.getSA();
        }

        const r = await window.sa.graphql(
          `query GetGameEconomyConfig {
            getGameEconomyConfig {
              id
              version
              updatedAt
              updatedBy
              coinToUsdRatio
              dailyCoinCap
              weeklyCoinCap
              monthlyBonusEventsLimit
              rules {
                id
                category
                label
                description
                coins
                per
                maxPerDay
                meta
              }
            }
          }`
        );

        if (!alive) return;

        const cfg = r?.getGameEconomyConfig || null;
        if (!cfg) {
          setError("No game economy config found.");
          setConfig(null);
        } else {
          // normalize meta to string for editing
          const rules = Array.isArray(cfg.rules)
            ? cfg.rules.map((rule) => ({
                ...rule,
                meta:
                  typeof rule.meta === "string"
                    ? rule.meta
                    : rule.meta
                    ? JSON.stringify(rule.meta, null, 2)
                    : "",
              }))
            : [];

          setConfig({ ...cfg, rules });
        }
        setDirty(false);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || String(e));
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadConfig();
    return () => {
      alive = false;
    };
  }, []);

  const lastUpdatedLine = useMemo(() => {
    if (!config?.updatedAt) return "";
    const d = new Date(config.updatedAt);
    const by = config.updatedBy || "system";
    return `${d.toLocaleString()} · by ${by}`;
  }, [config]);

  function updateTopField(field, value) {
    setConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
    setDirty(true);
  }

  function updateRule(idx, patch) {
    setConfig((prev) => {
      if (!prev) return prev;
      const rules = [...(prev.rules || [])];
      rules[idx] = { ...rules[idx], ...patch };
      return { ...prev, rules };
    });
    setDirty(true);
  }

  function deleteRule(idx) {
    setConfig((prev) => {
      if (!prev) return prev;
      const rules = [...(prev.rules || [])];
      rules.splice(idx, 1);
      return { ...prev, rules };
    });
    setDirty(true);
  }

  function addRule(baseRule) {
    setConfig((prev) => {
      if (!prev) return prev;
      const rules = [...(prev.rules || [])];
      const base = baseRule || emptyRule();
      const uniqueId = `${base.id}-${Date.now()}`;
      rules.push({
        ...base,
        id: uniqueId,
      });
      return { ...prev, rules };
    });
    setDirty(true);
  }

  async function handleSave() {
    if (!config) return;
    try {
      setSaving(true);
      setError("");

      if (window.sa?.ready) {
        await window.sa.ready();
      } else if (window.getSA) {
        await window.getSA();
      }

      // Prepare input – parse numeric + meta if possible
      const input = {
        coinToUsdRatio: Number(config.coinToUsdRatio || 0) || 0,
        dailyCoinCap: Number(config.dailyCoinCap || 0) || 0,
        weeklyCoinCap: Number(config.weeklyCoinCap || 0) || 0,
        monthlyBonusEventsLimit:
          Number(config.monthlyBonusEventsLimit || 0) || 0,
        rules: (config.rules || []).map((r, idx) => {
          let metaVal = null;
          if (r.meta && typeof r.meta === "string") {
            const trimmed = r.meta.trim();
            if (trimmed) {
              try {
                metaVal = JSON.parse(trimmed);
              } catch {
                // leave as raw string if invalid JSON; AppSync AWSJSON will still accept
                metaVal = trimmed;
              }
            }
          } else if (r.meta && typeof r.meta === "object") {
            metaVal = r.meta;
          }

          return {
            id: String(r.id || "").trim() || `rule-${Date.now()}-${idx}`,
            category: String(r.category || "").trim() || "OTHER",
            label: String(r.label || "").trim(),
            description: r.description || "",
            coins: Number(r.coins || 0) | 0,
            per: r.per || "",
            maxPerDay:
              r.maxPerDay === null || r.maxPerDay === undefined
                ? null
                : Number(r.maxPerDay) | 0,
            meta: metaVal,
          };
        }),
      };

      const r = await window.sa.graphql(
        `mutation UpdateGameEconomyConfig($input: GameEconomyConfigInput!) {
          updateGameEconomyConfig(input: $input) {
            id
            version
            updatedAt
            updatedBy
            coinToUsdRatio
            dailyCoinCap
            weeklyCoinCap
            monthlyBonusEventsLimit
            rules {
              id
              category
              label
              description
              coins
              per
              maxPerDay
              meta
            }
          }
        }`,
        { input }
      );

      const next = r?.updateGameEconomyConfig;
      if (next) {
        const rules = Array.isArray(next.rules)
          ? next.rules.map((rule) => ({
              ...rule,
              meta:
                typeof rule.meta === "string"
                  ? rule.meta
                  : rule.meta
                  ? JSON.stringify(rule.meta, null, 2)
                  : "",
            }))
          : [];

        setConfig({ ...next, rules });
        setDirty(false);
      }
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleDownloadJson() {
    if (!config) return;
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "game-economy-config.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const filteredRules = useMemo(() => {
    if (!config?.rules) return [];
    if (filterCategory === "ALL") return config.rules;
    return config.rules.filter(
      (r) => String(r.category || "").toUpperCase() === filterCategory
    );
  }, [config, filterCategory]);

  // ---------------- RENDER ----------------

  return (
    <div className="rules-page">
      {/* HERO */}
      <header className="rules-hero">
        <div className="rules-hero-inner">
          <div className="rules-hero-top">
            <div className="rules-hero-left">
              <div className="rules-hero-pill">Admin · Game economy</div>
              <h1 className="rules-hero-title">Admin Game Rules Studio</h1>
              <p className="rules-hero-sub">
                View, edit, and print the full game economy rules. These
                settings power watch rewards, chat bonuses, streaks, and
                redemptions across the app.
              </p>
              <div className="rules-hero-links">
                <Link to="/admin" className="rules-link">
                  ← Back to Admin home
                </Link>
                <Link to="/admin/episodes" className="rules-link">
                  Go to Episode Studio →
                </Link>
                <Link
                  to="/fan/rules"
                  className="rules-link"
                  target="_blank"
                  rel="noreferrer"
                >
                  View fan-facing rules →
                </Link>
              </div>
            </div>

            <div className="rules-hero-right">
              <div className="rules-hero-card">
                <div className="rules-hero-statLabel">Config version</div>
                <div className="rules-hero-statValue">
                  {config?.version ?? "–"}
                </div>
                <div className="rules-hero-meta">
                  {lastUpdatedLine || "Not saved yet"}
                </div>
                <div className="rules-hero-actions">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={handlePrint}
                  >
                    Print rules
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={handleDownloadJson}
                  >
                    Download JSON
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="rules-notice rules-notice--error">{error}</div>
          )}
          {loading && (
            <div className="rules-loading">Loading game economy config…</div>
          )}
        </div>
      </header>

      {/* MAIN GRID */}
      <main className="rules-main">
        <div className="rules-grid">
          {/* LEFT: knobs + rules list (editable) */}
          <section className="card rules-card">
            <h2 className="rules-section-title">Economy settings</h2>
            <p className="rules-section-sub">
              Top-level knobs for how generous the game is. These caps apply
              across all rules.
            </p>

            <div className="rules-knobs-grid">
              <label className="rules-field">
                <span className="rules-label">
                  Coin to USD ratio
                  <span className="rules-label-hint">1 coin = $X</span>
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={config?.coinToUsdRatio ?? ""}
                  onChange={(e) =>
                    updateTopField("coinToUsdRatio", e.target.value)
                  }
                />
              </label>

              <label className="rules-field">
                <span className="rules-label">
                  Daily coin cap
                  <span className="rules-label-hint">
                    Max coins a fan can earn per day.
                  </span>
                </span>
                <input
                  type="number"
                  min="0"
                  value={config?.dailyCoinCap ?? ""}
                  onChange={(e) =>
                    updateTopField("dailyCoinCap", e.target.value)
                  }
                />
              </label>

              <label className="rules-field">
                <span className="rules-label">
                  Weekly coin cap
                  <span className="rules-label-hint">
                    Max per 7 days, to prevent farming.
                  </span>
                </span>
                <input
                  type="number"
                  min="0"
                  value={config?.weeklyCoinCap ?? ""}
                  onChange={(e) =>
                    updateTopField("weeklyCoinCap", e.target.value)
                  }
                />
              </label>

              <label className="rules-field">
                <span className="rules-label">
                  Monthly bonus event limit
                  <span className="rules-label-hint">
                    How many special events (e.g., double coin day) per month.
                  </span>
                </span>
                <input
                  type="number"
                  min="0"
                  value={config?.monthlyBonusEventsLimit ?? ""}
                  onChange={(e) =>
                    updateTopField(
                      "monthlyBonusEventsLimit",
                      e.target.value
                    )
                  }
                />
              </label>
            </div>

            <div className="rules-toolbar">
              <div className="rules-filter-group">
                <span className="rules-filter-label">Filter by category</span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="ALL">All categories</option>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rules-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => addRule()}
                >
                  + Add rule
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!dirty || saving}
                  onClick={handleSave}
                >
                  {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
                </button>
              </div>
            </div>

            {/* Rules editable list */}
            <div className="rules-list">
              {filteredRules.length === 0 && !loading && (
                <div className="rules-empty">
                  No rules in this category yet. Try adding one or clear your
                  filter.
                </div>
              )}

              {filteredRules.map((rule, i) => {
                const idx =
                  (config?.rules || []).findIndex(
                    (r) => r.id === rule.id
                  ) ?? i;
                return (
                  <div key={rule.id || idx} className="rules-row">
                    <div className="rules-row-main">
                      <div className="rules-row-header">
                        <input
                          className="rules-row-labelInput"
                          placeholder="Rule label (what the admin sees)"
                          value={rule.label || ""}
                          onChange={(e) =>
                            updateRule(idx, { label: e.target.value })
                          }
                        />
                        <div className="rules-row-headerRight">
                          <select
                            value={rule.category || "OTHER"}
                            onChange={(e) =>
                              updateRule(idx, { category: e.target.value })
                            }
                          >
                            {Object.entries(CATEGORY_LABELS).map(
                              ([key, label]) => (
                                <option key={key} value={key}>
                                  {label}
                                </option>
                              )
                            )}
                            <option value="OTHER">Other</option>
                          </select>
                          <input
                            className="rules-row-coinsInput"
                            type="number"
                            step="1"
                            value={rule.coins ?? 0}
                            onChange={(e) =>
                              updateRule(idx, {
                                coins: Number(e.target.value || 0) | 0,
                              })
                            }
                          />
                          <span className="rules-row-coinsLabel">
                            coins {rule.coins < 0 ? "cost" : "reward"}
                          </span>
                        </div>
                      </div>

                      <textarea
                        className="rules-row-description"
                        placeholder="Short description / conditions (this is what you’ll print on your rules sheet)."
                        rows={2}
                        value={rule.description || ""}
                        onChange={(e) =>
                          updateRule(idx, { description: e.target.value })
                        }
                      />

                      <div className="rules-row-metaRow">
                        <label className="rules-row-metaField">
                          <span>Per</span>
                          <input
                            type="text"
                            placeholder="e.g. PER_10_MIN, PER_DAY, PER_EVENT"
                            value={rule.per || ""}
                            onChange={(e) =>
                              updateRule(idx, { per: e.target.value })
                            }
                          />
                        </label>
                        <label className="rules-row-metaField">
                          <span>Max per day</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Optional"
                            value={
                              rule.maxPerDay === null ||
                              rule.maxPerDay === undefined
                                ? ""
                                : rule.maxPerDay
                            }
                            onChange={(e) =>
                              updateRule(idx, {
                                maxPerDay:
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value || 0) | 0,
                              })
                            }
                          />
                        </label>
                      </div>

                      <details className="rules-row-advanced">
                        <summary>Advanced meta (JSON)</summary>
                        <textarea
                          className="rules-row-metaTextarea"
                          rows={3}
                          placeholder='Optional JSON. Example: {"minMinutes":10, "maxCoinsPerDay":4}'
                          value={rule.meta || ""}
                          onChange={(e) =>
                            updateRule(idx, { meta: e.target.value })
                          }
                        />
                      </details>
                    </div>

                    <div className="rules-row-footer">
                      <span className="rules-row-id">
                        ID: <code>{rule.id}</code>
                      </span>
                      <button
                        type="button"
                        className="rules-row-delete"
                        onClick={() => deleteRule(idx)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* RIGHT: AI-style suggestions / printable preview hint */}
          <section className="card rules-side-card">
            <h2 className="rules-section-title">“AI-style” rule ideas</h2>
            <p className="rules-section-sub">
              These are sample ideas you can click to add to your config, then
              tweak the wording and values. They won&apos;t do anything until
              you hit <strong>Save changes</strong>.
            </p>

            <div className="rules-ai-list">
              {AI_SUGGESTED_RULES.map((s) => (
                <article key={s.id} className="rules-ai-card">
                  <div className="rules-ai-labelRow">
                    <div className="rules-ai-title">{s.label}</div>
                    <span className="rules-ai-chip">
                      {CATEGORY_LABELS[s.category] || s.category}
                    </span>
                  </div>
                  <p className="rules-ai-text">{s.description}</p>
                  <div className="rules-ai-metaRow">
                    <span className="rules-ai-meta">
                      {s.coins} coin{Math.abs(s.coins) === 1 ? "" : "s"}{" "}
                      {s.coins < 0 ? "cost" : "reward"}
                    </span>
                    {s.per && (
                      <span className="rules-ai-meta">Per: {s.per}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost rules-ai-btn"
                    onClick={() => addRule(s)}
                  >
                    Add this rule
                  </button>
                </article>
              ))}
            </div>

            <div className="rules-print-hint">
              <h3 className="rules-print-title">Printable rules view</h3>
              <p className="rules-print-text">
                When you&apos;re happy with your setup, use{" "}
                <strong>Print rules</strong> to generate a binder-friendly
                sheet. Your browser&apos;s print dialog will let you save it as
                a PDF or send it to a physical printer.
              </p>
            </div>
          </section>
        </div>
      </main>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.rules-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* HERO ----------------------------------------------------- */

.rules-hero {
  border-radius: 24px;
  padding: 16px 18px;
  background:
    radial-gradient(circle at top left, #ffe7f6 0, #fff5fb 35%, transparent 70%),
    radial-gradient(circle at bottom right, #e0f2fe 0, #eef2ff 40%, transparent 75%),
    linear-gradient(135deg, #a855f7, #ec4899);
  border: 1px solid rgba(244, 184, 255, 0.9);
  box-shadow: 0 18px 40px rgba(129, 140, 248, 0.4);
  color: #0f172a;
}

.rules-hero-inner {
  max-width: 1120px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rules-hero-top {
  display: grid;
  grid-template-columns: minmax(0, 2.3fr) minmax(0, 1.6fr);
  gap: 16px;
  align-items: stretch;
}
@media (max-width: 900px) {
  .rules-hero-top {
    grid-template-columns: minmax(0,1fr);
  }
}

.rules-hero-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rules-hero-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.96);
  border: 1px solid rgba(244, 184, 255, 0.9);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #6b21a8;
}

.rules-hero-title {
  margin: 0;
  font-size: 1.7rem;
  letter-spacing: -0.03em;
  background: linear-gradient(90deg, #4c1d95, #ec4899);
  -webkit-background-clip: text;
  color: transparent;
}

.rules-hero-sub {
  margin: 0;
  font-size: 0.95rem;
  color: #374151;
}

.rules-hero-links {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.rules-link {
  font-size: 0.85rem;
  color: #4c1d95;
  text-decoration: none;
}
.rules-link:hover {
  text-decoration: underline;
}

.rules-hero-right {
  display: flex;
  justify-content: flex-end;
}

.rules-hero-card {
  background: rgba(255,255,255,0.96);
  border-radius: 18px;
  border: 1px solid rgba(233, 213, 255, 0.95);
  padding: 12px 14px 14px;
  box-shadow: 0 14px 32px rgba(76, 29, 149, 0.35);
  min-width: 230px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rules-hero-statLabel {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #6b7280;
}

.rules-hero-statValue {
  font-size: 1.6rem;
  font-weight: 800;
  color: #111827;
}

.rules-hero-meta {
  font-size: 0.8rem;
  color: #6b7280;
}

.rules-hero-actions {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* notices */

.rules-notice {
  margin-top: 6px;
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 0.9rem;
}
.rules-notice--error {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #7f1d1d;
}

.rules-loading {
  margin-top: 4px;
  font-size: 0.9rem;
  color: #111827;
}

/* MAIN ----------------------------------------------------- */

.rules-main {
  max-width: 1120px;
  margin: 10px auto 28px;
}

.rules-grid {
  display: grid;
  grid-template-columns: minmax(0, 2.2fr) minmax(0, 1.6fr);
  gap: 16px;
}
@media (max-width: 960px) {
  .rules-grid {
    grid-template-columns: minmax(0,1fr);
  }
}

.card {
  background: #ffffff;
  border-radius: 20px;
  padding: 14px 16px 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 14px 32px rgba(148, 163, 184, 0.2);
}

.rules-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rules-section-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.rules-section-sub {
  margin: 2px 0 0;
  font-size: 0.9rem;
  color: #6b7280;
}

/* knobs ---------------------------------------------------- */

.rules-knobs-grid {
  margin-top: 6px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0,1fr));
  gap: 10px;
}
@media (max-width: 640px) {
  .rules-knobs-grid {
    grid-template-columns: minmax(0,1fr);
  }
}

.rules-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
}

.rules-label {
  font-weight: 600;
  color: #111827;
  display: flex;
  flex-direction: column;
}
.rules-label-hint {
  font-weight: 400;
  font-size: 0.8rem;
  color: #9ca3af;
}

.rules-field input {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  padding: 6px 8px;
  font-size: 0.9rem;
}
.rules-field input:focus {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 0 1px rgba(168, 85, 247, 0.3);
}

/* toolbar -------------------------------------------------- */

.rules-toolbar {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.rules-filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
}
.rules-filter-label {
  color: #6b7280;
}

.rules-filter-group select {
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  padding: 4px 10px;
  font-size: 0.85rem;
}

.rules-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* rules list ----------------------------------------------- */

.rules-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rules-empty {
  padding: 10px;
  border-radius: 12px;
  background: #f9fafb;
  border: 1px dashed #e5e7eb;
  font-size: 0.9rem;
  color: #6b7280;
}

.rules-row {
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 8px 9px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rules-row-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rules-row-header {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.rules-row-labelInput {
  flex: 1;
  min-width: 140px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  padding: 5px 9px;
  font-size: 0.9rem;
}
.rules-row-labelInput:focus {
  outline: none;
  border-color: #a855f7;
}

.rules-row-headerRight {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rules-row-headerRight select {
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  padding: 4px 9px;
  font-size: 0.8rem;
}

.rules-row-coinsInput {
  width: 70px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  padding: 4px 7px;
  font-size: 0.85rem;
}
.rules-row-coinsLabel {
  font-size: 0.8rem;
  color: #6b7280;
}

.rules-row-description {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  padding: 6px 8px;
  font-size: 0.85rem;
  resize: vertical;
}
.rules-row-description:focus {
  outline: none;
  border-color: #a855f7;
}

.rules-row-metaRow {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.rules-row-metaField {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.78rem;
  color: #6b7280;
  min-width: 130px;
}
.rules-row-metaField input {
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  padding: 4px 8px;
  font-size: 0.8rem;
}
.rules-row-metaField input:focus {
  outline: none;
  border-color: #a855f7;
}

/* advanced meta */

.rules-row-advanced {
  font-size: 0.78rem;
}
.rules-row-advanced summary {
  cursor: pointer;
  color: #6b21a8;
}
.rules-row-advanced[open] summary {
  margin-bottom: 4px;
}
.rules-row-metaTextarea {
  width: 100%;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 6px 8px;
  font-size: 0.8rem;
  resize: vertical;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
}
.rules-row-metaTextarea:focus {
  outline: none;
  border-color: #a855f7;
}

.rules-row-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: #9ca3af;
}
.rules-row-id code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
}
.rules-row-delete {
  border: none;
  background: transparent;
  color: #b91c1c;
  font-size: 0.8rem;
  cursor: pointer;
}
.rules-row-delete:hover {
  text-decoration: underline;
}

/* side card: AI suggestions -------------------------------- */

.rules-side-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rules-ai-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rules-ai-card {
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 8px 9px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rules-ai-labelRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.rules-ai-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
}

.rules-ai-chip {
  font-size: 0.72rem;
  padding: 3px 8px;
  border-radius: 999px;
  background: #f5f3ff;
  border: 1px solid #e9d5ff;
  color: #6d28d9;
}

.rules-ai-text {
  margin: 0;
  font-size: 0.82rem;
  color: #4b5563;
}

.rules-ai-metaRow {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 0.78rem;
  color: #6b7280;
}

.rules-ai-btn {
  margin-top: 4px;
  width: 100%;
  justify-content: center;
}

/* print hint */

.rules-print-hint {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed #e5e7eb;
}

.rules-print-title {
  margin: 0 0 4px;
  font-size: 0.95rem;
  font-weight: 600;
}

.rules-print-text {
  margin: 0;
  font-size: 0.84rem;
  color: #6b7280;
}

/* buttons shared with other admin UIs ---------------------- */

.btn {
  appearance: none;
  border-radius: 999px;
  padding: 7px 14px;
  min-height: 34px;
  border: 1px solid rgba(244, 184, 255, 0.9);
  background: #ffffff;
  color: #4b5563;
  cursor: pointer;
  transition:
    transform 40ms ease,
    background 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease,
    color 140ms ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.86rem;
  font-weight: 500;
}

.btn:hover {
  background: #fff5fb;
  border-color: rgba(249, 168, 212, 0.9);
  box-shadow: 0 4px 12px rgba(248, 113, 170, 0.25);
}

.btn:active {
  transform: translateY(1px);
  box-shadow: 0 3px 10px rgba(248, 113, 170, 0.3);
}

.btn[disabled],
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.btn-primary {
  background: linear-gradient(
    135deg,
    var(--sa-pink-hot, #ff4fa3),
    var(--sa-purple, #a855f7)
  );
  border-color: transparent;
  color: #ffffff;
  box-shadow: 0 8px 20px rgba(236, 72, 153, 0.45);
}

.btn-primary:hover {
  filter: brightness(1.05);
  box-shadow: 0 10px 22px rgba(236, 72, 153, 0.5);
}

.btn-ghost {
  background: rgba(255, 255, 255, 0.96);
  border-color: rgba(244, 184, 255, 0.9);
  color: #9d174d;
}

.btn-ghost:hover {
  background: #fff5fb;
  border-color: rgba(249, 168, 212, 1);
}

/* PRINT STYLES --------------------------------------------- */

@media print {
  body {
    background: #ffffff;
  }
  .rules-hero,
  .rules-side-card,
  .rules-ai-card {
    box-shadow: none !important;
  }
  .rules-hero,
  .card {
    border-color: #d1d5db;
  }
  .rules-hero-actions,
  .rules-hero-links,
  .rules-toolbar,
  .rules-ai-btn {
    display: none !important;
  }
}
`;
