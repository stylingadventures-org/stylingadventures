let config = null

// Get config from window or fetch it
async function getConfig() {
  if (window.__CONFIG__) {
    return window.__CONFIG__
  }
  if (!config) {
    const response = await fetch('/config.json')
    config = await response.json()
  }
  return config
}

export async function graphqlQuery(query, variables = {}, token = null) {
  const cfg = await getConfig()
  const API_URL = cfg.appsyncUrl
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': cfg.appsyncApiKey || 'da2-qou2vcqhh5hmnfqcaieqlkfevi', // AppSync API key from config
  }

  // If user is authenticated, use their token
  if (token) {
    headers['Authorization'] = `${token}`
  }

  try {
    const response = await fetch(cfg.appsyncUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    })

    const data = await response.json()

    if (data.errors) {
      throw new Error(data.errors[0]?.message || 'GraphQL error')
    }

    return data.data
  } catch (error) {
    console.error('GraphQL error:', error)
    throw error
  }
}

// Query to get featured creators for /discover
export const GET_CREATORS = `
  query GetCreators($limit: Int, $nextToken: String) {
    listCreators(limit: $limit, nextToken: $nextToken) {
      items {
        id
        cognitoSub
        displayName
        handle
        bio
        avatarUrl
        followers
        tracks
        genres
        tier
        socialLinks {
          twitter
          instagram
          tiktok
        }
      }
      nextToken
    }
  }
`

// Query to get a single creator profile
export const GET_CREATOR = `
  query GetCreator($id: String!) {
    getCreator(id: $id) {
      id
      cognitoSub
      displayName
      handle
      bio
      avatarUrl
      followers
      tracks
      genres
      tier
      socialLinks {
        twitter
        instagram
        tiktok
      }
    }
  }
`

// Mutation to create user profile (Player or Bestie)
export const CREATE_PLAYER_PROFILE = `
  mutation CreatePlayerProfile($input: CreatePlayerProfileInput!) {
    createPlayerProfile(input: $input) {
      id
      sub
      email
      displayName
      userType
      xp
      coins
      createdAt
    }
  }
`

// Mutation to create/update bestie subscription
export const CREATE_BESTIE_SUBSCRIPTION = `
  mutation CreateBestieSubscription($input: CreateBestieSubscriptionInput!) {
    createBestieSubscription(input: $input) {
      id
      sub
      status
      tier
      renewsAt
      createdAt
    }
  }
`

// ========================================
// Creator Cabinet Queries
// ========================================

export const LIST_CREATOR_ASSETS = `
  query ListCreatorAssets($userId: ID!) {
    listCreatorAssets(userId: $userId) {
      items {
        id
        name
        type
        url
        cabinet
        createdAt
      }
      nextToken
    }
  }
`

export const CREATE_ASSET = `
  mutation CreateAsset($input: CreateAssetInput!) {
    createAsset(input: $input) {
      id
      name
      type
      url
      cabinet
      createdAt
    }
  }
`

export const DELETE_ASSET = `
  mutation DeleteAsset($id: ID!, $userId: ID!) {
    deleteAsset(id: $id, userId: $userId)
  }
`

// ========================================
// Fashion Game Queries
// ========================================

export const INITIALIZE_GAME = `
  mutation InitializeGame($userId: ID!) {
    initializeGame(userId: $userId) {
      gameId
      level
      xp
      coins
      challengeId
      status
      startedAt
    }
  }
`

export const SUBMIT_OUTFIT = `
  mutation SubmitOutfit($input: SubmitOutfitInput!) {
    submitOutfit(input: $input) {
      passed
      coinsEarned
      xpGained
      nextChallengeId
    }
  }
`

export const GET_LEADERBOARD = `
  query GetLeaderboard($limit: Int) {
    getLeaderboard(limit: $limit) {
      items {
        userId
        username
        coins
        level
        rank
      }
    }
  }
`

export const GET_CHALLENGE = `
  query GetChallenge($challengeId: ID!) {
    getChallenge(challengeId: $challengeId) {
      id
      theme
      requiredColors
      requiredStyles
      outfitSlots
      description
    }
  }
`

// ========================================
// Episode & Stories Queries
// ========================================

export const LIST_EPISODES = `
  query ListEpisodes($creatorId: ID, $limit: Int) {
    listEpisodes(creatorId: $creatorId, limit: $limit) {
      items {
        id
        title
        description
        videoUrl
        creatorId
        status
        createdAt
      }
      nextToken
    }
  }
`

export const GET_EPISODE = `
  query GetEpisode($id: ID!) {
    getEpisode(id: $id) {
      id
      title
      description
      videoUrl
      creatorId
      status
      reactions
      comments {
        id
        text
        userId
        createdAt
      }
      createdAt
    }
  }
`

export const ADD_EPISODE_COMMENT = `
  mutation AddEpisodeComment($input: AddEpisodeCommentInput!) {
    addEpisodeComment(input: $input) {
      id
      text
      userId
      createdAt
    }
  }
`
