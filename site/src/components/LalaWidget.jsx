import React, { useState } from "react";
import { BustLala } from "./LalaDisplay";
import "../styles/lala-widget.css";

/**
 * LALA WIDGET
 * Small Lala component that appears in sidebars/header
 * Clicking opens the full Lala Profile Panel
 * 
 * Shows: Current mood, current look name
 * Actions: View Profile, Play Styling Adventure, Watch Episode
 */
function LalaWidget({ onProfileClick = null, visualMode = "bust" }) {
  const [isOpen, setIsOpen] = useState(false);

  // TODO: Replace with actual data from useLalaProfile hook
  const currentMood = "confident";
  const currentLookId = "basic_confident_golden";
  const currentLookName = "Golden Hour";

  const handleWidgetClick = () => {
    console.log("🎀 LalaWidget clicked! Current isOpen:", isOpen);
    setIsOpen(!isOpen);
    if (onProfileClick && !isOpen) {
      onProfileClick();
    }
  };

  const handlePlayGame = () => {
    console.log("Navigate to Styling Adventures");
    // window.location.href = "/bestie/styling-studio";
  };

  const handleWatchEpisode = () => {
    console.log("Navigate to Episodes");
    // window.location.href = "/fan/episodes";
  };

  return (
    <div className="lala-widget">
      {/* Main widget button */}
      <button
        className="lala-widget-button"
        onClick={handleWidgetClick}
        title="Click to see Lala's profile"
      >
        <BustLala lookId={currentLookId} mood={currentMood} size="small" clickable={true} />
      </button>

      {/* Widget label */}
      <div className="lala-widget-label">
        <div className="lala-widget-mood">
          <span className="lala-widget-mood-emoji">
            {currentMood === "confident" && "💪"}
            {currentMood === "playful" && "😄"}
            {currentMood === "soft" && "💕"}
            {currentMood === "spicy" && "🔥"}
            {currentMood === "focused" && "🎯"}
            {currentMood === "shadow" && "🌙"}
          </span>
          <span className="lala-widget-mood-text">{currentMood}</span>
        </div>
        <div className="lala-widget-look-name">{currentLookName}</div>
      </div>

      {/* Quick action panel (appears on hover/click) */}
      {isOpen && (
        <div className="lala-widget-panel">
          <div className="lala-widget-panel-header">
            <h4>Lala's Profile</h4>
            <button
              className="lala-widget-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="lala-widget-panel-content">
            {/* Current status */}
            <div className="lala-widget-status">
              <div className="lala-widget-status-item">
                <span className="lala-widget-status-label">Current Mood:</span>
                <span className="lala-widget-status-value">{currentMood.toUpperCase()}</span>
              </div>
              <div className="lala-widget-status-item">
                <span className="lala-widget-status-label">Current Look:</span>
                <span className="lala-widget-status-value">{currentLookName}</span>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="lala-widget-actions">
              <button className="lala-widget-action-btn" onClick={handlePlayGame}>
                <span>🎮</span>
                <span>Play Styling Adventure</span>
              </button>
              <button className="lala-widget-action-btn" onClick={handleWatchEpisode}>
                <span>🎬</span>
                <span>Watch Episode</span>
              </button>
            </div>

            {/* Quick mood selector */}
            <div className="lala-widget-mood-selector">
              <div className="lala-widget-mood-selector-label">Change Mood:</div>
              <div className="lala-widget-mood-buttons">
                {["playful", "confident", "soft", "spicy", "focused", "shadow"].map((mood) => (
                  <button
                    key={mood}
                    className={`lala-widget-mood-btn ${currentMood === mood ? "active" : ""}`}
                    onClick={() => console.log(`Change mood to ${mood}`)}
                    title={mood}
                  >
                    {mood === "confident" && "💪"}
                    {mood === "playful" && "😄"}
                    {mood === "soft" && "💕"}
                    {mood === "spicy" && "🔥"}
                    {mood === "focused" && "🎯"}
                    {mood === "shadow" && "🌙"}
                  </button>
                ))}
              </div>
            </div>

            {/* View full profile link */}
            <div className="lala-widget-footer">
              <a href="#" className="lala-widget-view-profile">
                View Full Profile →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LalaWidget;
