import React from "react";
import { LALA_BASE_FEATURES } from "../data/lalaCharacterConfig";
import { getLookById } from "../data/lalaLookPresets";
import "../styles/lala.css";

/**
 * FULL BODY LALA - Game Mode
 * Used in: Styling Adventures gameplay, styling studio
 * Shows: Full outfit, pose, scene background
 */
export const FullBodyLala = ({ lookId, mood, size = "large" }) => {
  const look = lookId ? getLookById(lookId) : null;
  const moodData = mood ? LALA_BASE_FEATURES.moods[mood] : null;

  if (!look && !mood) {
    return (
      <div className={`lala-fullbody lala-size-${size} lala-placeholder`}>
        <div className="lala-placeholder-content">
          <span>🎨 Lala Full Body</span>
        </div>
      </div>
    );
  }

  const currentMood = moodData || LALA_BASE_FEATURES.moods[look?.mood];
  const sceneData = look ? LALA_BASE_FEATURES.scenes[look.sceneId] : null;

  return (
    <div
      className={`lala-fullbody lala-size-${size}`}
      style={{
        backgroundColor: sceneData?.backgroundColor || "#E8E8E8",
        backgroundImage: `url(${look?.imageUrl})`,
        backgroundPosition: "center",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Mood lighting overlay */}
      {currentMood && (
        <div
          className="lala-mood-overlay"
          style={{
            background: `radial-gradient(circle, ${currentMood.color}15 0%, transparent 70%)`,
          }}
        />
      )}

      {/* If no image URL, show placeholder with mood color */}
      {!look?.imageUrl && (
        <div className="lala-fullbody-placeholder">
          <div
            className="lala-mood-indicator"
            style={{ color: currentMood?.color || "#FFD700" }}
          >
            <div className="lala-mood-emoji">{currentMood?.emoji}</div>
            <div className="lala-mood-name">{currentMood?.name}</div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * BUST LALA - Guide Mode (Most Common)
 * Used in: Home, community, episodes, missions, sidebar widget
 * Shows: Face, shoulder-up with mood expression
 */
export const BustLala = ({ lookId, mood, size = "medium", clickable = false }) => {
  const look = lookId ? getLookById(lookId) : null;
  const moodData = mood ? LALA_BASE_FEATURES.moods[mood] : null;

  const currentMood = moodData || (look ? LALA_BASE_FEATURES.moods[look.mood] : null);

  const handleClick = clickable ? () => console.log("Lala bust clicked") : null;

  if (!currentMood) {
    return (
      <div className={`lala-bust lala-size-${size} lala-placeholder`}>
        <div className="lala-placeholder-content">
          <span>👩 Lala Bust</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`lala-bust lala-size-${size} ${clickable ? "lala-clickable" : ""}`}
      onClick={handleClick}
      style={clickable ? { cursor: "pointer" } : {}}
    >
      {/* Background circle */}
      <div
        className="lala-bust-bg"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${currentMood.color}30 0%, ${currentMood.color}10 50%, transparent 100%)`,
          borderColor: currentMood.color,
        }}
      />

      {/* Bust container with image */}
      <div className="lala-bust-container">
        {look?.imageUrl ? (
          <img
            src={look.imageUrl}
            alt={`Lala - ${currentMood.name}`}
            className="lala-bust-image"
          />
        ) : (
          <div className="lala-bust-placeholder">
            <div className="lala-bust-avatar">
              <div className="lala-avatar-head">
                <div className="lala-avatar-eyes">
                  <div className="lala-avatar-eye" />
                  <div className="lala-avatar-eye" />
                </div>
                <div className="lala-avatar-mouth" />
              </div>
              <div className="lala-avatar-hair" style={{ color: "#D4AF37" }} />
            </div>
          </div>
        )}
      </div>

      {/* Mood indicator badge */}
      <div className="lala-mood-badge" style={{ borderColor: currentMood.color }}>
        <span style={{ color: currentMood.color }}>{currentMood.emoji}</span>
      </div>
    </div>
  );
};

/**
 * PORTRAIT LALA - Mentor Mode (Business)
 * Used in: Creator portal, goal compass, analytics
 * Shows: Face/shoulders only, clean background, neutral/boss lighting
 */
export const PortraitLala = ({ lookId, mood, size = "small" }) => {
  const look = lookId ? getLookById(lookId) : null;

  // Portrait mode always defaults to "Focused" (Business Lala)
  const currentMood = LALA_BASE_FEATURES.moods["focused"];

  return (
    <div className={`lala-portrait lala-size-${size}`}>
      {/* Clean professional background */}
      <div className="lala-portrait-bg" />

      {/* Professional lighting effect */}
      <div className="lala-portrait-lighting" />

      {/* Portrait container */}
      <div className="lala-portrait-container">
        {look?.imageUrl ? (
          <img
            src={look.imageUrl}
            alt="Lala - Business Mode"
            className="lala-portrait-image"
          />
        ) : (
          <div className="lala-portrait-placeholder">
            <div className="lala-portrait-face">
              <div className="lala-portrait-eyes">
                <div className="lala-portrait-eye" />
                <div className="lala-portrait-eye" />
              </div>
              <div className="lala-portrait-mouth" />
            </div>
            <div className="lala-portrait-hair" />
          </div>
        )}
      </div>

      {/* Professional badge */}
      <div className="lala-portrait-badge">
        <span>💼 Mentor Lala</span>
      </div>
    </div>
  );
};

/**
 * CINEMATIC LALA - Story Mode (Prime Studios)
 * Used in: Episodes, music videos, promos
 * Shows: 3D or enhanced cinematic shots, can blend with real footage
 */
export const CinematicLala = ({ lookId, sceneId, size = "xlarge" }) => {
  const look = lookId ? getLookById(lookId) : null;
  const sceneData = sceneId ? LALA_BASE_FEATURES.scenes[sceneId] : null;

  return (
    <div
      className={`lala-cinematic lala-size-${size}`}
      style={{
        backgroundColor: sceneData?.backgroundColor || "#1a1a1a",
      }}
    >
      {/* Cinematic backdrop */}
      <div className="lala-cinematic-backdrop" />

      {/* Main cinematic image/video */}
      <div className="lala-cinematic-container">
        {look?.imageUrl ? (
          <img
            src={look.imageUrl}
            alt="Lala - Cinematic"
            className="lala-cinematic-image"
          />
        ) : (
          <div className="lala-cinematic-placeholder">
            <div className="lala-cinematic-text">🎬 Cinematic Mode</div>
            <div className="lala-cinematic-subtitle">{sceneData?.name || "Prime Scene"}</div>
          </div>
        )}
      </div>

      {/* Scene label */}
      {sceneData && (
        <div className="lala-cinematic-label">
          <span>{sceneData.name}</span>
        </div>
      )}
    </div>
  );
};

export default {
  FullBodyLala,
  BustLala,
  PortraitLala,
  CinematicLala,
};
