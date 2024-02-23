import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";

import { ApolloProvider } from "@apollo/client";

import { TinyThoughtsList } from "./components/TinyThoughtsList"
import { client } from "./client";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="black" barStyle="light-content" />
      <ApolloProvider client={client}>
        <TinyThoughtsList />
      </ApolloProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    height: "100%",
    padding: 6,
  },
});
