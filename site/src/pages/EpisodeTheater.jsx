import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { graphqlQuery } from '../api/graphql'
import { GET_EPISODE, ADD_EPISODE_COMMENT } from '../api/graphql'
import '../styles/episode-theater.css'

/**
 * Episode Theater - watch episodes and interact
 */
export default function EpisodeTheater() {
  const { episodeId } = useParams()
  const { userContext } = useAuth()
  const [episode, setEpisode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [reactions, setReactions] = useState({})

  useEffect(() => {
    if (episodeId) {
      loadEpisode()
    }
  }, [episodeId])

  const loadEpisode = async () => {
    try {
      setLoading(true)
      const data = await graphqlQuery(GET_EPISODE, { id: episodeId })
      setEpisode(data?.getEpisode)
      // Count reactions
      if (data?.getEpisode?.reactions) {
        const reactionCounts = {}
        data.getEpisode.reactions.forEach((r) => {
          reactionCounts[r] = (reactionCounts[r] || 0) + 1
        })
        setReactions(reactionCounts)
      }
    } catch (err) {
      console.error('Failed to load episode:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return

    setSubmittingComment(true)
    try {
      const data = await graphqlQuery(ADD_EPISODE_COMMENT, {
        input: {
          episodeId,
          text: comment,
          userId: userContext.sub,
        },
      })

      const newComment = data?.addEpisodeComment
      setEpisode({
        ...episode,
        comments: [...(episode.comments || []), newComment],
      })
      setComment('')
    } catch (err) {
      console.error('Failed to add comment:', err)
    } finally {
      setSubmittingComment(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading episode...</p>
      </div>
    )
  }

  if (!episode) {
    return <div style={{ padding: '20px' }}>Episode not found</div>
  }

  return (
    <div className="episode-theater-container">
      {/* Video Player */}
      <div className="video-player-wrapper">
        <video
          src={episode.videoUrl}
          controls
          style={{
            width: '100%',
            height: 'auto',
            backgroundColor: '#000',
            borderRadius: '8px',
          }}
        />
      </div>

      {/* Episode Info */}
      <div className="episode-info">
        <h1>{episode.title}</h1>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          {episode.description}
        </p>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
          <span
            style={{
              backgroundColor:
                episode.status === 'published' ? '#d1fae5' : '#fef3c7',
              color: episode.status === 'published' ? '#10b981' : '#d97706',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            {episode.status === 'published' ? '🎬 Published' : '⏰ Coming Soon'}
          </span>

          <div style={{ color: '#999', fontSize: '0.9rem' }}>
            Uploaded {new Date(episode.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* Reactions */}
        <div style={{ marginBottom: '20px' }}>
          <h3>Reactions</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['👍', '❤️', '😍', '🔥', '😂'].map((emoji) => (
              <button
                key={emoji}
                style={{
                  padding: '8px 12px',
                  backgroundColor: reactions[emoji] ? '#e0e7ff' : '#f0f0f0',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                {emoji} {reactions[emoji] || 0}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="comments-section">
        <h2>Comments ({episode.comments?.length || 0})</h2>

        {/* Comment Form */}
        {userContext && (
          <form
            onSubmit={handleAddComment}
            style={{
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
            }}
          >
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                resize: 'vertical',
                minHeight: '80px',
              }}
            />
            <button
              type="submit"
              disabled={submittingComment || !comment.trim()}
              style={{
                marginTop: '10px',
                padding: '10px 20px',
                backgroundColor: comment.trim() ? '#2563eb' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: comment.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              {submittingComment ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        )}

        {!userContext && (
          <p style={{ color: '#666', marginBottom: '20px' }}>
            <a href="/signin">Sign in</a> to post comments
          </p>
        )}

        {/* Comments List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {episode.comments && episode.comments.length > 0 ? (
            episode.comments.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  borderLeft: '3px solid #2563eb',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <strong>User #{c.userId}</strong>
                  <span style={{ fontSize: '0.85rem', color: '#999' }}>
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                </div>
                <p style={{ margin: 0, color: '#333' }}>{c.text}</p>
              </div>
            ))
          ) : (
            <p style={{ color: '#999' }}>No comments yet. Be the first to comment!</p>
          )}
        </div>
      </div>
    </div>
  )
}
