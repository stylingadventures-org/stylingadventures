import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, concat } from '@apollo/client'
import { parseJwt } from './cognito'

let apolloClient = null

/**
 * Create Apollo client with auth interceptor
 */
async function createApolloClient() {
  // Get config
  if (window.__CONFIG_LOADED__) {
    await window.__CONFIG_LOADED__
  }

  const config = window.__CONFIG__
  if (!config?.appsyncUrl) {
    console.warn('AppSync URL not configured')
    return null
  }

  // Auth link that adds JWT to headers OR API key for public access
  const authLink = new ApolloLink((operation, forward) => {
    const idToken = localStorage.getItem('id_token')
    const headers = {}
    
    if (idToken) {
      // If user is authenticated, send JWT token
      headers.Authorization = idToken
    } else if (config?.appsyncApiKey) {
      // If not authenticated, use API key for @aws_api_key queries
      headers['x-api-key'] = config.appsyncApiKey
    }
    
    operation.setContext({
      headers,
    })

    return forward(operation)
  })

  // HTTP link to AppSync
  const httpLink = new HttpLink({
    uri: config.appsyncUrl,
    credentials: 'include',
  })

  const client = new ApolloClient({
    ssrMode: typeof window === 'undefined', // Disable SSR
    link: concat(authLink, httpLink),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all', // Continue executing queries with errors
      },
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all', // Return partial results even if there are errors
      },
    },
  })

  return client
}

/**
 * Get or create Apollo client (singleton)
 */
export async function getApolloClient() {
  if (!apolloClient) {
    apolloClient = await createApolloClient()
  }
  return apolloClient
}

/**
 * Reset Apollo client cache (on logout)
 */
export function resetApolloClient() {
  if (apolloClient) {
    apolloClient.cache.reset()
  }
}
