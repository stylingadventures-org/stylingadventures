// site/src/routes/fan/Characters.jsx
import { useState } from "react";
import { Link } from "react-router-dom";

const CHARACTERS = [
  {
    id: 1,
    name: "Lala",
    role: "Protagonist",
    emoji: "👗",
    bio: "The fashion visionary at the heart of everything. Lala loves bold choices, taking risks, and helping her crew discover their authentic style.",
    traits: ["Confident", "Creative", "Bold"],
    relationships: ["Tony (Bestie)", "Renee (Partner)", "The Crew (Squad)"]
  },
  {
    id: 2,
    name: "Tony",
    role: "Best Friend",
    emoji: "👕",
    bio: "Lala's ride-or-die. Tony brings humor, loyalty, and unexpected styling advice. The heart of the group.",
    traits: ["Loyal", "Funny", "Supportive"],
    relationships: ["Lala (Bestie)", "Renee (Friend)", "The Crew (Squad)"]
  },
  {
    id: 3,
    name: "Renee",
    role: "Creative Partner",
    emoji: "✨",
    bio: "The production mastermind behind the scenes. Renee turns Lala's ideas into visual magic and keeps everything running.",
    traits: ["Innovative", "Detail-Oriented", "Professional"],
    relationships: ["Lala (Partner)", "Tony (Friend)", "The Crew (Team)"]
  },
  {
    id: 4,
    name: "The Crew",
    role: "The Squad",
    emoji: "👥",
    bio: "A rotating cast of friends, collaborators, and special guests who bring energy, diversity, and fresh perspectives to every episode.",
    traits: ["Diverse", "Talented", "Energetic"],
    relationships: ["Lala (Leader)", "Tony (Friends)", "Renee (Collaborators)"]
  }
];

