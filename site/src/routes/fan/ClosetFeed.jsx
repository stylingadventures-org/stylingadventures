// site/src/routes/fan/ClosetFeed.jsx
import React, { useCallback, useEffect, useState } from "react";
import { getSA } from "../../lib/sa";
import { getThumbUrlForMediaKey } from "../../lib/thumbs";

const PAGE_SIZE = 12;

export default function ClosetFeed() {
  const [items, setItems] = useState([]);
  const [nextToken, setNextToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [err, setErr] = useState("");

  // fullscreen viewer
  const [viewerItem, setViewerItem] = useState(null);

  const gqlCall = useCallback(async (query, variables) => {
    const SA = await getSA();
    return SA.gql(query, variables);
  }, []);

  const loadPage = useCallback(
    async (opts = { append: false }) => {
      if (!opts.append) {
        setLoading(true);
        setErr("");
      } else {
        setLoadingMore(true);
      }

      try {
        const res = await gqlCall(
          `query ClosetFeed($limit: Int, $nextToken: String) {
            closetFeed(limit: $limit, nextToken: $nextToken) {
              items {
                id
                userId
                ownerSub
                status
                title
                mediaKey
                createdAt
                audience
                storyTitle
                storySeason
                storyVibes
              }
              nextToken
            }
          }`,
          {
            limit: PAGE_SIZE,
            nextToken: opts.append ? nextToken : null,
          }
        );

        const page = res.closetFeed || { items: [], nextToken: null };

        // privacy: only show APPROVED/PUBLISHED + PUBLIC audience (defensive)
        const visible = (page.items || []).filter((it) => {
          const statusOk =
            it.status === "APPROVED" || it.status === "PUBLISHED";
          const audience = it.audience || "PUBLIC";
          const audienceOk = audience === "PUBLIC";
          return statusOk && audienceOk;
        });

        // hydrate with thumbnail URLs
        const hydrated = await Promise.all(
          visible.map(async (it) => {
            const thumbUrl = await getThumbUrlForMediaKey(it.mediaKey);
            return { ...it, thumbUrl: thumbUrl || null };
          })
        );

        setItems((prev) => (opts.append ? [...prev, ...hydrated] : hydrated));
        setNextToken(page.nextToken || null);
      } catch (e) {
        console.error(e);
        setErr("Failed to fetch");
        if (!opts.append) setItems([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [gqlCall, nextToken]
  );

  useEffect(() => {
    loadPage({ append: false });
  }, [loadPage]);

  const openViewer = (item) => setViewerItem(item || null);
  const closeViewer = () => setViewerItem(null);

  const isInitialLoading = loading && items.length === 0;

  return (
    <main className="container" style={{ maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ marginTop: 16, marginBottom: 4 }}>Lala&apos;s Closet</h1>
      <p style={{ marginTop: 0, color: "#6b7280" }}>
        Browse approved closet uploads from the community.
      </p>

      {err && (
        <div
          style={{
            margin: "12px 0",
            padding: "10px 12px",
            borderRadius: 10,
            background: "#fee2e2",
            border: "1px solid #fecaca",
            color: "#991b1b",
          }}
        >
          <strong>Oops:</strong> {err}
        </div>
      )}

      {/* GRID */}
      <section
        style={{
          marginTop: 16,
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        }}
      >
        {/* Skeletons */}
        {isInitialLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={`skeleton-${i}`} style={cardShell}>
              <div style={skeletonImage} />
              <div style={{ padding: "10px 12px" }}>
                <div style={skeletonLine} />
                <div style={{ ...skeletonLine, width: "60%", marginTop: 6 }} />
              </div>
            </div>
          ))}

        {/* Items */}
        {!isInitialLoading &&
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openViewer(item)}
              style={cardButton}
            >
              <div style={cardShellInner}>
                <div style={thumbWrapper}>
                  {item.thumbUrl ? (
                    <img
                      src={item.thumbUrl}
                      alt={item.storyTitle || item.title || "Closet look"}
                      style={thumbImage}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div style={noPhoto}>No photo</div>
                  )}
                </div>
                <div style={{ padding: "10px 12px" }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      marginBottom: 2,
                      textAlign: "left",
                    }}
                  >
                    {item.storyTitle || item.title || "Untitled look"}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      textAlign: "left",
                    }}
                  >
                    by{" "}
                    {item.userId
                      ? `${item.userId.slice(0, 4)}…${item.userId.slice(-4)}`
                      : "—"}
                  </div>
                </div>
              </div>
            </button>
          ))}
      </section>

      {/* Empty state */}
      {!isInitialLoading && items.length === 0 && !err && (
        <p style={{ marginTop: 24, color: "#6b7280" }}>
          No approved closet items yet. Upload from the fan area and wait for
          approval!
        </p>
      )}

      {/* Load more */}
      {nextToken && (
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <button
            type="button"
            onClick={() => loadPage({ append: true })}
            disabled={loadingMore}
            style={loadMoreBtn}
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}

      {/* Fullscreen viewer modal */}
      {viewerItem && (
        <div style={viewerBackdrop} onClick={closeViewer}>
          <div style={viewerCard} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={closeViewer}
              style={viewerCloseBtn}
            >
              ✕
            </button>
            <div style={viewerImageWrap}>
              {viewerItem.thumbUrl ? (
                <img
                  src={viewerItem.thumbUrl}
                  alt={viewerItem.storyTitle || viewerItem.title || "Closet look"}
                  style={viewerImage}
                />
              ) : (
                <div style={{ ...noPhoto, height: "100%" }}>No photo</div>
              )}
            </div>
            <div style={{ padding: 16 }}>
              <h2 style={{ margin: "0 0 4px" }}>
                {viewerItem.storyTitle || viewerItem.title || "Untitled look"}
              </h2>
              <p
                style={{
                  margin: "0 0 4px",
                  color: "#6b7280",
                  fontSize: 14,
                }}
              >
                by{" "}
                {viewerItem.userId
                  ? `${viewerItem.userId.slice(0, 4)}…${viewerItem.userId.slice(
                      -4
                    )}`
                  : "—"}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
                Status: {viewerItem.status} · Audience:{" "}
                {(viewerItem.audience || "PUBLIC").toLowerCase()}
              </p>

              {/* Optional story metadata */}
              {(viewerItem.storySeason ||
                (Array.isArray(viewerItem.storyVibes) &&
                  viewerItem.storyVibes.length > 0)) && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
                  {viewerItem.storySeason && (
                    <div>Season: {viewerItem.storySeason}</div>
                  )}
                  {Array.isArray(viewerItem.storyVibes) &&
                    viewerItem.storyVibes.length > 0 && (
                      <div>
                        Vibes: {viewerItem.storyVibes.join(", ")}
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* --- styles --- */

const cardShell = {
  borderRadius: 16,
  border: "1px solid #e5e7eb",
  background: "#fff",
  overflow: "hidden",
};

const cardButton = {
  padding: 0,
  margin: 0,
  border: "none",
  background: "transparent",
  textAlign: "inherit",
  cursor: "pointer",
  borderRadius: 16,
  transition: "transform 160ms ease, box-shadow 160ms ease",
  boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
};

const cardShellInner = {
  ...cardShell,
  transition: "transform 160ms ease, box-shadow 160ms ease",
};

const thumbWrapper = {
  position: "relative",
  width: "100%",
  paddingBottom: "70%",
  background:
    "linear-gradient(135deg, rgba(219,234,254,1), rgba(248,250,252,1))",
};

const thumbImage = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  borderBottom: "1px solid #e5e7eb",
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
};

const noPhoto = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  color: "#9ca3af",
};

const skeletonImage = {
  ...thumbWrapper,
  background:
    "linear-gradient(90deg, #e5e7eb 0px, #f3f4f6 40px, #e5e7eb 80px)",
  backgroundSize: "600px 100%",
  animation: "sa-shimmer 1.2s infinite linear",
};

const skeletonLine = {
  height: 10,
  borderRadius: 999,
  background: "#e5e7eb",
};

const loadMoreBtn = {
  padding: "8px 16px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "#fff",
  cursor: "pointer",
  fontSize: 14,
};

const viewerBackdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 40,
};

const viewerCard = {
  width: "min(90vw, 720px)",
  maxHeight: "90vh",
  background: "#fff",
  borderRadius: 20,
  overflow: "hidden",
  position: "relative",
  boxShadow: "0 25px 60px rgba(15,23,42,0.4)",
  display: "flex",
  flexDirection: "column",
};

const viewerCloseBtn = {
  position: "absolute",
  top: 10,
  right: 10,
  border: "none",
  background: "rgba(15,23,42,0.6)",
  color: "#fff",
  borderRadius: 999,
  width: 28,
  height: 28,
  cursor: "pointer",
};

const viewerImageWrap = {
  width: "100%",
  paddingBottom: "65%",
  position: "relative",
  background:
    "linear-gradient(135deg, rgba(219,234,254,1), rgba(248,250,252,1))",
};

const viewerImage = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "contain",
  backgroundColor: "#000",
};

