import React, { useState, useEffect } from "react";
import { FullBodyLala } from "../../components/LalaDisplay";
import useLalaProfile from "../../hooks/useLalaProfile";
import { LALA_BASE_FEATURES, EVOLUTION_STAGES } from "../../data/lalaCharacterConfig";
import { getLooksForStage } from "../../data/lalaLookPresets";
import "../../styles/styling-studio.css";

/**
 * BESTIE STYLING STUDIO
 * Full interface for Besties to style Lala
 * 
 * Features:
 * - Full body Lala in center
 * - Side panels: Mood, Hair, Makeup, Outfit
 * - Real-time preview
 * - Save/Submit functionality
 * - Evolution stage unlock display
 */
export const BestieStylingStudio = () => {
  const {
    profile,
    loading,
    currentMood,
    currentLookId,
    evolutionStage,
    changeMood,
    changeLook,
    unlockLook,
  } = useLalaProfile();

  // Local state for live preview (before saving)
  const [previewMood, setPreviewMood] = useState(null);
  const [previewLookId, setPreviewLookId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // Initialize preview with current state
  useEffect(() => {
    if (currentMood) setPreviewMood(currentMood);
    if (currentLookId) setPreviewLookId(currentLookId);
  }, [currentMood, currentLookId]);

  if (loading) {
    return (
      <div className="styling-studio">
        <div className="styling-studio-loading">
          <div className="styling-studio-spinner" />
          <p>Loading your styling studio...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="styling-studio">
        <div className="styling-studio-error">
          <p>Error loading your profile. Please try refreshing.</p>
        </div>
      </div>
    );
  }

  // Get available looks for current stage
  const availableLooks = getLooksForStage(evolutionStage || "basic");
  const stageInfo = EVOLUTION_STAGES[evolutionStage || "basic"];

  // SAVE CHANGES
  const handleSaveStyle = async () => {
    try {
      setIsSaving(true);
      setSaveMessage(null);

      // Save mood
      if (previewMood && previewMood !== currentMood) {
        await changeMood(previewMood);
      }

      // Save look
      if (previewLookId && previewLookId !== currentLookId) {
        await changeLook(previewLookId);
      }

      setSaveMessage({
        type: "success",
        text: "✨ Your styling has been saved! Lala looks amazing!",
      });

      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error("Error saving style:", err);
      setSaveMessage({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // RESET TO CURRENT
  const handleResetPreview = () => {
    setPreviewMood(currentMood);
    setPreviewLookId(currentLookId);
    setSaveMessage(null);
  };

  const moodData = previewMood ? LALA_BASE_FEATURES.moods[previewMood] : null;

  return (
    <div className="styling-studio">
      {/* HEADER */}
      <div className="styling-studio-header">
        <h1>✨ Styling Studio</h1>
        <p className="styling-studio-subtitle">
          Create your own look for Lala {stageInfo && `(${stageInfo.name} Stage)`}
        </p>
      </div>

      {/* MAIN CONTENT */}
      <div className="styling-studio-container">
        {/* LEFT PANEL - LALA DISPLAY */}
        <div className="styling-studio-preview">
          <div className="styling-studio-preview-bg">
            <FullBodyLala lookId={previewLookId} mood={previewMood} size="large" />
          </div>

          {/* CURRENT MOOD BADGE */}
          {moodData && (
            <div className="styling-studio-mood-badge" style={{ borderColor: moodData.color }}>
              <div className="styling-studio-mood-emoji">{moodData.emoji}</div>
              <div className="styling-studio-mood-label">{moodData.name}</div>
              <div className="styling-studio-mood-energy">{moodData.energy} Energy</div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL - CONTROLS */}
        <div className="styling-studio-controls">
          {/* MOOD SELECTOR */}
          <div className="styling-studio-section">
            <h3 className="styling-studio-section-title">🎭 Mood</h3>
            <div className="styling-studio-mood-grid">
              {Object.entries(LALA_BASE_FEATURES.moods).map(([moodKey, moodVal]) => (
                <button
                  key={moodKey}
                  className={`styling-studio-mood-btn ${
                    previewMood === moodKey ? "active" : ""
                  }`}
                  onClick={() => setPreviewMood(moodKey)}
                  style={previewMood === moodKey ? { borderColor: moodVal.color } : {}}
                  title={moodVal.name}
                >
                  <span className="styling-studio-mood-emoji">{moodVal.emoji}</span>
                  <span className="styling-studio-mood-name">{moodVal.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* LOOK SELECTOR */}
          <div className="styling-studio-section">
            <h3 className="styling-studio-section-title">👗 Available Looks</h3>
            <div className="styling-studio-looks-list">
              {availableLooks.length > 0 ? (
                availableLooks.map((look) => (
                  <button
                    key={look.id}
                    className={`styling-studio-look-item ${
                      previewLookId === look.id ? "active" : ""
                    }`}
                    onClick={() => setPreviewLookId(look.id)}
                  >
                    <div className="styling-studio-look-name">{look.name}</div>
                    <div className="styling-studio-look-desc">{look.description}</div>
                    <div className="styling-studio-look-mood">
                      {LALA_BASE_FEATURES.moods[look.mood]?.emoji} {look.mood}
                    </div>
                  </button>
                ))
              ) : (
                <div className="styling-studio-empty">
                  <p>No looks available for your stage.</p>
                </div>
              )}
            </div>
          </div>

          {/* OUTFIT BREAKDOWN (informational) */}
          {previewLookId && (
            <div className="styling-studio-section">
              <h3 className="styling-studio-section-title">🎀 Outfit Details</h3>
              <div className="styling-studio-outfit-details">
                <div className="styling-studio-outfit-item">
                  <span className="styling-studio-outfit-label">Stage:</span>
                  <span className="styling-studio-outfit-value">{stageInfo?.name}</span>
                </div>
                <div className="styling-studio-outfit-item">
                  <span className="styling-studio-outfit-label">Mood:</span>
                  <span className="styling-studio-outfit-value">
                    {moodData?.name}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STAGE INFO */}
          <div className="styling-studio-section styling-studio-stage-info">
            <h3 className="styling-studio-section-title">🌟 Stage Info</h3>
            <div className="styling-studio-stage-content">
              <p className="styling-studio-stage-desc">{stageInfo?.description}</p>
              <div className="styling-studio-stage-unlocks">
                <div className="styling-studio-unlock-item">
                  <span>👗 Outfits:</span>
                  <span>{stageInfo?.unlockedOutfits?.length || 0}</span>
                </div>
                <div className="styling-studio-unlock-item">
                  <span>💄 Makeup:</span>
                  <span>{stageInfo?.unlockedMakeupPresets?.length || 0}</span>
                </div>
                <div className="styling-studio-unlock-item">
                  <span>💇 Hair:</span>
                  <span>{stageInfo?.unlockedHairStyles?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="styling-studio-actions">
            <button
              className="styling-studio-btn-reset"
              onClick={handleResetPreview}
              disabled={isSaving}
            >
              ↶ Reset Preview
            </button>
            <button
              className="styling-studio-btn-save"
              onClick={handleSaveStyle}
              disabled={isSaving || (previewMood === currentMood && previewLookId === currentLookId)}
            >
              {isSaving ? "Saving..." : "💾 Save Style"}
            </button>
          </div>

          {/* SAVE MESSAGE */}
          {saveMessage && (
            <div className={`styling-studio-message styling-studio-message-${saveMessage.type}`}>
              {saveMessage.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BestieStylingStudio;
