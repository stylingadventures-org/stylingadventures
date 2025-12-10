// site/src/ui/ShopLalasLookButton.jsx
import React from "react";
import { useShopLalasLook } from "../hooks/useShopLalasLook";

export function ShopLalasLookButton({ closetItemId }) {
  const { loading, error, result, fetchLook } = useShopLalasLook(closetItemId);

  return (
    <div style={{ marginTop: "1rem" }}>
      <button
        onClick={fetchLook}
        disabled={loading || !closetItemId}
        style={{
          padding: "0.5rem 1rem",
          borderRadius: "999px",
          border: "none",
          background: "#ff4fa3",
          color: "white",
          fontWeight: "600",
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Loading..." : "Shop Lala's Look"}
      </button>

      {error && (
        <p style={{ color: "red", marginTop: "0.5rem" }}>
          {error}
        </p>
      )}

      {result && result.matches && result.matches.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <h4>Found {result.matches.length} matching products:</h4>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              marginTop: "0.5rem",
            }}
          >
            {result.matches.map((match, idx) => (
              <div
                key={idx}
                style={{
                  border: "1px solid #eee",
                  borderRadius: "12px",
                  padding: "0.75rem",
                  width: "200px",
                }}
              >
                {match.product?.imageUrl && (
                  <img
                    src={match.product.imageUrl}
                    alt={match.product.name}
                    style={{
                      width: "100%",
                      borderRadius: "8px",
                      objectFit: "cover",
                      marginBottom: "0.5rem",
                    }}
                  />
                )}

                <div style={{ fontWeight: "600" }}>
                  {match.product?.name}
                </div>
                <div style={{ fontSize: "0.9rem", color: "#666" }}>
                  {match.product?.brand}
                </div>
                {match.product?.price != null && (
                  <div style={{ marginTop: "0.25rem" }}>
                    ${match.product.price.toFixed(2)}
                  </div>
                )}
                {match.matchConfidence != null && (
                  <div style={{ fontSize: "0.8rem", color: "#999" }}>
                    Match: {match.matchConfidence}%
                  </div>
                )}

                {match.affiliateLinks &&
                  match.affiliateLinks.length > 0 && (
                    <div style={{ marginTop: "0.5rem" }}>
                      {match.affiliateLinks.map((link) => (
                        <a
                          key={link.affiliateLinkId}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-block",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "8px",
                            border: "1px solid #ff4fa3",
                            fontSize: "0.8rem",
                            marginRight: "0.25rem",
                            marginBottom: "0.25rem",
                          }}
                        >
                          {link.retailerName || "Shop"}
                        </a>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
