// site/src/routes/bestie/Content.jsx
import React, { useState } from "react";
import CreatorAssetPicker from "../../ui/CreatorAssetPicker.jsx";

export default function BestieContent() {
  const [body, setBody] = useState("");
  const [attached, setAttached] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  function handleAttach(asset) {
    // de-dupe by id
    setAttached((prev) => {
      if (!asset?.id) return prev;
      if (prev.some((a) => a.id === asset.id)) return prev;
      return [...prev, asset];
    });
    setShowPicker(false);
  }

  function handleRemove(id) {
    setAttached((prev) => prev.filter((a) => a.id !== id));
  }

  function handlePublish(e) {
    e.preventDefault();
    // TODO: call real createStory / publishStory mutation here
    // - body: caption text
    // - attached: creator assets (plus later closet items)
    alert(
      "Story publish wiring coming next – this is just the shell.\n\nWe’ll send createStory + publishStory with attached asset IDs.",
    );
  }

  const canPublish = Boolean(body.trim());

  return (
    <div className="bestie-content-page">
      <style>{styles}</style>

      <header className="bc-head">
        <h1 className="bc-title">Bestie content studio</h1>
        <p className="bc-sub">
          Draft story posts, attach looks from your closet and creator cabinets,
          then share to the community feed.
        </p>
      </header>

      <main className="bc-main">
        <section className="bc-composer">
          <form onSubmit={handlePublish} className="bc-form">
            <div className="bc-field">
              <label className="bc-label">
                Story caption
                <span className="bc-label-meta">
                  {body.length}/280 characters
                </span>
              </label>
              <textarea
                className="bc-input bc-input--textarea"
                rows={3}
                maxLength={280}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What are you sharing with your Besties today?"
              />
            </div>

            <div className="bc-field">
              <label className="bc-label">
                Attached media
                {attached.length > 0 && (
                  <span className="bc-label-meta">
                    {attached.length} item
                    {attached.length === 1 ? "" : "s"}
                  </span>
                )}
              </label>

              {attached.length === 0 && (
                <div className="bc-empty">
                  Nothing attached yet. Pull in shots from your creator filing
                  cabinets (BTS, thumbnails, refs) or your Bestie closet.
                </div>
              )}

              {attached.length > 0 && (
                <div className="bc-attach-grid">
                  {attached.map((a) => (
                    <article key={a.id} className="bc-attach-card">
                      <div className="bc-attach-thumb">
                        {a.thumbUrl ? (
                          <img src={a.thumbUrl} alt={a.title || "Asset"} />
                        ) : (
                          <span>
                            {a.mediaKey || a.s3Key
                              ? "Media attached"
                              : "No preview"}
                          </span>
                        )}
                      </div>
                      <div className="bc-attach-meta">
                        <div className="bc-attach-title">
                          {a.title || "Untitled asset"}
                        </div>
                        <div className="bc-attach-tags-row">
                          {a.category && (
                            <span className="bc-attach-tag">
                              {String(a.category).toLowerCase()}
                            </span>
                          )}
                          {a.source && (
                            <span className="bc-attach-tag bc-attach-tag--soft">
                              {a.source}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="bc-attach-remove"
                        onClick={() => handleRemove(a.id)}
                      >
                        ✕
                      </button>
                    </article>
                  ))}
                </div>
              )}

              <div className="bc-actions bc-actions--inline">
                <button
                  type="button"
                  className="bc-btn bc-btn-ghost"
                  onClick={() => setShowPicker(true)}
                >
                  📁 Attach from cabinet
                </button>
                {/* Placeholder for future: attach from Bestie closet */}
                <button
                  type="button"
                  className="bc-btn bc-btn-ghost bc-btn-ghost--subtle"
                  onClick={() =>
                    alert(
                      "Attach-from-closet coming next – this will open a closet picker.",
                    )
                  }
                >
                  👗 Attach from closet
                </button>
              </div>
            </div>

            <div className="bc-actions">
              <button
                type="submit"
                className="bc-btn bc-btn-primary"
                disabled={!canPublish}
              >
                Publish to Besties (soon)
              </button>
            </div>
          </form>
        </section>
      </main>

      {showPicker && (
        <CreatorAssetPicker
          onPick={handleAttach}
          onClose={() => setShowPicker(false)}
          // later we can pass filters like defaultCategory / tag / search seed
        />
      )}
    </div>
  );
}

const styles = `
.bestie-content-page {
  max-width:900px;
  margin:0 auto;
  display:flex;
  flex-direction:column;
  gap:12px;
}
.bc-head {
  background:#f9fafb;
  border-radius:18px;
  border:1px solid #e5e7eb;
  padding:14px 16px;
  box-shadow:0 12px 28px rgba(15,23,42,0.08);
}
.bc-title {
  margin:0;
  font-size:1.3rem;
  letter-spacing:-0.03em;
}
.bc-sub {
  margin:4px 0 0;
  font-size:0.9rem;
  color:#6b7280;
}
.bc-main {
  display:flex;
  flex-direction:column;
  gap:10px;
}
.bc-composer {
  background:#ffffff;
  border-radius:18px;
  border:1px solid #e5e7eb;
  padding:14px 16px 16px;
  box-shadow:0 12px 30px rgba(15,23,42,0.06);
}
.bc-form {
  display:flex;
  flex-direction:column;
  gap:10px;
}
.bc-field {
  display:flex;
  flex-direction:column;
  gap:4px;
}
.bc-label {
  font-size:0.8rem;
  color:#374151;
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:6px;
}
.bc-label-meta {
  font-size:0.75rem;
  color:#9ca3af;
}
.bc-input {
  width:100%;
  border-radius:12px;
  border:1px solid #e5e7eb;
  padding:7px 10px;
  font-size:0.9rem;
  outline:none;
}
.bc-input:focus {
  border-color:#4f46e5;
  box-shadow:0 0 0 1px rgba(79,70,229,0.35);
}
.bc-input--textarea {
  resize:vertical;
}
.bc-empty {
  border-radius:10px;
  border:1px dashed #d1d5db;
  background:#f9fafb;
  padding:8px 10px;
  font-size:0.86rem;
  color:#6b7280;
}
.bc-attach-grid {
  margin-top:6px;
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(180px,1fr));
  gap:8px;
}
.bc-attach-card {
  position:relative;
  border-radius:10px;
  border:1px solid #e5e7eb;
  background:#f9fafb;
  overflow:hidden;
  display:flex;
  flex-direction:column;
}
.bc-attach-thumb {
  background:#e5e7eb;
  height:110px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:0.8rem;
  color:#6b7280;
}
.bc-attach-thumb img {
  width:100%;
  height:100%;
  object-fit:cover;
}
.bc-attach-meta {
  padding:6px 8px;
  display:flex;
  flex-direction:column;
  gap:2px;
}
.bc-attach-title {
  font-size:0.86rem;
  font-weight:600;
}
.bc-attach-tags-row {
  display:flex;
  flex-wrap:wrap;
  gap:4px;
}
.bc-attach-tag {
  font-size:0.75rem;
  color:#374151;
  border-radius:999px;
  padding:2px 7px;
  border:1px solid #e5e7eb;
  background:#ffffff;
}
.bc-attach-tag--soft {
  background:#f3f4f6;
  color:#6b7280;
}
.bc-attach-remove {
  position:absolute;
  top:4px;
  right:4px;
  border:none;
  border-radius:999px;
  width:20px;
  height:20px;
  font-size:0.7rem;
  line-height:1;
  background:rgba(17,24,39,0.86);
  color:#f9fafb;
  cursor:pointer;
}

.bc-actions {
  margin-top:4px;
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}
.bc-actions--inline {
  margin-top:8px;
}

.bc-btn {
  border-radius:999px;
  border:1px solid #e5e7eb;
  background:#f9fafb;
  color:#111827;
  padding:7px 13px;
  font-size:0.86rem;
  cursor:pointer;
  text-decoration:none;
  display:inline-flex;
  align-items:center;
  justify-content:center;
}
.bc-btn-primary {
  background:#111827;
  border-color:#111827;
  color:#f9fafb;
}
.bc-btn-primary:disabled {
  opacity:0.6;
  cursor:not-allowed;
}
.bc-btn-ghost {
  background:#ffffff;
}
.bc-btn-ghost--subtle {
  border-style:dashed;
}
`;
