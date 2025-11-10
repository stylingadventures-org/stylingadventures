import React, { useEffect, useState } from "react";
import { canAccessTier } from "../lib/roles";

const TIERS = ["Fan", "Bestie", "Collab", "Prime"];

export default function TierTabs({ activeTier }) {
  const [role, setRole] = useState("FAN");

  useEffect(() => {
    (async () => {
      const SA = await window.getSA?.();
      setRole(SA?.getRole?.() || "FAN");
    })();
  }, []);

  function hrefFor(tier) {
    // Map tier → route. For Option A:
    if (tier === "Fan") return "/fan";
    if (tier === "Bestie") return "/bestie";
    if (tier === "Collab") return "/collab";   // add later when ready
    if (tier === "Prime") return "/prime";     // add later when ready
    return "/fan";
  }

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
      {TIERS.map((tier) => {
        const isActive = tier.toLowerCase() === String(activeTier || "").toLowerCase();
        const hasAccess = canAccessTier(role, tier);

        return (
          <a
            key={tier}
            href={hrefFor(tier)}
            title={hasAccess ? tier : `Upgrade to ${tier}`}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 999,
              padding: "6px 10px",
              textDecoration: "none",
              fontSize: 14,
              background: isActive ? "#111827" : "#fff",
              color: isActive ? "#fff" : hasAccess ? "#374151" : "#9ca3af",
              opacity: hasAccess ? 1 : 0.7,
              pointerEvents: "auto", // if you want to disable clicks for locked tiers: set to "none" when !hasAccess
            }}
          >
            {tier}{!hasAccess ? " 🔒" : ""}
          </a>
        );
      })}
    </div>
  );
}
