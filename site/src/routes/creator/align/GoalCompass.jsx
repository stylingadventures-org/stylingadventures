// site/src/routes/creator/align/LalaGoalCompass.jsx
import React, { useEffect, useState, useMemo } from "react";
import { runGraphQL } from "../../../api/runGraphQL";

const CREATOR_GOAL_COMPASS_QUERY = `
  query CreatorGoalCompass {
    creatorGoalCompass {
      primaryGoal
      timeHorizon
      weeklyCapacity
      focusAreas
      riskTolerance
      notes
      updatedAt
    }
  }
`;

const UPDATE_CREATOR_GOAL_COMPASS_MUTATION = `
  mutation UpdateCreatorGoalCompass($input: CreatorGoalCompassInput!) {
    updateCreatorGoalCompass(input: $input) {
      primaryGoal
      timeHorizon
      weeklyCapacity
      focusAreas
      riskTolerance
      notes
      updatedAt
    }
  }
`;

const GOAL_OPTIONS = [
  {
    value: "GROWTH",
    label: "Growth / reach",
    tagline: "Short, hooky content that finds new people.",
  },
  {
    value: "TRUST",
    label: "Trust & nurture",
    tagline: "Slower, deeper content that bonds with your audience.",
  },
  {
    value: "AUTHORITY",
    label: "Authority content",
    tagline: "Proof, frameworks, and teaching that make you the go-to.",
  },
  {
    value: "CONVERSION",
    label: "Conversion / sales",
    tagline: "Launches, offers, and CTAs that move people to act.",
  },
];

const HORIZON_OPTIONS = [
  { value: "30_DAYS", label: "30 days (experiment sprint)" },
  { value: "90_DAYS", label: "90 days (quarter focus)" },
  { value: "180_DAYS", label: "6 months (seasonal arc)" },
];

const FOCUS_AREAS = [
  {
    value: "PERSONALITY",
    label: "Personality hooks",
    description: "Let your actual personality carry more of the content.",
  },
  {
    value: "NURTURE",
    label: "Nurture",
    description: "Behind-the-scenes, stories, and relatable slices of life.",
  },
  {
    value: "AUTHORITY_PROOF",
    label: "Authority & proof",
    description: "Case studies, frameworks, and results.",
  },
  {
    value: "EXPERIMENTS",
    label: "Experiments",
    description: "Trying new formats, platforms, or series ideas.",
  },
];

const RISK_OPTIONS = [
  { value: "LOW", label: "Low", caption: "Slow & steady; protect energy." },
  {
    value: "MEDIUM",
    label: "Medium",
    caption: "Balanced; stretch yourself without burning out.",
  },
  {
    value: "HIGH",
    label: "High",
    caption: "Go big, ship often, learn fast.",
  },
];

const DEFAULT_FORM = {
  primaryGoal: "GROWTH",
  timeHorizon: "90_DAYS",
  weeklyCapacity: 5,
  focusAreas: ["PERSONALITY", "NURTURE"],
  riskTolerance: "MEDIUM",
  notes: "",
};

function toFormState(apiCompass) {
  if (!apiCompass) return { ...DEFAULT_FORM };

  return {
    primaryGoal: apiCompass.primaryGoal || DEFAULT_FORM.primaryGoal,
    timeHorizon: apiCompass.timeHorizon || DEFAULT_FORM.timeHorizon,
    weeklyCapacity:
      typeof apiCompass.weeklyCapacity === "number"
        ? apiCompass.weeklyCapacity
        : DEFAULT_FORM.weeklyCapacity,
    focusAreas:
      Array.isArray(apiCompass.focusAreas) && apiCompass.focusAreas.length
        ? apiCompass.focusAreas
        : DEFAULT_FORM.focusAreas,
    riskTolerance:
      apiCompass.riskTolerance || DEFAULT_FORM.riskTolerance,
    notes: apiCompass.notes || "",
  };
}

function humanizeGoal(value) {
  const opt = GOAL_OPTIONS.find((g) => g.value === value);
  return opt ? opt.label : value || "";
}

