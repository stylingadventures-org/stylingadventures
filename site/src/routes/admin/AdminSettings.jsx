// site/src/routes/admin/AdminSettings.jsx

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

import { useSettings } from "../../stores/settingsStore";

export default function AdminSettings() {
  const { settings, save, loading, error } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [badgeRules, setBadgeRules] = useState(settings.badgeRules || []);

  useEffect(() => {
    setLocalSettings(settings);
    setBadgeRules(settings.badgeRules || []);
  }, [settings]);

  const handleToggle = (key) => async (e) => {
    const value = e.target.checked;
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);

    try {
      await save({ [key]: value });
      toast.success("Settings updated");
    } catch {
      toast.error("Failed to update setting");
      // revert UI if save fails
      setLocalSettings(localSettings);
    }
  };

  const handleRuleChange = (index, field, value) => {
    const updated = [...badgeRules];
    updated[index] = { ...updated[index], [field]: value };
    setBadgeRules(updated);
  };

  const addRule = () => {
    setBadgeRules((prev) => [
      ...prev,
      { id: "", label: "", trigger: "(profile) => true" },
    ]);
  };

  const removeRule = (index) => {
    setBadgeRules((prev) => prev.filter((_, i) => i !== index));
  };

  const saveRules = async () => {
    try {
      await save({ badgeRules });
      toast.success("Badge rules saved");
    } catch {
      toast.error("Failed to save rules");
    }
  };

  if (loading) return <div className="p-4">Loading settings...</div>;
  if (error)
    return <div className="p-4 text-red-500">Error loading settings.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Local styles just for this page */}
      <style>{`
        .admin-card {
          background:
            radial-gradient(circle at top left, #ffe4f3, #fdf7ff 45%),
            radial-gradient(circle at bottom right, #e0f2fe, #ffffff 70%);
          border-radius: 24px;
          padding: 20px 22px 24px;
          box-shadow: 0 18px 45px rgba(15,23,42,0.08);
          border: 1px solid rgba(244,220,255,0.9);
        }
        .admin-card-inner {
          background: #ffffff;
          border-radius: 18px;
          padding: 18px 18px 20px;
          border: 1px solid rgba(229,231,235,0.9);
        }
        .admin-section-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 4px;
          color: #111827;
        }
        .admin-section-subtitle {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 10px;
        }
        .admin-toggle-group {
          display: grid;
          row-gap: 4px;
        }
        @media (min-width: 768px) {
          .admin-toggle-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            column-gap: 16px;
          }
        }
      `}</style>

      <div className="admin-card">
        <div className="mb-4">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Admin Settings
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Control the global fan experience and how badges are unlocked.
          </p>
        </div>

        <div className="admin-card-inner space-y-8">
          {/* GLOBAL EXPERIENCE */}
          <section>
            <div className="admin-section-title">Global Experience</div>
            <p className="admin-section-subtitle">
              These switches apply to all fan dashboards unless overridden
              elsewhere.
            </p>

            <div className="admin-toggle-group admin-toggle-grid">
              <FormControlLabel
                control={
                  <Switch
                    checked={!!localSettings.animationsEnabled}
                    onChange={handleToggle("animationsEnabled")}
                  />
                }
                label="Enable Animations"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={!!localSettings.soundsEnabled}
                    onChange={handleToggle("soundsEnabled")}
                  />
                }
                label="Enable Sounds"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={!!localSettings.autoBadgeGrant}
                    onChange={handleToggle("autoBadgeGrant")}
                  />
                }
                label="Auto-Grant Badges"
              />
            </div>
          </section>

          {/* BADGE RULES */}
          <section className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="admin-section-title">Badge Rules</div>
                <p className="admin-section-subtitle">
                  Define dynamic rules that unlock badges from the fan profile.
                  The trigger should be a JavaScript function body that receives
                  <code className="px-1 mx-1 rounded bg-slate-100 text-xs">
                    profile
                  </code>
                  and returns a boolean.
                </p>
              </div>
            </div>

            {badgeRules.length === 0 && (
              <div className="text-sm text-slate-500 mb-3">
                No rules yet. Add your first badge rule to start auto-granting
                achievements.
              </div>
            )}

            {badgeRules.map((rule, i) => (
              <div
                key={i}
                className="space-y-2 mb-4 p-3 rounded-lg border border-slate-200 bg-slate-50/70"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Rule #{i + 1}
                  </span>
                  <Button
                    size="small"
                    color="error"
                    variant="text"
                    onClick={() => removeRule(i)}
                  >
                    Remove
                  </Button>
                </div>

                <TextField
                  fullWidth
                  size="small"
                  label="Badge ID"
                  margin="dense"
                  value={rule.id}
                  onChange={(e) => handleRuleChange(i, "id", e.target.value)}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Label"
                  margin="dense"
                  value={rule.label}
                  onChange={(e) => handleRuleChange(i, "label", e.target.value)}
                />
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  label="Trigger (JS function body)"
                  helperText={`Example: (profile) => profile.xp >= 100`}
                  margin="dense"
                  value={rule.trigger}
                  onChange={(e) =>
                    handleRuleChange(i, "trigger", e.target.value)
                  }
                />
              </div>
            ))}

            <div className="flex flex-wrap gap-2 mt-2">
              <Button
                type="button"
                onClick={addRule}
                variant="outlined"
                color="primary"
              >
                Add Rule
              </Button>
              <Button
                type="button"
                onClick={saveRules}
                variant="contained"
                color="primary"
              >
                Save Rules
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
