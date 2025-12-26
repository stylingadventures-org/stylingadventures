import React, { useState, useEffect } from 'react'
import { graphqlQuery } from '../api/graphql'
import { GET_CHALLENGE } from '../api/graphql'

/**
 * Display the current fashion challenge
 */
export default function ChallengeCard({ challengeId }) {
  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChallenge()
  }, [challengeId])

  const loadChallenge = async () => {
    try {
      setLoading(true)
      const data = await graphqlQuery(GET_CHALLENGE, { challengeId })
      setChallenge(data?.getChallenge)
    } catch (err) {
      console.error('Failed to load challenge:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading challenge...</div>
  if (!challenge) return <div>Challenge not found</div>

  const themeEmojis = {
    'casual-beach': '🏖️',
    'formal-dinner': '🍽️',
    'festival-vibes': '🎪',
    'street-style': '🏙️',
    'party-night': '🎉',
  }

  const emoji = themeEmojis[challenge.theme] || '✨'

  return (
    <div
      style={{
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '30px',
        border: '2px solid #e5e7eb',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
        <div style={{ fontSize: '3rem' }}>{emoji}</div>
        <div>
          <h2 style={{ margin: '0 0 5px 0' }}>
            {challenge.theme.replace(/-/g, ' ').toUpperCase()}
          </h2>
          <p style={{ margin: 0, color: '#666' }}>Fashion Challenge</p>
        </div>
      </div>

      <p style={{ fontSize: '1.05rem', marginBottom: '15px' }}>
        {challenge.description || 'Create an outfit that matches this theme!'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {challenge.requiredColors && challenge.requiredColors.length > 0 && (
          <div>
            <strong>Required Colors:</strong>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              {challenge.requiredColors.map((color) => (
                <div
                  key={color}
                  style={{
                    width: '30px',
                    height: '30px',
                    backgroundColor: color,
                    borderRadius: '50%',
                    border: '2px solid #ddd',
                    title: color,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {challenge.requiredStyles && challenge.requiredStyles.length > 0 && (
          <div>
            <strong>Required Styles:</strong>
            <div style={{ marginTop: '8px' }}>
              {challenge.requiredStyles.map((style) => (
                <span
                  key={style}
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#e5e7eb',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    marginRight: '8px',
                    marginBottom: '8px',
                    fontSize: '0.9rem',
                  }}
                >
                  {style}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e5e7eb' }}>
        <p style={{ margin: '0', color: '#999', fontSize: '0.9rem' }}>
          Outfit slots needed: <strong>{challenge.outfitSlots}</strong>
        </p>
      </div>
    </div>
  )
}
