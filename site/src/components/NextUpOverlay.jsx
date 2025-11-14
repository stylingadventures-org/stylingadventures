import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function NextUpOverlay({
  show,
  currentId,
  episodes,
  onDismiss,
  onPlay,
  autoSeconds = 8,
}) {
  const containerRef = useRef(null);

  const { next, related } = useMemo(() => {
    const idx = Math.max(0, episodes.findIndex((e) => e.id === currentId));
    const next = episodes[(idx + 1) % episodes.length] || null;
    const rel = episodes.filter((e) => e.id !== currentId).slice(0, 10);
    return { next, related: rel };
  }, [episodes, currentId]);

  const [secondsLeft, setSecondsLeft] = useState(autoSeconds);
  useEffect(() => {
    if (!show) return;
    setSecondsLeft(autoSeconds);
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          if (next) onPlay(next.id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [show, autoSeconds, next, onPlay]);

  if (!show) return null;

  return (
    <div className="nextup-backdrop" role="dialog" aria-modal="true">
      <div className="nextup-card" ref={containerRef}>
        <div className="nextup-head">
          <div className="nextup-title">
            Next up
            {next ? (
              <span className="nextup-count">Auto-playing in {secondsLeft}s</span>
            ) : null}
          </div>
          <button className="nextup-close" onClick={onDismiss} aria-label="Close">
            ✕
          </button>
        </div>

        {next && (
          <div className="nextup-primary">
            <button className="nextup-play" onClick={() => onPlay(next.id)}>▶</button>
            <img className="nextup-thumb" src={next.thumb} alt="" />
            <div className="nextup-meta">
              <div className="nextup-label">Up next</div>
              <div className="nextup-name">{next.title}</div>
            </div>
          </div>
        )}

        <div className="nextup-row">
          <div className="nextup-row-title">More you might like</div>
          <div className="nextup-scroll">
            {related.map((ep) => (
              <Link
                key={ep.id}
                to={`/watch/${ep.id}`}
                className="nextup-tile"
                onClick={(e) => {
                  e.preventDefault();
                  onPlay(ep.id);
                }}
              >
                <img src={ep.thumb} alt="" />
                <div className="nextup-tile-name">{ep.title}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
