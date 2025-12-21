import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
} from "@apollo/client";
import { appSyncConfig } from "../lib/appSyncConfig";

let apolloClient = null;
let currentIdToken = null;

// Store the current token so authLink can access it dynamically
export const setIdToken = (token) => {
  currentIdToken = token;
};

export const createApolloClient = (idToken) => {
  // Always update the current token
  currentIdToken = idToken;

  // Create client only once - authLink will read currentIdToken dynamically
  if (apolloClient) {
    return apolloClient;
  }

  // HTTP link to AppSync endpoint
  const httpLink = new HttpLink({
    uri: appSyncConfig.graphQLEndpoint,
  });

  // Auth link that reads the current token dynamically on each request
  const authLink = new ApolloLink((operation, forward) => {
    // Read token value at request time, not initialization time
    if (currentIdToken) {
      // AppSync expects Authorization header with Bearer prefix
      console.log("🔐 Apollo: Adding Bearer token to request for", operation.operationName);
      operation.setContext({
        headers: {
          Authorization: `Bearer ${currentIdToken}`,
        },
      });
    } else {
      console.warn("⚠️ Apollo: No token available for request", operation.operationName);
    }
    return forward(operation);
  });

  apolloClient = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "network-first",
      },
      query: {
        fetchPolicy: "network-first",
      },
    },
  });

  return apolloClient;
};
