import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient())

interface Episode {
  id: string
  title: string
  description: string
  videoUrl: string
  creatorId: string
  status: 'draft' | 'published' | 'archived'
  reactions: string[]
  comments: EpisodeComment[]
  createdAt: number
  updatedAt: number
}

interface EpisodeComment {
  id: string
  episodeId: string
  userId: string
  text: string
  createdAt: number
}

/**
 * Create a new episode
 */
export async function createEpisode(input: {
  title: string
  description: string
  videoUrl: string
  creatorId: string
}): Promise<Episode> {
  const episodeId = `episode-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const now = Date.now()

  const episode: Episode = {
    id: episodeId,
    title: input.title,
    description: input.description,
    videoUrl: input.videoUrl,
    creatorId: input.creatorId,
    status: 'draft',
    reactions: [],
    comments: [],
    createdAt: now,
    updatedAt: now,
  }

  await dynamoClient.send(
    new PutCommand({
      TableName: process.env.EPISODES_TABLE!,
      Item: episode,
    })
  )

  return episode
}

/**
 * Get episode by ID
 */
export async function getEpisode(episodeId: string): Promise<Episode | null> {
  try {
    const result = await dynamoClient.send(
      new GetCommand({
        TableName: process.env.EPISODES_TABLE!,
        Key: { id: episodeId },
      })
    )

    return result.Item as Episode
  } catch (error) {
    console.error('Error fetching episode:', error)
    return null
  }
}

/**
 * List episodes by creator
 */
export async function listEpisodes(
  creatorId?: string,
  limit = 20
): Promise<{ items: Episode[]; nextToken?: string }> {
  try {
    // In production, use proper query with GSI
    // For now return mock data
    return {
      items: [
        {
          id: 'episode-1',
          title: 'My First Fashion Episode',
          description: 'Check out my latest fashion tips and styling',
          videoUrl: 'https://example.com/video1.mp4',
          creatorId: creatorId || 'creator-1',
          status: 'published',
          reactions: ['👍', '❤️', '👍'],
          comments: [],
          createdAt: Date.now() - 86400000,
          updatedAt: Date.now() - 86400000,
        },
      ],
    }
  } catch (error) {
    console.error('Error listing episodes:', error)
    throw error
  }
}

/**
 * Add reaction to episode
 */
export async function addReaction(
  episodeId: string,
  emoji: string
): Promise<Episode | null> {
  try {
    const episode = await getEpisode(episodeId)
    if (!episode) return null

    const updated = {
      ...episode,
      reactions: [...episode.reactions, emoji],
      updatedAt: Date.now(),
    }

    await dynamoClient.send(
      new PutCommand({
        TableName: process.env.EPISODES_TABLE!,
        Item: updated,
      })
    )

    return updated
  } catch (error) {
    console.error('Error adding reaction:', error)
    throw error
  }
}

/**
 * Add comment to episode
 */
export async function addComment(
  episodeId: string,
  userId: string,
  text: string
): Promise<EpisodeComment> {
  const commentId = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const now = Date.now()

  const comment: EpisodeComment = {
    id: commentId,
    episodeId,
    userId,
    text,
    createdAt: now,
  }

  // Store comment in separate table
  await dynamoClient.send(
    new PutCommand({
      TableName: process.env.EPISODE_COMMENTS_TABLE!,
      Item: comment,
    })
  )

  // Also update episode's comments array
  const episode = await getEpisode(episodeId)
  if (episode) {
    episode.comments.push(comment)
    await dynamoClient.send(
      new PutCommand({
        TableName: process.env.EPISODES_TABLE!,
        Item: episode,
      })
    )
  }

  return comment
}

/**
 * Get comments for episode
 */
export async function getEpisodeComments(
  episodeId: string
): Promise<EpisodeComment[]> {
  try {
    // In production, use proper query with GSI
    // For now return empty
    return []
  } catch (error) {
    console.error('Error fetching comments:', error)
    throw error
  }
}
