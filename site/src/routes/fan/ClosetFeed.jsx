// site/src/routes/fan/ClosetFeed.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSignedGetUrl } from "../../lib/sa";

const GQL_FEED = /* GraphQL */ `
  query ClosetFeedSimple {
    closetFeed {
      id
      title
      status
      audience
      mediaKey
      rawMediaKey
      createdAt
    }
  }
`;

export default function ClosetFeed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // optional: “Newest / Most loved” toggle
  const [sort, setSort] = useState("NEWEST");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        if (window.sa?.ready) {
          await window.sa.ready();
        }

        const res = await window.sa.graphql(GQL_FEED);
        const raw = res?.closetFeed || [];

        // Only show APPROVED + PUBLIC in fan view
        const visible = raw.filter((it) => {
          const statusOk = it.status === "APPROVED";
          const audience = it.audience || "PUBLIC";
          const audienceOk = audience === "PUBLIC";
          return statusOk && audienceOk;
        });

        // attach a usable media key
        const withKeys = visible.map((it) => ({
          ...it,
          effectiveKey: it.mediaKey || it.rawMediaKey || null,
        }));

        // presign images
        const hydrated = await Promise.all(
          withKeys.map(async (it) => {
            if (!it.effectiveKey) return it;
            try {
              const url = await getSignedGetUrl(it.effectiveKey);
              return { ...it, mediaUrl: url || null };
            } catch (e) {
              console.warn("[ClosetFeed] presign failed", e);
              return it;
            }
          }),
        );

        hydrated.sort((a, b) => {
          const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
          const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
          if (sort === "NEWEST") return bTime - aTime;
          return bTime - aTime; // placeholder for MOST_LOVED
        });

        if (!cancelled) setItems(hydrated);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setErr("Failed to load Lala's closet.");
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sort]);

  const isInitialLoading = loading && items.length === 0;

  return (
    <main className="container" style={{ maxWidth: 960, margin: "0 auto" }}>
      <div style={{ margin: "16px 0" }}>
        <Link
          to="/fan/closet"
          style={{ fontSize: 14, color: "#6b7280", textDecoration: "none" }}
        >
          ← Back to Style Lala
        </Link>
      </div>

      <section
        className="card"
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 16,
          margin: "16px 0",
          background: "#fff",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ marginTop: 0 }}>Lala&apos;s Closet</h1>
            <p style={{ marginTop: 4, color: "#6b7280", maxWidth: 520 }}>
              These are the approved looks Lala&apos;s team has uploaded. Tap a
              card to see the full outfit. Your favorites help shape future
              Bestie drops.
            </p>
          </div>

          <div>
            <Link
              to="/fan/closet"
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: "1px solid #111827",
                background: "#111827",
                color: "#fff",
                fontSize: 13,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Back to Style lab
            </Link>
          </div>
        </header>

        {/* Sort toggle (client-side only) */}
        <div
          style={{
            marginTop: 16,
            display: "inline-flex",
            borderRadius: 999,
            border: "1px solid #e5e7eb",
            padding: 2,
            background: "#f9fafb",
          }}
        >
          {[
            { value: "NEWEST", label: "Newest" },
            { value: "MOST_LOVED", label: "Most loved" },
          ].map((opt) => {
            const active = opt.value === sort;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSort(opt.value)}
                style={{
                  border: "none",
                  borderRadius: 999,
                  padding: "6px 14px",
                  fontSize: 13,
                  cursor: "pointer",
                  background: active ? "#111827" : "transparent",
                  color: active ? "#fff" : "#4b5563",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {err && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 12px",
              borderRadius: 10,
              background: "#fee2e2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              fontSize: 14,
            }}
          >
            <strong>Oops:</strong> {err}
          </div>
        )}

        {isInitialLoading && (
          <div style={{ marginTop: 24 }} className="sa-muted">
            Loading closet items…
          </div>
        )}

        {!isInitialLoading && !err && items.length === 0 && (
          <div style={{ marginTop: 24, color: "#4b5563", fontSize: 14 }}>
            No approved closet items yet. Style Lala in the{" "}
            <Link to="/fan/closet">Style Lala</Link> tab and submit your looks
            for review.
          </div>
        )}

        {!err && items.length > 0 && (
          <div
            style={{
              marginTop: 24,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 16,
            }}
          >
            {items.map((it) => (
              <article
                key={it.id}
                className="sa-card"
                style={{
                  padding: 10,
                  borderRadius: 16,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                }}
              >
                {it.mediaUrl && (
                  <div
                    style={{
                      borderRadius: 12,
                      overflow: "hidden",
                      marginBottom: 8,
                    }}
                  >
                    <img
                      src={it.mediaUrl}
                      alt={it.title || "Closet item"}
                      style={{
                        width: "100%",
                        display: "block",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}

                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 4,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {it.title || "Untitled look"}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#9ca3af",
                  }}
                >
                  Added{" "}
                  {it.createdAt
                    ? new Date(it.createdAt).toLocaleDateString()
                    : "recently"}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
