import React, { useState } from "react";

const SAMPLE_EVENTS = [
  {
    date: "2025-12-23",
    title: "Holiday Party",
    outfit: "Festive Evening Look",
    mood: "Fancy",
  },
  {
    date: "2025-12-24",
    title: "Family Dinner",
    outfit: "Elegant & Comfortable",
    mood: "Classy",
  },
  {
    date: "2025-12-27",
    title: "Brunch with Friends",
    outfit: "Casual Chic",
    mood: "Relaxed",
  },
];

export default function StyleCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 11));
  const [events, setEvents] = useState(SAMPLE_EVENTS);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    outfit: "",
    mood: "Casual",
  });

  // Generate calendar days
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const getEventForDate = (day) => {
    const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      .toISOString()
      .split("T")[0];
    return events.find((e) => e.date === dateStr);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleAddEvent = () => {
    if (selectedDate && eventForm.title && eventForm.outfit) {
      const dateStr = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        selectedDate
      )
        .toISOString()
        .split("T")[0];

      const newEvent = {
        date: dateStr,
        title: eventForm.title,
        outfit: eventForm.outfit,
        mood: eventForm.mood,
      };

      const existingIndex = events.findIndex((e) => e.date === dateStr);
      if (existingIndex > -1) {
        const updated = [...events];
        updated[existingIndex] = newEvent;
        setEvents(updated);
      } else {
        setEvents([...events, newEvent]);
      }

      setEventForm({ title: "", outfit: "", mood: "Casual" });
      setSelectedDate(null);
      setShowEventModal(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>{styles.css}</style>

      {/* HERO */}
      <section style={styles.hero}>
        <div>
          <p style={styles.pill}>📅 STYLE CALENDAR</p>
          <h1 style={styles.title}>Plan Your Outfits</h1>
          <p style={styles.subtitle}>
            Assign looks to dates, avoid repeats, and be prepared for every occasion
          </p>
        </div>
      </section>

      <div style={styles.mainGrid}>
        {/* CALENDAR */}
        <section style={styles.calendarSection}>
          <div style={styles.calendarHeader}>
            <button onClick={handlePrevMonth} style={styles.navBtn}>
              ←
            </button>
            <h2 style={styles.monthTitle}>{monthName}</h2>
            <button onClick={handleNextMonth} style={styles.navBtn}>
              →
            </button>
          </div>

          <div style={styles.weekDays}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} style={styles.weekDay}>
                {day}
              </div>
            ))}
          </div>

          <div style={styles.daysGrid}>
            {emptyDays.map((_, i) => (
              <div key={`empty-${i}`} style={styles.emptyDay} />
            ))}
            {days.map((day) => {
              const event = getEventForDate(day);
              return (
                <div
                  key={day}
                  onClick={() => {
                    setSelectedDate(day);
                    setShowEventModal(true);
                  }}
                  style={{
                    ...styles.dayCell,
                    ...(event ? styles.dayCellWithEvent : {}),
                    ...(selectedDate === day ? styles.dayCellSelected : {}),
                  }}
                >
                  <span style={styles.dayNumber}>{day}</span>
                  {event && (
                    <div style={styles.eventBadge}>
                      <p style={styles.eventBadgeTitle}>{event.title.substring(0, 8)}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SIDEBAR */}
        <aside style={styles.sidebar}>
          {/* UPCOMING */}
          <div style={styles.sidebarBox}>
            <h3 style={styles.sidebarTitle}>📆 Upcoming Events</h3>
            {events.length === 0 ? (
              <p style={styles.noEvents}>No events planned yet</p>
            ) : (
              <div style={styles.eventsList}>
                {events
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .slice(0, 5)
                  .map((event) => (
                    <div key={event.date} style={styles.upcomingEvent}>
                      <div>
                        <p style={styles.eventDate}>
                          {new Date(event.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        <p style={styles.eventTitle}>{event.title}</p>
                        <p style={styles.eventOutfit}>{event.outfit}</p>
                      </div>
                      <span style={styles.moodEmoji}>
                        {event.mood === "Fancy" && "✨"}
                        {event.mood === "Classy" && "👑"}
                        {event.mood === "Relaxed" && "😌"}
                        {event.mood === "Casual" && "😊"}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* STATS */}
          <div style={styles.sidebarBox}>
            <h3 style={styles.sidebarTitle}>📊 Stats</h3>
            <div style={styles.statsBox}>
              <div style={styles.stat}>
                <p style={styles.statLabel}>Planned Events</p>
                <p style={styles.statValue}>{events.length}</p>
              </div>
              <div style={styles.stat}>
                <p style={styles.statLabel}>Unique Outfits</p>
                <p style={styles.statValue}>{new Set(events.map((e) => e.outfit)).size}</p>
              </div>
            </div>
          </div>

          {/* TIPS */}
          <div style={styles.sidebarBox}>
            <h3 style={styles.sidebarTitle}>💡 Planning Tips</h3>
            <ul style={styles.tipsList}>
              <li>Plan 1-2 weeks ahead</li>
              <li>Avoid repeating outfits within 10 days</li>
              <li>Check weather & venue</li>
              <li>Mix saved looks creatively</li>
              <li>Note photo opportunities</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* EVENT MODAL */}
      {showEventModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <button
              onClick={() => {
                setShowEventModal(false);
                setSelectedDate(null);
              }}
              style={styles.closeBtn}
            >
              ✕
            </button>
            <h2 style={styles.modalTitle}>
              {selectedDate && new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h2>

            <div style={styles.formGroup}>
              <label style={styles.label}>Event Name</label>
              <input
                type="text"
                placeholder="e.g., Coffee with Sarah"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Outfit Assignment</label>
              <select
                value={eventForm.outfit}
                onChange={(e) => setEventForm({ ...eventForm, outfit: e.target.value })}
                style={styles.input}
              >
                <option value="">Choose an outfit</option>
                <option value="Office Ready">Office Ready</option>
                <option value="Casual Chic">Casual Chic</option>
                <option value="Elegant & Comfortable">Elegant & Comfortable</option>
                <option value="Weekend Brunch">Weekend Brunch</option>
                <option value="Festive Evening Look">Festive Evening Look</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Mood / Vibe</label>
              <div style={styles.moodButtons}>
                {["Casual", "Relaxed", "Classy", "Fancy"].map((mood) => (
                  <button
                    key={mood}
                    onClick={() => setEventForm({ ...eventForm, mood })}
                    style={{
                      ...styles.moodBtn,
                      ...(eventForm.mood === mood ? styles.moodBtnActive : {}),
                    }}
                  >
                    {mood === "Casual" && "😊"} {mood === "Relaxed" && "😌"}{" "}
                    {mood === "Classy" && "👑"} {mood === "Fancy" && "✨"} {mood}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.noteBox}>
              <p style={styles.noteLabel}>💭 Quick Notes (optional)</p>
              <textarea
                placeholder="Remember to bring umbrella, check weather, etc."
                style={styles.noteArea}
              />
            </div>

            <button onClick={handleAddEvent} style={styles.saveBtn}>
              Save Event
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  css: `
    button:hover {
      opacity: 0.85;
    }
  `,
  hero: {
    marginBottom: "32px",
    padding: "32px",
    background: "linear-gradient(135deg, #ffe7f6, #f3e3ff)",
    borderRadius: "16px",
  },
  pill: {
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.16em",
    color: "#a855f7",
    margin: "0 0 8px 0",
    textTransform: "uppercase",
  },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "14px",
    color: "#6b7280",
    margin: 0,
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "32px",
  },
  calendarSection: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "24px",
  },
  calendarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  monthTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  navBtn: {
    padding: "8px 12px",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "700",
  },
  weekDays: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "8px",
    marginBottom: "12px",
  },
  weekDay: {
    textAlign: "center",
    fontSize: "12px",
    fontWeight: "700",
    color: "#6b7280",
    padding: "8px",
  },
  daysGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "8px",
  },
  emptyDay: {
    aspectRatio: "1",
  },
  dayCell: {
    aspectRatio: "1",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "8px",
    cursor: "pointer",
    position: "relative",
    background: "#f9fafb",
    transition: "all 0.2s",
    minHeight: "80px",
    display: "flex",
    flexDirection: "column",
  },
  dayCellWithEvent: {
    background: "#fff5fa",
    borderColor: "#ff4fa3",
    borderWidth: "2px",
  },
  dayCellSelected: {
    borderColor: "#a855f7",
    boxShadow: "0 0 12px rgba(168, 85, 247, 0.2)",
  },
  dayNumber: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
  },
  eventBadge: {
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    borderRadius: "4px",
    padding: "4px 6px",
    fontSize: "9px",
    fontWeight: "600",
    marginTop: "auto",
  },
  eventBadgeTitle: {
    margin: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  sidebarBox: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px",
  },
  sidebarTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 12px 0",
  },
  noEvents: {
    fontSize: "13px",
    color: "#9ca3af",
    margin: 0,
  },
  eventsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  upcomingEvent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "12px",
    background: "#f9fafb",
    borderRadius: "8px",
  },
  eventDate: {
    fontSize: "11px",
    color: "#6b7280",
    fontWeight: "600",
    margin: "0 0 4px 0",
  },
  eventTitle: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 2px 0",
  },
  eventOutfit: {
    fontSize: "11px",
    color: "#9ca3af",
    margin: 0,
  },
  moodEmoji: {
    fontSize: "20px",
  },
  statsBox: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  stat: {
    textAlign: "center",
  },
  statLabel: {
    fontSize: "11px",
    color: "#6b7280",
    margin: "0 0 4px 0",
  },
  statValue: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#ff4fa3",
    margin: 0,
  },
  tipsList: {
    margin: 0,
    paddingLeft: "16px",
    fontSize: "12px",
    color: "#6b7280",
  },
  modal: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "white",
    borderRadius: "12px",
    padding: "32px",
    maxWidth: "500px",
    width: "90%",
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: "16px",
    right: "16px",
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 24px 0",
  },
  formGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    color: "#111827",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    fontSize: "13px",
    boxSizing: "border-box",
  },
  moodButtons: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },
  moodBtn: {
    padding: "10px 12px",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    transition: "all 0.2s",
  },
  moodBtnActive: {
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    borderColor: "transparent",
  },
  noteLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#111827",
    margin: "0 0 6px 0",
  },
  noteBox: {
    marginBottom: "16px",
  },
  noteArea: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    fontSize: "12px",
    minHeight: "60px",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  saveBtn: {
    width: "100%",
    padding: "12px",
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  },
};
