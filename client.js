import { ApolloClient, InMemoryCache } from "@apollo/client";


export const client = new ApolloClient({
  uri: "https://api-eu-central-1-shared-euc1-02.hygraph.com/v2/cliiu60970diy01t69chc1zqv/master",
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          tinyThoughts: {
            // Don't cache separate results based on
            // any of this field's arguments.
            keyArgs: false,

            // Concatenate the incoming list items with
            // the existing list items.
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
        },
      },
    },
  }),
});