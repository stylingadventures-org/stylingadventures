// site/src/routes/bestie/Home.jsx
import React, { useCallback, useEffect, useState } from "react";
import { getThumbUrlForMediaKey } from "../../lib/thumbs";

const GQL = {
  topLooks: /* GraphQL */ `
    query TopClosetLooks($limit: Int) {
      topClosetLooks(limit: $limit) {
        id
        title
        storyTitle
        favoriteCount
        mediaKey
      }
    }
  `,
};

async function fallbackGraphql(query, variables) {
  const url =
    window.sa?.cfg?.appsyncUrl ||
    (window.__SA__ && window.__SA__.appsyncUrl);
  const idToken =
    localStorage.getItem("sa:idToken") ||
    localStorage.getItem("idToken") ||
    (window.sa?.session && window.sa.session.idToken);
  if (!url || !idToken) throw new Error("Not signed in");
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: idToken },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

export default function BestieHome() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [topLook, setTopLook] = useState(null);

  const runGql = useCallback(async (q, v) => {
    if (window.sa?.graphql) return window.sa.graphql(q, v);
    return fallbackGraphql(q, v);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const data = await runGql(GQL.topLooks, { limit: 1 });
        const first =
          data && data.topClosetLooks && data.topClosetLooks[0];

        if (first) {
          const thumbUrl = await getThumbUrlForMediaKey(first.mediaKey);
          setTopLook({
            ...first,
            thumbUrl: thumbUrl || null,
          });
        } else {
          setTopLook(null);
        }
      } catch (e) {
        setErr(String(e.message || e));
        setTopLook(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [runGql]);

  return (
    <div className="card">
      <h1 style={{ marginTop: 0 }}>Welcome, Bestie ✨</h1>
      <p style={{ marginBottom: 16 }}>
        You&apos;re in the inner circle. This area will grow into your hub
        for early drops, polls, and behind-the-scenes stories.
      </p>

      {err && (
        <div style={{ color: "#b91c1c", marginBottom: 10 }}>{err}</div>
      )}

      {loading && !topLook && <p>Loading Bestie dashboard…</p>}

      {/* Most loved look – insider version */}
      {topLook && (
        <section style={{ marginTop: 8 }}>
          <h2
            style={{
              margin: "0 0 8px",
              fontSize: 16,
            }}
          >
            Community favorite – you get first dibs
          </h2>

          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              padding: 10,
              borderRadius: 14,
              border: "1px solid #e5e7eb",
              background:
                "linear-gradient(135deg,#eef2ff,#ffffff)",
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 14,
                overflow: "hidden",
                background:
                  "linear-gradient(135deg,#dbeafe,#f9fafb)",
                flexShrink: 0,
              }}
            >
              {topLook.thumbUrl ? (
                <img
                  src={topLook.thumbUrl}
                  alt={
                    topLook.storyTitle ||
                    topLook.title ||
                    "Closet look"
                  }
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    color: "#9ca3af",
                  }}
                >
                  Lala&apos;s look
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  marginBottom: 2,
                }}
              >
                {topLook.storyTitle ||
                  topLook.title ||
                  "Untitled look"}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: 4,
                }}
              >
                ❤️ {topLook.favoriteCount || 0}{" "}
                {topLook.favoriteCount === 1 ? "like" : "likes"} from
                the community.
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#4b5563",
                }}
              >
                Bestie tip: keep an eye on Lala&apos;s closet – fan
                favorites often turn into future Bestie-only drops.
              </div>
            </div>

            <a
              href="/fan/closet-feed"
              style={{
                fontSize: 12,
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid #4f46e5",
                color: "#4f46e5",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              View closet →
            </a>
          </div>
        </section>
      )}

      {!loading && !topLook && !err && (
        <p style={{ marginTop: 12, fontSize: 14, color: "#6b7280" }}>
          As soon as fans start submitting and ❤️-ing outfits for Lala,
          you&apos;ll see the community favorites show up here first.
        </p>
      )}
    </div>
  );
}
