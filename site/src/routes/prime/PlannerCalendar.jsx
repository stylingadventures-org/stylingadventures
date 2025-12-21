// site/src/routes/prime/PlannerCalendar.jsx
import React, { useState } from "react";

export default function PlannerCalendar() {
  const [currentMonth, setCurrentMonth] = useState("January");
  const [view, setView] = useState("month"); // "month", "week", "agenda"

  const months = ["January", "February", "March", "April", "May", "June"];
  const calendarEvents = {
    January: [
      { date: 6, show: "Capsule Wardrobe", episode: "Ep 1: Philosophy", type: "publish" },
      { date: 8, show: "Quick Fixes", episode: "Tuck Trick", type: "publish" },
      { date: 13, show: "Capsule Wardrobe", episode: "Ep 2: Neutrals", type: "publish" },
      { date: 15, event: "Content Creation Day", type: "planning" },
      { date: 20, show: "Capsule Wardrobe", episode: "Ep 3: Essentials", type: "publish" },
    ],
    February: [
      { date: 3, event: "Film Batch Content", type: "planning" },
      { date: 10, show: "Capsule Wardrobe", episode: "Ep 4: Layering", type: "publish" },
    ],
  };

  const monthEvents = calendarEvents[currentMonth] || [];

  const styles = {
    container: {
      padding: "24px",
      backgroundColor: "#f9f5f0",
      minHeight: "100vh",
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    },
    header: {
      marginBottom: "32px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: {
      fontSize: "28px",
      fontWeight: "600",
      color: "#333",
    },
    subtitle: {
      fontSize: "14px",
      color: "#666",
    },
    controls: {
      display: "flex",
      gap: "12px",
    },
    button: {
      padding: "10px 20px",
      backgroundColor: "#d4a574",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
    },
    secondaryButton: (isActive) => ({
      padding: "10px 20px",
      backgroundColor: isActive ? "#d4a574" : "#f0e8e0",
      color: isActive ? "#fff" : "#666",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
    }),
    card: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      padding: "24px",
      border: "1px solid #e5ddd0",
      marginBottom: "20px",
    },
    monthSelector: {
      display: "flex",
      gap: "8px",
      marginBottom: "20px",
      overflowX: "auto",
    },
    monthButton: (isSelected) => ({
      padding: "10px 16px",
      backgroundColor: isSelected ? "#d4a574" : "#f0e8e0",
      color: isSelected ? "#fff" : "#666",
      border: "none",
      borderRadius: "6px",
      fontSize: "13px",
      fontWeight: "600",
      cursor: "pointer",
      whiteSpace: "nowrap",
    }),
    calendarGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: "8px",
      marginBottom: "20px",
    },
    dayHeader: {
      padding: "12px",
      textAlign: "center",
      fontSize: "12px",
      fontWeight: "700",
      color: "#999",
      textTransform: "uppercase",
    },
    dayCell: {
      padding: "12px",
      backgroundColor: "#faf8f5",
      borderRadius: "6px",
      minHeight: "80px",
      display: "flex",
      flexDirection: "column",
      border: "1px solid #f0e8e0",
    },
    dayNumber: {
      fontSize: "13px",
      fontWeight: "600",
      color: "#333",
      marginBottom: "8px",
    },
    dayEvent: {
      fontSize: "11px",
      padding: "4px 8px",
      borderRadius: "4px",
      marginBottom: "4px",
      fontWeight: "500",
    },
    eventPublish: {
      backgroundColor: "#e8f4e8",
      color: "#2d6b2f",
      borderLeft: "2px solid #2d6b2f",
    },
    eventPlanning: {
      backgroundColor: "#fff4e8",
      color: "#8b6f47",
      borderLeft: "2px solid #d4a574",
    },
    eventList: {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    },
    eventCard: {
      padding: "16px",
      backgroundColor: "#faf8f5",
      borderRadius: "8px",
      borderLeft: "4px solid #d4a574",
    },
    eventDate: {
      fontSize: "12px",
      fontWeight: "700",
      color: "#999",
      textTransform: "uppercase",
      marginBottom: "4px",
    },
    eventTitle: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#333",
      marginBottom: "4px",
    },
    eventType: {
      fontSize: "12px",
      color: "#666",
      fontStyle: "italic",
    },
    emptyState: {
      padding: "40px 20px",
      textAlign: "center",
      color: "#999",
    },
  };

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daysInMonth = 31;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Planner & Calendar</h1>
          <p style={styles.subtitle}>Full content calendar and publishing plan</p>
        </div>
        <div style={styles.controls}>
          <button style={styles.secondaryButton(view === "month")}>Month</button>
          <button style={styles.secondaryButton(view === "week")}>Week</button>
          <button style={styles.secondaryButton(view === "agenda")}>Agenda</button>
          <button style={styles.button}>+ Schedule Content</button>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.monthSelector}>
          {months.map((month) => (
            <button
              key={month}
              style={styles.monthButton(currentMonth === month)}
              onClick={() => setCurrentMonth(month)}
            >
              {month}
            </button>
          ))}
        </div>
      </div>

      {view === "month" && (
        <div style={styles.card}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#333", marginBottom: "16px" }}>
            {currentMonth} 2025
          </h2>
          <div style={styles.calendarGrid}>
            {days.map((day) => (
              <div key={day} style={styles.dayHeader}>
                {day}
              </div>
            ))}

            {Array.from({ length: daysInMonth }).map((_, index) => {
              const date = index + 1;
              const dayEvents = monthEvents.filter((e) => e.date === date);
              return (
                <div key={date} style={styles.dayCell}>
                  <div style={styles.dayNumber}>{date}</div>
                  {dayEvents.map((event, i) => (
                    <div
                      key={i}
                      style={{
                        ...styles.dayEvent,
                        ...(event.type === "publish"
                          ? styles.eventPublish
                          : styles.eventPlanning),
                      }}
                    >
                      {event.show || event.event}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "agenda" && (
        <div style={styles.card}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#333", marginBottom: "20px" }}>
            Upcoming Content
          </h2>
          {monthEvents.length > 0 ? (
            <div style={styles.eventList}>
              {monthEvents.map((event, i) => (
                <div key={i} style={styles.eventCard}>
                  <div style={styles.eventDate}>{currentMonth} {event.date}</div>
                  <div style={styles.eventTitle}>{event.show || event.event}</div>
                  {event.episode && (
                    <div style={styles.eventType}>{event.episode}</div>
                  )}
                  <div style={styles.eventType}>
                    {event.type === "publish" ? "📤 Scheduled for publication" : "📋 Planning session"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <p>No events scheduled for {currentMonth}.</p>
              <p style={{ marginTop: "12px", fontSize: "13px" }}>Schedule your first content!</p>
            </div>
          )}
        </div>
      )}

      {view === "week" && (
        <div style={styles.card}>
          <div style={styles.emptyState}>
            <p>Week view coming soon.</p>
          </div>
        </div>
      )}

      <div style={styles.card}>
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#333", marginBottom: "12px" }}>
          📊 Content Stats
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          <div style={{ padding: "12px", backgroundColor: "#faf8f5", borderRadius: "6px" }}>
            <div style={{ fontSize: "12px", color: "#999", marginBottom: "4px" }}>
              SCHEDULED THIS MONTH
            </div>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "#333" }}>
              {monthEvents.filter((e) => e.type === "publish").length}
            </div>
          </div>
          <div style={{ padding: "12px", backgroundColor: "#faf8f5", borderRadius: "6px" }}>
            <div style={{ fontSize: "12px", color: "#999", marginBottom: "4px" }}>
              PLANNING SESSIONS
            </div>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "#333" }}>
              {monthEvents.filter((e) => e.type === "planning").length}
            </div>
          </div>
          <div style={{ padding: "12px", backgroundColor: "#faf8f5", borderRadius: "6px" }}>
            <div style={{ fontSize: "12px", color: "#999", marginBottom: "4px" }}>
              TOTAL SERIES
            </div>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "#333" }}>3</div>
          </div>
        </div>
      </div>
    </div>
  );
}
