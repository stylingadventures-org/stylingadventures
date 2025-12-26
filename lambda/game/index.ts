import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient())

interface GameState {
  gameId: string
  userId: string
  level: number
  xp: number
  coins: number
  outfit: string[]
  challengeId: string
  status: 'active' | 'completed' | 'failed'
  startedAt: number
  completedAt?: number
}

interface Challenge {
  id: string
  theme: string
  requiredColors: string[]
  requiredStyles: string[]
  outfitSlots: number
  description: string
}

const CHALLENGES: { [key: string]: Challenge } = {
  'casual-beach': {
    id: 'casual-beach',
    theme: 'casual-beach',
    requiredColors: ['#87CEEB', '#FFD700'],
    requiredStyles: ['light', 'comfortable'],
    outfitSlots: 5,
    description: 'Create a casual beach-ready look with light colors and comfortable pieces',
  },
  'formal-dinner': {
    id: 'formal-dinner',
    theme: 'formal-dinner',
    requiredColors: ['#000000', '#FFD700'],
    requiredStyles: ['elegant', 'sophisticated'],
    outfitSlots: 5,
    description: 'Put together a formal dinner outfit with elegant and sophisticated pieces',
  },
  'festival-vibes': {
    id: 'festival-vibes',
    theme: 'festival-vibes',
    requiredColors: ['#FF6347', '#FFD700', '#00CED1'],
    requiredStyles: ['colorful', 'trendy'],
    outfitSlots: 5,
    description: 'Create a vibrant festival look with bold colors and trendy pieces',
  },
  'street-style': {
    id: 'street-style',
    theme: 'street-style',
    requiredColors: ['#808080', '#000000'],
    requiredStyles: ['casual', 'cool'],
    outfitSlots: 5,
    description: 'Build a cool street style outfit with neutral tones',
  },
  'party-night': {
    id: 'party-night',
    theme: 'party-night',
    requiredColors: ['#FF1493', '#FFD700', '#000000'],
    requiredStyles: ['glamorous', 'fun'],
    outfitSlots: 5,
    description: 'Create a fun and glamorous party outfit',
  },
}

/**
 * Initialize a new game for a user
 */
export async function initializeGame(userId: string): Promise<GameState> {
  const gameId = `game-${userId}-${Date.now()}`
  const challengeId = getRandomChallenge()

  const gameState: GameState = {
    gameId,
    userId,
    level: 1,
    xp: 0,
    coins: 0,
    outfit: [],
    challengeId,
    status: 'active',
    startedAt: Date.now(),
  }

  await dynamoClient.send(
    new PutCommand({
      TableName: process.env.GAMES_TABLE!,
      Item: gameState,
    })
  )

  return gameState
}

/**
 * Submit an outfit and evaluate it
 */
export async function submitOutfit(
  userId: string,
  gameId: string,
  outfit: string[],
  challengeId: string
): Promise<{
  passed: boolean
  coinsEarned: number
  xpGained: number
  nextChallengeId: string
}> {
  const challenge = CHALLENGES[challengeId] || CHALLENGES['casual-beach']

  // Evaluate outfit (simplified scoring)
  const score = evaluateOutfit(outfit, challenge)
  const passed = score >= 70

  const coinsEarned = passed ? Math.floor(score / 10) * 10 : 5
  const xpGained = passed ? 25 : 10

  // Get next challenge
  const nextChallengeId = getRandomChallenge()

  // Update game state
  await updateGameState(userId, gameId, {
    coins: coinsEarned,
    xp: xpGained,
    challengeId: nextChallengeId,
    status: 'completed',
    completedAt: Date.now(),
  })

  return {
    passed,
    coinsEarned,
    xpGained,
    nextChallengeId,
  }
}

/**
 * Evaluate an outfit against a challenge
 */
function evaluateOutfit(outfit: string[], challenge: Challenge): number {
  let score = 50

  // Award points for outfit completion
  if (outfit.length === challenge.outfitSlots) {
    score += 30
  } else {
    score += (outfit.length / challenge.outfitSlots) * 20
  }

  // Award points for color coordination (simplified)
  const colorBonus = Math.min(outfit.length * 5, 20)
  score += colorBonus

  return Math.min(score, 100)
}

/**
 * Get a random challenge
 */
function getRandomChallenge(): string {
  const themes = [
    'casual-beach',
    'formal-dinner',
    'festival-vibes',
    'street-style',
    'party-night',
  ]
  return themes[Math.floor(Math.random() * themes.length)]
}

/**
 * Get challenge details
 */
export function getChallenge(challengeId: string): Challenge {
  return CHALLENGES[challengeId] || CHALLENGES['casual-beach']
}

/**
 * Update game state
 */
async function updateGameState(
  userId: string,
  gameId: string,
  updates: Partial<GameState>
) {
  const updateExpression = Object.keys(updates)
    .map((k) => `${k} = :${k}`)
    .join(', ')

  const expressionAttributeValues = Object.keys(updates).reduce(
    (acc, k) => ({ ...acc, [`:${k}`]: updates[k as keyof GameState] }),
    {}
  )

  await dynamoClient.send(
    new UpdateCommand({
      TableName: process.env.GAMES_TABLE!,
      Key: { gameId, userId },
      UpdateExpression: `SET ${updateExpression}`,
      ExpressionAttributeValues: expressionAttributeValues,
    })
  )
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(limit = 10) {
  try {
    // In production, query DynamoDB with proper GSI
    // For now return mock data
    return {
      items: [
        { userId: 'user-1', username: 'StyleQueen', coins: 5000, level: 15, rank: 1 },
        { userId: 'user-2', username: 'FashionKing', coins: 4500, level: 14, rank: 2 },
        { userId: 'user-3', username: 'TrendSetter', coins: 4000, level: 13, rank: 3 },
      ],
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    throw error
  }
}
