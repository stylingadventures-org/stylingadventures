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
    
    if (idToken) {
      // If user is authenticated, send JWT token
      operation.setContext({
        headers: {
          Authorization: idToken,
        },
      })
    } else {
      // If not authenticated, AppSync will try API_KEY auth for @aws_api_key queries
      // No header needed - AppSync defaults to API_KEY for unauthenticated requests
      // on operations marked with @aws_api_key
      operation.setContext({
        headers: {
          // Empty headers - let AppSync handle public API key auth
        },
      })
    }

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
