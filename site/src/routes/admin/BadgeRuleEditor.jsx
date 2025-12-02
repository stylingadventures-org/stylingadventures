import React, { useEffect, useState, useCallback } from "react";
import { useSettings } from "../../stores/settingsStore";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Editor from "@monaco-editor/react";

const ItemType = "BADGE_RULE";

function DraggableRule({ rule, index, moveRule, updateRule, deleteRule, copyRule }) {
  const [, dragRef] = useDrag({ type: ItemType, item: { index } });
  const [, dropRef] = useDrop({
    accept: ItemType,
    hover: (dragged) => {
      if (dragged.index !== index) {
        moveRule(dragged.index, index);
        dragged.index = index;
      }
    },
  });

  return (
    <div ref={(node) => node && dragRef(dropRef(node))} className="br-rule-card">
      <div className="br-rule-card__header">
        <div className="br-rule-card__title">
          <span className="br-rule-card__badge">#{index + 1}</span>
          {rule.title || `Badge Rule ${index + 1}`}
        </div>
        <span className="br-rule-card__handle" aria-hidden="true">⋮⋮</span>
      </div>

      <div className="br-field">
        <label className="br-field__label">Rule title</label>
        <input
          type="text"
          value={rule.title ?? ""}
          onChange={(e) => updateRule(index, { title: e.target.value })}
          className="br-input"
          placeholder="e.g. First 100 XP"
        />
      </div>

      <div className="br-field br-field--editor">
        <label className="br-field__label">
          Trigger JSON
          <span className="br-field__hint">
            Evaluated against the fan profile. Keep it valid JSON.
          </span>
        </label>
        <Editor
          height="220px"
          defaultLanguage="json"
          value={rule.trigger ?? "{}"}
          onChange={(value) => updateRule(index, { trigger: value ?? "{}" })}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
          }}
        />
      </div>

      <div className="br-rule-card__footer">
        <button type="button" onClick={() => copyRule(index)} className="br-btn br-btn--ghost">
          Copy
        </button>
        <button type="button" onClick={() => deleteRule(index)} className="br-btn br-btn--danger">
          Delete
        </button>
      </div>
    </div>
  );
}

