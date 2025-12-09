// site/src/routes/creator/grow/SocialOS.jsx
import React, { useEffect, useMemo, useState } from "react";
import { runGraphQL } from "../../../api/runGraphQL";

const CREATOR_SCHEDULE_WEEK_QUERY = `
  query CreatorScheduleWeek($weekOf: AWSDate!) {
    creatorScheduleWeek(weekOf: $weekOf) {
      weekOf
      slots {
        id
        weekOf
        day
        timeOfDay
        platformHint
        focusHint
        status
        notes
        createdAt
        updatedAt
      }
    }
  }
`;

const UPSERT_CREATOR_SCHEDULE_SLOT_MUTATION = `
  mutation UpsertCreatorScheduleSlot($input: UpsertCreatorScheduleSlotInput!) {
    upsertCreatorScheduleSlot(input: $input) {
      id
      weekOf
      day
      timeOfDay
      platformHint
      focusHint
      status
      notes
      createdAt
      updatedAt
    }
  }
`;

const DELETE_CREATOR_SCHEDULE_SLOT_MUTATION = `
  mutation DeleteCreatorScheduleSlot($id: ID!, $weekOf: AWSDate!) {
    deleteCreatorScheduleSlot(id: $id, weekOf: $weekOf)
  }
`;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIMES = ["AM", "PM"];