export default function LalaGoalCompass() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [rawCompass, setRawCompass] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    let cancelled = false;

    async function fetchCompass() {
      setLoading(true);
      setError(null);
      try {
        const res = await runGraphQL(CREATOR_GOAL_COMPASS_QUERY, {});
        const data =
          (res && res.data && res.data.creatorGoalCompass) ||
          (res && res.creatorGoalCompass) ||
          null;

        if (!cancelled) {
          setRawCompass(data);
          setForm(toFormState(data));
        }
      } catch (err) {
        console.error("Failed to load creatorGoalCompass", err);
        if (!cancelled) {
          setError("Couldn’t load your Goal Compass yet.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCompass();
    return () => {
      cancelled = true;
    };
  }, []);

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleFocusArea(value) {
    setForm((prev) => {
      const current = prev.focusAreas || [];
      if (current.includes(value)) {
        return {
          ...prev,
          focusAreas: current.filter((v) => v !== value),
        };
      }
      return { ...prev, focusAreas: [...current, value] };
    });
  }

  function applyPreset(kind) {
    // kind: "GROWTH" | "TRUST" | "AUTHORITY" | "CONVERSION"
    if (kind === "GROWTH") {
      setForm((prev) => ({
        ...prev,
        primaryGoal: "GROWTH",
        timeHorizon: "90_DAYS",
        weeklyCapacity: Math.max(prev.weeklyCapacity, 4),
        focusAreas: ["PERSONALITY", "EXPERIMENTS"],
        riskTolerance: "HIGH",
      }));
    } else if (kind === "TRUST") {
      setForm((prev) => ({
        ...prev,
        primaryGoal: "TRUST",
        timeHorizon: "180_DAYS",
        weeklyCapacity: Math.min(prev.weeklyCapacity, 4),
        focusAreas: ["NURTURE", "PERSONALITY"],
        riskTolerance: "LOW",
      }));
    } else if (kind === "AUTHORITY") {
      setForm((prev) => ({
        ...prev,
        primaryGoal: "AUTHORITY",
        timeHorizon: "90_DAYS",
        weeklyCapacity: Math.max(prev.weeklyCapacity, 3),
        focusAreas: ["AUTHORITY_PROOF", "PERSONALITY"],
        riskTolerance: "MEDIUM",
      }));
    } else if (kind === "CONVERSION") {
      setForm((prev) => ({
        ...prev,
        primaryGoal: "CONVERSION",
        timeHorizon: "30_DAYS",
        weeklyCapacity: Math.max(prev.weeklyCapacity, 3),
        focusAreas: ["AUTHORITY_PROOF", "EXPERIMENTS"],
        riskTolerance: "MEDIUM",
      }));
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveMessage("");

    try {
      const input = {
        primaryGoal: form.primaryGoal,
        timeHorizon: form.timeHorizon,
        weeklyCapacity: Number(form.weeklyCapacity) || 1,
        focusAreas: form.focusAreas || [],
        riskTolerance: form.riskTolerance,
        notes: form.notes || null,
      };

      const res = await runGraphQL(
        UPDATE_CREATOR_GOAL_COMPASS_MUTATION,
        { input },
      );

      const data =
        (res && res.data && res.data.updateCreatorGoalCompass) ||
        (res && res.updateCreatorGoalCompass) ||
        input;

      setRawCompass(data);
      setForm(toFormState(data));
      setSaveMessage("Saved to your Goal Compass.");
    } catch (err) {
      console.error("Failed to updateCreatorGoalCompass", err);
      setError("Couldn’t save your Goal Compass yet.");
    } finally {
      setSaving(false);
      if (!error) {
        setTimeout(() => setSaveMessage(""), 3500);
      }
    }
  }

  const lastUpdatedText = useMemo(() => {
    if (!rawCompass || !rawCompass.updatedAt) return null;
    try {
      const d = new Date(rawCompass.updatedAt);
      if (Number.isNaN(d.getTime())) return null;
      return d.toLocaleString();
    } catch {
      return null;
    }
  }, [rawCompass]);

  return (
    <section className="creator-page">
      <header className="creator-page__header">
        <span className="creator-page__kicker">Align · Lala Goal Compass</span>
        <h1 className="creator-page__title">Lala Goal Compass</h1>
        <p className="creator-page__subtitle">
          Set the “why” behind your content, so Director Suite and your posting
          schedule stay in sync with your actual life.
        </p>
      </header>

      <div className="creator-page__body">
        <div className="creator-page__row">
          {/* Left column – explainer / status */}
          <div className="creator-page__col">
            <div className="creator-page__card">
              <h2 className="creator-page__card-title">Your compass</h2>
              <p className="creator-page__card-subtitle">
                This is the upstream setting for Creator HQ. It informs:
              </p>
              <ul
                style={{
                  margin: "4px 0 0",
                  paddingLeft: 18,
                  fontSize: "0.85rem",
                  color: "#4B5563",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <li>
                  <strong>Director Suite</strong> scene tips and AI shot
                  suggestions.
                </li>
                <li>
                  <strong>Creator Social Pulse</strong> weekly trend briefs and
                  ideas.
                </li>
                <li>
                  <strong>Creator Social OS</strong> how many posts you’re
                  aiming for each week.
                </li>
              </ul>

              <div
                style={{
                  marginTop: 12,
                  padding: 10,
                  borderRadius: 12,
                  background: "#F3F4FF",
                  fontSize: "0.8rem",
                  color: "#4338CA",
                }}
              >
                {loading && (
                  <span>Loading your current compass settings…</span>
                )}
                {!loading && error && (
                  <span style={{ color: "#B91C1C" }}>{error}</span>
                )}
                {!loading && !error && (
                  <>
                    <div>
                      <strong>Primary mode:</strong>{" "}
                      {humanizeGoal(form.primaryGoal)}
                    </div>
                    <div style={{ marginTop: 2 }}>
                      <strong>Weekly capacity:</strong>{" "}
                      {form.weeklyCapacity} slots / week
                    </div>
                    {lastUpdatedText && (
                      <div style={{ marginTop: 2, color: "#6B7280" }}>
                        Last updated: {lastUpdatedText}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="creator-page__card" style={{ marginTop: 10 }}>
              <h2 className="creator-page__card-title">
                Quick presets (optional)
              </h2>
              <p className="creator-page__card-subtitle">
                Tap one to auto-fill the form based on where you’re at right
                now. You can always tweak after.
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 8,
                }}
              >
                {GOAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => applyPreset(opt.value)}
                    className="creator-btn creator-btn--ghost"
                    style={{
                      minWidth: 0,
                      padding: "6px 10px",
                      fontSize: "0.78rem",
                      textAlign: "left",
                      flex: "0 1 190px",
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{opt.label}</div>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "#6B7280",
                        marginTop: 2,
                      }}
                    >
                      {opt.tagline}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right column – main form */}
          <div className="creator-page__col">
            <form
              className="creator-page__card"
              onSubmit={handleSave}
            >
              <h2 className="creator-page__card-title">
                Edit Goal Compass
              </h2>
              <p className="creator-page__card-subtitle">
                Be honest about your energy and what season you’re in. The tools
                will adjust around you.
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginTop: 6,
                }}
              >
                {/* Primary goal */}
                <div>
                  <label className="creator-field-label">
                    Primary goal for this season
                  </label>
                  <select
                    className="creator-select"
                    value={form.primaryGoal}
                    onChange={(e) =>
                      setField("primaryGoal", e.target.value)
                    }
                  >
                    {GOAL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p
                    style={{
                      marginTop: 4,
                      fontSize: "0.78rem",
                      color: "#6B7280",
                    }}
                  >
                    Pick the ONE thing you care most about right now. We’ll
                    still support the others, just not equally.
                  </p>
                </div>

                {/* Time horizon + capacity */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <label className="creator-field-label">
                      Time horizon
                    </label>
                    <select
                      className="creator-select"
                      value={form.timeHorizon}
                      onChange={(e) =>
                        setField("timeHorizon", e.target.value)
                      }
                    >
                      {HORIZON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <label className="creator-field-label">
                      Realistic weekly capacity
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      className="creator-input"
                      value={form.weeklyCapacity}
                      onChange={(e) =>
                        setField(
                          "weeklyCapacity",
                          e.target.value ? Number(e.target.value) : "",
                        )
                      }
                    />
                    <p
                      style={{
                        marginTop: 4,
                        fontSize: "0.75rem",
                        color: "#6B7280",
                      }}
                    >
                      How many{" "}
                      <strong>meaningful content slots</strong> can you show
                      up for? Shorts, carousels, emails all count.
                    </p>
                  </div>
                </div>

                {/* Focus areas */}
                <div>
                  <label className="creator-field-label">
                    Focus areas (pick 2–3)
                  </label>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {FOCUS_AREAS.map((fa) => {
                      const active =
                        form.focusAreas &&
                        form.focusAreas.includes(fa.value);
                      return (
                        <button
                          key={fa.value}
                          type="button"
                          onClick={() => toggleFocusArea(fa.value)}
                          className="creator-btn creator-btn--ghost"
                          style={{
                            padding: "6px 10px",
                            fontSize: "0.78rem",
                            borderRadius: 999,
                            borderColor: active ? "#4F46E5" : "#E5E7EB",
                            background: active
                              ? "rgba(79,70,229,0.06)"
                              : "#FFFFFF",
                          }}
                        >
                          {fa.label}
                        </button>
                      );
                    })}
                  </div>
                  <p
                    style={{
                      marginTop: 6,
                      fontSize: "0.75rem",
                      color: "#6B7280",
                    }}
                  >
                    These help us decide what to emphasize in hooks, B-roll,
                    and prompts.
                  </p>
                </div>

                {/* Risk tolerance */}
                <div>
                  <label className="creator-field-label">
                    Risk tolerance
                  </label>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {RISK_OPTIONS.map((opt) => {
                      const active = form.riskTolerance === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            setField("riskTolerance", opt.value)
                          }
                          className="creator-btn creator-btn--ghost"
                          style={{
                            padding: "6px 10px",
                            fontSize: "0.78rem",
                            borderRadius: 999,
                            borderColor: active ? "#10B981" : "#E5E7EB",
                            background: active
                              ? "rgba(16,185,129,0.06)"
                              : "#FFFFFF",
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <p
                    style={{
                      marginTop: 6,
                      fontSize: "0.75rem",
                      color: "#6B7280",
                    }}
                  >
                    Higher risk means more experiments and posting volume.
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className="creator-field-label">
                    Season notes (optional)
                  </label>
                  <textarea
                    className="creator-textarea"
                    rows={4}
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                    placeholder="e.g. “Summer launch season, traveling a bit, want to nurture existing followers between drops.”"
                  />
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 6,
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: error ? "#B91C1C" : "#6B7280",
                    }}
                  >
                    {error && <span>{error}</span>}
                    {!error && saveMessage && (
                      <span style={{ color: "#059669" }}>
                        {saveMessage}
                      </span>
                    )}
                    {!error && !saveMessage && (
                      <span>
                        These settings flow into Director Suite and your
                        posting schedule.
                      </span>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="creator-btn creator-btn--primary"
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save Goal Compass"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