function BadgeRuleEditor() {
  const { settings, save } = useSettings();
  const [rules, setRules] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (settings?.badgeRules) {
      setRules(settings.badgeRules);
    }
  }, [settings]);

  const moveRule = useCallback((from, to) => {
    setRules((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  }, []);

  const updateRule = (index, updates) => {
    setRules((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  };

  const deleteRule = (index) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const copyRule = (index) => {
    setRules((prev) => {
      const copy = { ...prev[index] };
      const updated = [...prev];
      updated.splice(index + 1, 0, copy);
      return updated;
    });
  };

  const addRule = () => {
    setRules((prev) => [...prev, { title: "", trigger: "{}" }]);
  };

  const saveAll = async () => {
    try {
      setSaving(true);
      setSaveError("");
      await save({ badgeRules: rules });
    } catch (err) {
      console.error("Failed to save badge rules", err);
      setSaveError("Failed to save changes. See console for details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="section-page">
        <div className="section-shell">
          <main className="section-main">
            <style>{`
              .br-page {
                max-width: 1040px;
                margin: 0 auto;
              }
              .br-card-outer {
                background:
                  radial-gradient(circle at top left, #ffe4f3, #fdf7ff 45%),
                  radial-gradient(circle at bottom right, #e0f2fe, #ffffff 70%);
                border-radius: 24px;
                padding: 20px 22px 24px;
                box-shadow: 0 18px 45px rgba(15,23,42,0.08);
                border: 1px solid rgba(244,220,255,0.9);
              }
              .br-card-inner {
                background: #ffffff;
                border-radius: 18px;
                padding: 18px 18px 20px;
                border: 1px solid rgba(229,231,235,0.9);
              }
              .br-header-title {
                font-size: 22px;
                font-weight: 800;
                background: linear-gradient(90deg, #a855f7, #ec4899);
                -webkit-background-clip: text;
                color: transparent;
              }
              .br-header-subtitle {
                font-size: 14px;
                color: #6b7280;
                margin-top: 4px;
              }
              .br-rule-list {
                margin-top: 18px;
              }

              .br-rule-card {
                margin-bottom: 16px;
                border-radius: 16px;
                background: #ffffff;
                border: 1px solid #e5e7eb;
                box-shadow: 0 8px 20px rgba(15,23,42,0.06);
                padding: 14px 14px 12px;
                cursor: grab;
              }
              .br-rule-card__header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
              }
              .br-rule-card__title {
                font-weight: 700;
                font-size: 16px;
                display: inline-flex;
                align-items: center;
                gap: 8px;
              }
              .br-rule-card__badge {
                font-size: 11px;
                padding: 2px 8px;
                border-radius: 999px;
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.08em;
              }
              .br-rule-card__handle {
                font-size: 16px;
                color: #9ca3af;
              }

              .br-field {
                margin-bottom: 10px;
              }
              .br-field--editor {
                margin-bottom: 12px;
              }
              .br-field__label {
                display: block;
                font-size: 12px;
                font-weight: 600;
                color: #6b7280;
                margin-bottom: 4px;
              }
              .br-field__hint {
                margin-left: 6px;
                font-weight: 400;
                font-size: 11px;
                color: #9ca3af;
              }
              .br-input {
                width: 100%;
                padding: 6px 10px;
                border-radius: 8px;
                border: 1px solid #d1d5db;
                font-size: 14px;
              }

              .br-rule-card__footer {
                display: flex;
                gap: 8px;
                justify-content: flex-end;
                margin-top: 8px;
              }

              .br-btn {
                padding: 6px 12px;
                border-radius: 999px;
                border: none;
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                transition: transform 0.04s ease, box-shadow 0.12s ease, filter 0.12s ease;
              }
              .br-btn:active {
                transform: translateY(1px);
              }
              .br-btn--ghost {
                border: 1px solid #d1d5db;
                background: #f9fafb;
                color: #111827;
              }
              .br-btn--ghost:hover {
                filter: brightness(1.02);
              }
              .br-btn--danger {
                border: 1px solid #fecaca;
                background: #fee2e2;
                color: #b91c1c;
              }
              .br-btn--danger:hover {
                filter: brightness(1.02);
              }
              .br-btn--primary {
                background: linear-gradient(135deg, #ec4899, #a855f7);
                color: #ffffff;
                box-shadow: 0 10px 24px rgba(147,51,234,0.45);
                border: none;
              }
              .br-btn--primary:hover {
                filter: brightness(1.03);
              }
              .br-btn--primary:active {
                box-shadow: 0 6px 18px rgba(147,51,234,0.5);
              }

              .br-footer {
                display: flex;
                gap: 8px;
                margin-top: 16px;
                justify-content: flex-end;
                align-items: center;
              }
              .br-footer__error {
                margin-top: 10px;
                font-size: 13px;
                color: #b91c1c;
              }
            `}</style>

            <div className="br-page">
              <div className="br-card-outer">
                <div className="br-card-inner">
                  <header>
                    <h1 className="br-header-title">Badge Rule Editor</h1>
                    <p className="br-header-subtitle">
                      Define and reorder rules for auto-granting badges. Rules are
                      evaluated from top to bottom.
                    </p>
                  </header>

                  <div className="br-rule-list">
                    {rules.map((rule, i) => (
                      <DraggableRule
                        key={i}
                        rule={rule}
                        index={i}
                        moveRule={moveRule}
                        updateRule={updateRule}
                        deleteRule={deleteRule}
                        copyRule={copyRule}
                      />
                    ))}

                    {rules.length === 0 && (
                      <div
                        style={{
                          fontSize: 13,
                          color: "#9ca3af",
                          padding: "10px 4px 0",
                        }}
                      >
                        No rules yet. Click &ldquo;Add New Rule&rdquo; to create your
                        first one.
                      </div>
                    )}
                  </div>

                  <div className="br-footer">
                    <button type="button" onClick={addRule} className="br-btn br-btn--ghost">
                      Add New Rule
                    </button>
                    <button
                      type="button"
                      onClick={saveAll}
                      disabled={saving}
                      className="br-btn br-btn--primary"
                      style={{ opacity: saving ? 0.85 : 1 }}
                    >
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>

                  {saveError && (
                    <div className="br-footer__error">{saveError}</div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </DndProvider>
  );
}

export default BadgeRuleEditor;
