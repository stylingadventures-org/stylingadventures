// /site/src/routes/bestie/Overview.jsx
import React from "react";
export default function BestieOverview() {
  return <div style={card()}>Welcome, Bestie! 🎉</div>;
}

// /site/src/routes/bestie/Perks.jsx
import React from "react";
export default function BestiePerks() {
  return <div style={card()}>Your Bestie perks live here.</div>;
}

// /site/src/routes/bestie/Content.jsx
import React from "react";
export default function BestieContent() {
  return <div style={card()}>Exclusive content for Bestie members.</div>;
}

function card() {
  return { border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: "#fff" };
}
