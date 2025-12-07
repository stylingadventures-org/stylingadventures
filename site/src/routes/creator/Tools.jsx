// site/src/routes/creator/Tools.jsx
import React, { useState } from "react";
import { graphql } from "../../lib/sa";

export default function CreatorTools() {
  const [kind, setKind] = useState("CAPTION");
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const canGraphQL =
    typeof window !== "undefined" &&
    !!(window.sa?.graphql || window.__cfg?.appsyncUrl);

  const handleSuggest = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      setLoading(true);
      setErr("");
      setSuggestions([]);

      if (canGraphQL) {
        const data = await graphql(
          `
          mutation CreatorAiSuggest($text: String, $kind: CreatorAiSuggestionKind) {
            creatorAiSuggest(text: $text, kind: $kind) {
              suggestions
            }
          }
        `,
          { text, kind },
        );

        const sug = data?.creatorAiSuggest?.suggestions || [];
        if (sug.length) {
          setSuggestions(sug);
          return;
        }
      }

      // Fallback stub suggestions
      if (kind === "CAPTION") {
        setSuggestions([
          `Behind the scenes of: ${text}`,
          `Styled this look with you in mind — ${text}`,
        ]);
      } else if (kind === "HASHTAGS") {
        setSuggestions([
          "#stylingadventures #creatorstudio #outfitideas",
          "#bts #lookbook #lalascloset",
        ]);
      } else {
        setSuggestions([
          "Try a short hook that says what the look feels like, then add 3–4 strong hashtags.",
        ]);
      }
    } catch (e2) {
      console.error(e2);
      setErr(String(e2?.message || e2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="creator-tools">
      <style>{styles}</style>

      <div className="creator-card">
        <div className="tools-head">
          <div>
            <h2>AI assistant</h2>
            <p className="tools-sub">
              Draft captions, hooks, and hashtags. Later we&apos;ll plug in
              Claude 3.5 Sonnet on Bedrock.
            </p>
          </div>
          <div className="tools-kind-switch">
            <button
              type="button"
              className={
                "tools-kind" + (kind === "CAPTION" ? " tools-kind--on" : "")
              }
              onClick={() => setKind("CAPTION")}
            >
              Caption
            </button>
            <button
              type="button"
              className={
                "tools-kind" + (kind === "HASHTAGS" ? " tools-kind--on" : "")
              }
              onClick={() => setKind("HASHTAGS")}
            >
              Hashtags
            </button>
            <button
              type="button"
              className={
                "tools-kind" + (kind === "OTHER" ? " tools-kind--on" : "")
              }
              onClick={() => setKind("OTHER")}
            >
              Other
            </button>
          </div>
        </div>

        <form onSubmit={handleSuggest} className="tools-form">
          <textarea
            className="tools-input"
            rows={4}
            placeholder={
              kind === "CAPTION"
                ? "Describe the look, scene, or episode moment you want a caption for…"
                : kind === "HASHTAGS"
                  ? "Describe the vibe you want hashtags for…"
                  : "Ask for ideas for pacing, hooks, or episode beats…"
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="tools-footer">
            <span className="tools-hint">
              AI suggestions are drafts – you stay the creative director.
            </span>
            <button
              type="submit"
              className="tools-btn"
              disabled={!text.trim() || loading}
            >
              {loading ? "Thinking…" : "Suggest"}
            </button>
          </div>
        </form>

        {err && <div className="tools-error">{err}</div>}

        {suggestions.length > 0 && (
          <div className="tools-suggestions">
            <h3>Suggestions</h3>
            <ul>
              {suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

const styles = `
.creator-card {
  background:#f9fafb;
  border-radius:16px;
  border:1px solid #e5e7eb;
  padding:14px;
  box-shadow:0 10px 24px rgba(15,23,42,0.08);
}

.creator-tools h2 {
  margin:0 0 4px;
  font-size:1rem;
}
.tools-sub {
  margin:0;
  font-size:0.86rem;
  color:#6b7280;
}

.tools-head {
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:10px;
}

.tools-kind-switch {
  display:flex;
  gap:4px;
}
.tools-kind {
  border-radius:999px;
  border:1px solid #d1d5db;
  background:#f9fafb;
  color:#374151;
  font-size:0.8rem;
  padding:5px 9px;
  cursor:pointer;
}
.tools-kind--on {
  background:#111827;
  border-color:#111827;
  color:#f9fafb;
}

.tools-form {
  margin-top:10px;
  display:flex;
  flex-direction:column;
  gap:6px;
}
.tools-input {
  width:100%;
  border-radius:12px;
  border:1px solid #d1d5db;
  padding:8px 10px;
  font-size:0.9rem;
  resize:vertical;
  font-family:inherit;
}
.tools-input:focus {
  outline:none;
  border-color:#111827;
  box-shadow:0 0 0 1px rgba(15,23,42,0.24);
}

.tools-footer {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:8px;
  flex-wrap:wrap;
}
.tools-hint {
  font-size:0.8rem;
  color:#6b7280;
}
.tools-btn {
  border-radius:999px;
  border:none;
  background:#111827;
  color:#f9fafb;
  font-size:0.86rem;
  padding:7px 14px;
  cursor:pointer;
}
.tools-btn:disabled {
  opacity:0.6;
  cursor:default;
}

.tools-error {
  margin-top:8px;
  font-size:0.82rem;
  color:#b91c1c;
}

.tools-suggestions {
  margin-top:10px;
}
.tools-suggestions h3 {
  margin:0 0 4px;
  font-size:0.9rem;
}
.tools-suggestions ul {
  margin:0;
  padding-left:18px;
  font-size:0.9rem;
}
`;