export default function FanCharacters() {
  const [expandedChar, setExpandedChar] = useState(null);

  return (
    <div className="fan-characters">
      <style>{styles}</style>

      {/* HERO */}
      <section className="fc-hero card">
        <div className="fc-hero-main">
          <div>
            <p className="fc-pill">👥 CHARACTERS</p>
            <h1 className="fc-title">Meet the LaLa-Verse</h1>
            <p className="fc-sub">
              Get to know Lala and the crew. Every character brings something special 
              to Styling Adventures. Discover their stories, style, and relationships.
            </p>
          </div>
          <div className="fc-hero-card">
            <p className="fc-stat-label">Core Characters</p>
            <p className="fc-stat-value">4+</p>
            <p className="fc-stat-sub">Plus rotating guests</p>
          </div>
        </div>
      </section>

      {/* CHARACTERS GRID */}
      <div className="fc-characters-grid">
        {CHARACTERS.map(character => {
          const isExpanded = expandedChar === character.id;
          return (
            <div
              key={character.id}
              className={`fc-character-card card ${isExpanded ? "expanded" : ""}`}
              onClick={() => setExpandedChar(isExpanded ? null : character.id)}
            >
              <div className="fc-character-header">
                <div className="fc-character-emoji">{character.emoji}</div>
                <div className="fc-character-title-section">
                  <h2 className="fc-character-name">{character.name}</h2>
                  <p className="fc-character-role">{character.role}</p>
                </div>
              </div>

              <p className="fc-character-bio">{character.bio}</p>

              {isExpanded && (
                <div className="fc-character-details">
                  <div className="fc-detail-section">
                    <p className="fc-detail-label">Traits</p>
                    <div className="fc-traits">
                      {character.traits.map(trait => (
                        <span key={trait} className="fc-trait-badge">{trait}</span>
                      ))}
                    </div>
                  </div>

                  <div className="fc-detail-section">
                    <p className="fc-detail-label">Relationships</p>
                    <ul className="fc-relationships">
                      {character.relationships.map(rel => (
                        <li key={rel}>{rel}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* LORE SECTION */}
      <section className="fc-lore card">
        <h2 className="fc-lore-title">The Story So Far</h2>
        <div className="fc-lore-text">
          <p>
            Styling Adventures with Lala is more than a fashion show—it's a story about friendship, 
            creativity, and finding your authentic style. Season 1 followed Lala and her crew as they 
            navigated bold outfit choices, unexpected collaborations, and the magical moments that 
            happen when friends come together to create.
          </p>
          <p>
            Each episode reveals new layers of their personalities, relationships, and style evolution. 
            Whether it's a high-stakes styling challenge or an intimate moment between besties, 
            the LaLa-Verse is built on authenticity and connection.
          </p>
          <p>
            As we move into Season 2, new characters join the adventure, and the stakes get even higher. 
            The crew is growing, the collaborations are expanding, and the fashion is more exciting than ever.
          </p>
        </div>
      </section>

      {/* CONNECTIONS */}
      <section className="fc-connections card">
        <h2 className="fc-connections-title">Character Web</h2>
        <p className="fc-connections-sub">How everyone connects</p>
        <div className="fc-connections-visual">
          <div className="fc-connection-item">
            <p className="fc-connection-icon">👗</p>
            <p className="fc-connection-label">Lala (Hub)</p>
          </div>
          <div className="fc-connections-arrows">
            <div className="fc-arrow">↓</div>
            <div className="fc-arrow">↙</div>
            <div className="fc-arrow">↘</div>
          </div>
          <div className="fc-connections-list">
            <div className="fc-connection-item">
              <p className="fc-connection-icon">👕</p>
              <p className="fc-connection-label">Tony</p>
            </div>
            <div className="fc-connection-item">
              <p className="fc-connection-icon">✨</p>
              <p className="fc-connection-label">Renee</p>
            </div>
            <div className="fc-connection-item">
              <p className="fc-connection-icon">👥</p>
              <p className="fc-connection-label">The Crew</p>
            </div>
          </div>
        </div>
      </section>

      {/* AFFIRM */}
      <section className="fc-affirm card">
        <p className="fc-affirm-main">Friends who style together, stay together.</p>
        <p className="fc-affirm-sub">
          The LaLa-Verse is about authentic connections and bold self-expression. 
          Meet the characters making it all possible. 💜
        </p>
        <Link to="/fan" className="btn btn-primary">Back to Fan Home</Link>
      </section>
    </div>
  );
}

const styles = `
.fan-characters {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.card {
  background: #ffffff;
  border-radius: 22px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 16px 40px rgba(148, 163, 184, 0.35);
}

/* HERO */
.fc-hero {
  padding: 18px 18px 16px;
  background:
    radial-gradient(circle at top left, rgba(243, 232, 255, 0.95), rgba(255, 255, 255, 0.95)),
    radial-gradient(circle at bottom right, rgba(219, 191, 255, 0.95), rgba(255, 255, 255, 1));
  border: 1px solid rgba(248, 250, 252, 0.9);
}

.fc-hero-main {
  display: grid;
  grid-template-columns: minmax(0, 2.4fr) minmax(0, 2fr);
  gap: 18px;
  align-items: flex-start;
}

@media (max-width: 900px) {
  .fc-hero-main {
    grid-template-columns: minmax(0, 1fr);
  }
}

.fc-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  background: rgba(255, 255, 255, 0.9);
  color: #6b21a8;
  border: 1px solid rgba(243, 232, 255, 0.9);
}

.fc-title {
  margin: 8px 0 4px;
  font-size: 1.7rem;
  letter-spacing: -0.03em;
  color: #111827;
}

.fc-sub {
  margin: 0;
  font-size: 0.95rem;
  color: #374151;
  max-width: 520px;
}

.fc-hero-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 20px;
  padding: 12px 14px 14px;
  border: 1px solid rgba(229, 231, 235, 0.9);
  box-shadow: 0 14px 32px rgba(148, 163, 184, 0.55);
}

.fc-stat-label {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #9ca3af;
}

.fc-stat-value {
  margin: 6px 0 4px;
  font-weight: 700;
  font-size: 1.6rem;
  color: #111827;
}

.fc-stat-sub {
  margin: 0;
  font-size: 0.8rem;
  color: #4b5563;
}

/* CHARACTERS GRID */
.fc-characters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}

.fc-character-card {
  padding: 16px;
  cursor: pointer;
  transition: all 200ms ease;
}

.fc-character-card:hover {
  box-shadow: 0 12px 32px rgba(139, 92, 246, 0.2);
  transform: translateY(-2px);
}

.fc-character-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 12px;
}

.fc-character-emoji {
  font-size: 2.4rem;
  flex-shrink: 0;
}

.fc-character-title-section {
  flex: 1;
  min-width: 0;
}

.fc-character-name {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #111827;
}

.fc-character-role {
  margin: 2px 0 0;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
}

.fc-character-bio {
  margin: 0;
  font-size: 0.9rem;
  color: #4b5563;
  line-height: 1.5;
}

.fc-character-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.fc-detail-section {
  margin-bottom: 10px;
}

.fc-detail-label {
  margin: 0 0 6px;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
  font-weight: 600;
}

.fc-traits {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.fc-trait-badge {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 999px;
  font-size: 0.8rem;
  color: #7c3aed;
}

.fc-relationships {
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.9rem;
  color: #4b5563;
}

.fc-relationships li {
  padding: 4px 0;
}

/* LORE */
.fc-lore {
  padding: 18px;
}

.fc-lore-title {
  margin: 0 0 12px;
  font-size: 1.3rem;
  font-weight: 600;
  color: #111827;
}

.fc-lore-text {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fc-lore-text p {
  margin: 0;
  font-size: 0.95rem;
  color: #4b5563;
  line-height: 1.6;
}

/* CONNECTIONS */
.fc-connections {
  padding: 18px;
}

.fc-connections-title {
  margin: 0 0 4px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
}

.fc-connections-sub {
  margin: 0 0 14px;
  font-size: 0.85rem;
  color: #6b7280;
}

.fc-connections-visual {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.fc-connection-item {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fc-connection-icon {
  margin: 0;
  font-size: 2rem;
}

.fc-connection-label {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #111827;
}

.fc-connections-arrows {
  display: flex;
  gap: 40px;
  font-size: 1.4rem;
  color: #9ca3af;
}

.fc-connections-list {
  display: flex;
  gap: 30px;
}

/* AFFIRM */
.fc-affirm {
  padding: 18px;
  text-align: center;
}

.fc-affirm-main {
  margin: 0 0 6px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
}

.fc-affirm-sub {
  margin: 0 0 12px;
  font-size: 0.95rem;
  color: #4b5563;
}

/* BUTTONS */
.btn {
  appearance: none;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #111827;
  border-radius: 999px;
  padding: 9px 14px;
  cursor: pointer;
  transition: transform 40ms ease, background 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 500;
}

.btn:hover {
  background: #f5f3ff;
  border-color: #e0e7ff;
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.25);
}

.btn:active {
  transform: translateY(1px);
}

.btn-primary {
  background: linear-gradient(135deg, #8b5cf6, #d946ef);
  border-color: #8b5cf6;
  color: #fff;
  box-shadow: 0 8px 18px rgba(139, 92, 246, 0.45);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #7c3aed, #c026d3);
  border-color: #7c3aed;
}
`;