function startOfWeekAwsDate(offsetWeeks = 0) {
  const d = new Date();
  const day = d.getDay(); // 0 = Sun, 1 = Mon...
  const diff = d.getDate() - ((day + 6) % 7) + offsetWeeks * 7; // Monday as start
  d.setDate(diff);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function SocialOS() {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekOf = useMemo(
    () => startOfWeekAwsDate(weekOffset),
    [weekOffset],
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [slots, setSlots] = useState([]);

  async function loadWeek(currentWeekOf) {
    setLoading(true);
    setError(null);
    try {
      const res = await runGraphQL(CREATOR_SCHEDULE_WEEK_QUERY, {
        weekOf: currentWeekOf,
      });
      const data =
        res?.data?.creatorScheduleWeek || res?.creatorScheduleWeek;
      setSlots(data?.slots || []);
    } catch (err) {
      console.error("Failed to load creatorScheduleWeek", err);
      setError("Couldn’t load your schedule yet.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWeek(weekOf);
  }, [weekOf]);

  function findSlot(day, timeOfDay) {
    return slots.find(
      (s) => s.day === day && s.timeOfDay === timeOfDay,
    );
  }

  async function toggleSlot(day, timeOfDay) {
    const existing = findSlot(day, timeOfDay);

    setSaving(true);
    setError(null);

    try {
      if (existing) {
        // Delete
        await runGraphQL(
          DELETE_CREATOR_SCHEDULE_SLOT_MUTATION,
          {
            id: existing.id,
            weekOf,
          },
        );
        setSlots((prev) =>
          prev.filter((s) => s.id !== existing.id),
        );
      } else {
        // Create with a simple default
        const input = {
          weekOf,
          day,
          timeOfDay,
          platformHint: "TikTok / Reels",
          focusHint: "Growth / reach",
          status: "PLANNED",
        };

        const res = await runGraphQL(
          UPSERT_CREATOR_SCHEDULE_SLOT_MUTATION,
          { input },
        );
        const created =
          res?.data?.upsertCreatorScheduleSlot ||
          res?.upsertCreatorScheduleSlot;

        setSlots((prev) => [...prev, created]);
      }
    } catch (err) {
      console.error("Failed to toggle schedule slot", err);
      setError("Couldn’t update this slot. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const titleWeek = useMemo(() => {
    const d = new Date(weekOf);
    const end = new Date(d);
    end.setDate(end.getDate() + 6);
    const fmt = (date) =>
      date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    return `${fmt(d)} – ${fmt(end)}`;
  }, [weekOf]);

  return (
    <section className="creator-page">
      <header className="creator-page__header">
        <span className="creator-page__kicker">
          Grow · Creator Social OS
        </span>
        <h1 className="creator-page__title">Creator Social OS</h1>
        <p className="creator-page__subtitle">
          Light social calendar tied to your Goal Compass. Plan when you’ll
          connect, teach, nurture, and sell — then let Lala keep track.
        </p>

        <div className="creator-page__header-meta">
          <span className="creator-badge">📆 Weekly posting map</span>
          <span className="creator-badge">
            ⚙️ Syncs with Lala Goal Compass
          </span>
          <span className="creator-badge">
            🔁 Feeds Director Suite & PR Studio
          </span>
        </div>
      </header>

      <div className="creator-page__body">
        <div className="creator-page__row">
          <div className="creator-page__col">
            <div className="creator-page__card">
              <h2 className="creator-page__card-title">
                Weekly rhythm
              </h2>
              <p className="creator-page__card-subtitle">
                Choose which days you want to show up. Keep it realistic so
                you can actually stick to it.
              </p>

              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  fontSize: "0.82rem",
                  color: "#4B5563",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <li>
                  Start with 3–4 slots per week if you’re in{" "}
                  <strong>Growth</strong> mode.
                </li>
                <li>
                  Make sure at least one slot is for{" "}
                  <strong>nurture / connection</strong> content.
                </li>
                <li>
                  You can always over-post — the schedule is your
                  minimum, not your ceiling.
                </li>
              </ul>
            </div>

            <div
              className="creator-page__card"
              style={{ marginTop: 10 }}
            >
              <h2 className="creator-page__card-title">
                Week selector
              </h2>
              <p className="creator-page__card-subtitle">
                Switch weeks to plan ahead or review previous posting
                rhythms.
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                  }}
                >
                  <button
                    type="button"
                    className="creator-btn creator-btn--ghost"
                    onClick={() =>
                      setWeekOffset((prev) => prev - 1)
                    }
                  >
                    ← Previous
                  </button>
                  <button
                    type="button"
                    className="creator-btn creator-btn--ghost"
                    onClick={() => setWeekOffset(0)}
                  >
                    This week
                  </button>
                  <button
                    type="button"
                    className="creator-btn creator-btn--ghost"
                    onClick={() =>
                      setWeekOffset((prev) => prev + 1)
                    }
                  >
                    Next →
                  </button>
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {titleWeek}
                </div>
              </div>

              {loading && (
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "#6B7280",
                    marginTop: 8,
                    fontStyle: "italic",
                  }}
                >
                  Loading schedule…
                </p>
              )}
              {error && (
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "#B91C1C",
                    marginTop: 8,
                  }}
                >
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* Calendar grid */}
          <div className="creator-page__col">
            <div className="creator-page__card">
              <h2 className="creator-page__card-title">
                Posting schedule
              </h2>
              <p className="creator-page__card-subtitle">
                Click a cell to toggle a posting slot. Lala will sync this
                with your Goal Compass and future PR & Content Studio.
              </p>

              <div
                style={{
                  marginTop: 8,
                  overflowX: "auto",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "separate",
                    borderSpacing: 4,
                    fontSize: "0.78rem",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          textAlign: "left",
                          padding: 4,
                          fontSize: "0.7rem",
                          color: "#9CA3AF",
                          textTransform: "uppercase",
                          letterSpacing: "0.12em",
                        }}
                      >
                        Time
                      </th>
                      {DAYS.map((day) => (
                        <th
                          key={day}
                          style={{
                            textAlign: "center",
                            padding: 4,
                            fontSize: "0.7rem",
                            color: "#6B7280",
                          }}
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIMES.map((time) => (
                      <tr key={time}>
                        <td
                          style={{
                            padding: 4,
                            fontSize: "0.7rem",
                            color: "#9CA3AF",
                            textTransform: "uppercase",
                            letterSpacing: "0.12em",
                          }}
                        >
                          {time}
                        </td>
                        {DAYS.map((day) => {
                          const slot = findSlot(day, time);
                          const active = !!slot;
                          return (
                            <td key={day}>
                              <button
                                type="button"
                                onClick={() =>
                                  toggleSlot(day, time)
                                }
                                disabled={saving}
                                className="creator-btn"
                                style={{
                                  width: "100%",
                                  justifyContent: "center",
                                  padding: "6px 4px",
                                  fontSize: "0.7rem",
                                  borderRadius: 10,
                                  borderColor: active
                                    ? "#4F46E5"
                                    : "#E5E7EB",
                                  background: active
                                    ? "linear-gradient(135deg, #EEF2FF, #DBEAFE)"
                                    : "#FFFFFF",
                                  color: active
                                    ? "#1D4ED8"
                                    : "#4B5563",
                                  boxShadow: active
                                    ? "0 6px 14px rgba(129, 140, 248, 0.25)"
                                    : "none",
                                }}
                              >
                                {active
                                  ? slot.platformHint || "Planned"
                                  : "Add"}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p
                style={{
                  marginTop: 8,
                  fontSize: "0.75rem",
                  color: "#6B7280",
                }}
              >
                Tip: keep at least one <strong>AM</strong> slot for
                connection / nurture posts and one <strong>PM</strong> slot
                for authority or conversion content.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
