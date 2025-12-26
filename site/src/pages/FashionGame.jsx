import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { graphqlQuery } from '../api/graphql'
import { INITIALIZE_GAME, SUBMIT_OUTFIT, GET_LEADERBOARD } from '../api/graphql'
import ChallengeCard from '../components/ChallengeCard'
import OutfitBuilder from '../components/OutfitBuilder'
import '../styles/fashion-game.css'

/**
 * Fashion Game - main gameplay loop
 */
export default function FashionGame() {
  const { userContext } = useAuth()
  const [gameState, setGameState] = useState(null)
  const [assets, setAssets] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [tab, setTab] = useState('game') // 'game' | 'leaderboard'

  useEffect(() => {
    if (userContext?.sub) {
      initializeGame()
      loadAssets()
      loadLeaderboard()
    }
  }, [userContext])

  const initializeGame = async () => {
    try {
      setLoading(true)
      const data = await graphqlQuery(INITIALIZE_GAME, {
        userId: userContext.sub,
      })
      setGameState(data?.initializeGame)
    } catch (err) {
      console.error('Failed to initialize game:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadAssets = async () => {
    // TODO: Load creator's assets from cabinet
    // For now, we'll load placeholder assets
    setAssets([
      {
        id: '1',
        name: 'Red Summer Dress',
        type: 'image',
        url: 'https://via.placeholder.com/200?text=Red+Dress',
      },
      {
        id: '2',
        name: 'Blue Jeans',
        type: 'image',
        url: 'https://via.placeholder.com/200?text=Blue+Jeans',
      },
      {
        id: '3',
        name: 'White Sneakers',
        type: 'image',
        url: 'https://via.placeholder.com/200?text=Sneakers',
      },
      {
        id: '4',
        name: 'Black Blazer',
        type: 'image',
        url: 'https://via.placeholder.com/200?text=Blazer',
      },
      {
        id: '5',
        name: 'Gold Accessories',
        type: 'image',
        url: 'https://via.placeholder.com/200?text=Accessories',
      },
    ])
  }

  const loadLeaderboard = async () => {
    try {
      const data = await graphqlQuery(GET_LEADERBOARD, { limit: 10 })
      setLeaderboard(data?.getLeaderboard?.items || [])
    } catch (err) {
      console.error('Failed to load leaderboard:', err)
    }
  }

  const handleSubmitOutfit = async (selectedAssets) => {
    setSubmitting(true)
    try {
      const data = await graphqlQuery(SUBMIT_OUTFIT, {
        input: {
          userId: userContext.sub,
          gameId: gameState.gameId,
          outfit: selectedAssets,
          challengeId: gameState.challengeId,
        },
      })

      const submitResult = data?.submitOutfit
      setResult(submitResult)

      // Update game state with new challenge
      if (submitResult?.nextChallengeId) {
        setGameState({
          ...gameState,
          challengeId: submitResult.nextChallengeId,
          coins: gameState.coins + submitResult.coinsEarned,
          xp: gameState.xp + submitResult.xpGained,
        })
      }

      // Refresh leaderboard
      await loadLeaderboard()
    } catch (err) {
      console.error('Failed to submit outfit:', err)
      setResult({ error: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (!userContext) {
    return <div style={{ padding: '20px' }}>Please log in to play</div>
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading game...</p>
      </div>
    )
  }

  if (!gameState) {
    return <div style={{ padding: '20px' }}>Failed to start game</div>
  }

  return (
    <div className="fashion-game-container">
      {/* Game Header */}
      <div className="game-header">
        <div>
          <h1>Fashion Challenge Game</h1>
          <p>Create stylish outfits and earn coins!</p>
        </div>
        <div className="game-stats">
          <div className="stat">
            <span className="stat-label">💰 Coins</span>
            <span className="stat-value">{gameState.coins}</span>
          </div>
          <div className="stat">
            <span className="stat-label">⭐ Level</span>
            <span className="stat-value">{gameState.level}</span>
          </div>
          <div className="stat">
            <span className="stat-label">✨ XP</span>
            <span className="stat-value">{gameState.xp}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="game-tabs">
        <button
          className={tab === 'game' ? 'active' : ''}
          onClick={() => setTab('game')}
        >
          🎮 Game
        </button>
        <button
          className={tab === 'leaderboard' ? 'active' : ''}
          onClick={() => setTab('leaderboard')}
        >
          🏆 Leaderboard
        </button>
      </div>

      {/* Game Content */}
      <div className="game-content">
        {tab === 'game' ? (
          <>
            {/* Result Display */}
            {result && (
              <div
                style={{
                  backgroundColor: result.passed ? '#d1fae5' : '#fee2e2',
                  border: `2px solid ${result.passed ? '#10b981' : '#ef4444'}`,
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '20px',
                }}
              >
                <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
                  {result.passed ? '🎉 Outfit Accepted!' : '😊 Not quite...'}
                </p>
                <p style={{ margin: '5px 0 0 0', color: result.passed ? '#10b981' : '#ef4444' }}>
                  +{result.coinsEarned} coins, +{result.xpGained} XP
                </p>
              </div>
            )}

            {/* Challenge */}
            <ChallengeCard challengeId={gameState.challengeId} />

            {/* Outfit Builder */}
            <OutfitBuilder
              availableAssets={assets}
              onSubmit={handleSubmitOutfit}
              requiredSlots={5}
            />
          </>
        ) : (
          /* Leaderboard */
          <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '20px' }}>
            <h2>Top Players</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Rank</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Player</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Level</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>💰 Coins</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((player, idx) => (
                  <tr
                    key={player.userId}
                    style={{
                      borderBottom: '1px solid #e5e7eb',
                      backgroundColor:
                        player.userId === userContext.sub ? '#e0e7ff' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '10px' }}>
                      {idx === 0 && '🥇'}
                      {idx === 1 && '🥈'}
                      {idx === 2 && '🥉'}
                      {idx > 2 && idx + 1}
                    </td>
                    <td style={{ padding: '10px' }}>
                      {player.username}
                      {player.userId === userContext.sub && ' (You)'}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      Level {player.level}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      {player.coins.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
