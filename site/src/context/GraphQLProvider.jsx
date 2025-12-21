import React, { useMemo, useEffect } from "react";
import { ApolloProvider } from "@apollo/client";
import { useAuth } from "../context/AuthContext";
import { createApolloClient, setIdToken } from "../lib/apolloClient";

export const GraphQLProvider = ({ children }) => {
  const { idToken } = useAuth();
  
  // Create Apollo client once on mount
  const client = useMemo(() => createApolloClient(idToken), []);

  // Update the token in Apollo every time it changes
  useEffect(() => {
    console.log("🔑 GraphQLProvider: Token updated, length:", idToken ? idToken.length : 0);
    setIdToken(idToken);
  }, [idToken]);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};
