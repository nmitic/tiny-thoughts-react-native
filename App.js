import { StyleSheet, Text, View, ScrollView, SafeAreaView, useWindowDimensions, Button } from "react-native";
import { WebView } from "react-native-webview";
import { useState, useRef } from "react";
import { ApolloClient, InMemoryCache, ApolloProvider, gql, useQuery } from '@apollo/client';
import {
  actions,
  RichEditor,
  RichToolbar,
} from "react-native-pell-rich-editor";
import RenderHtml from 'react-native-render-html';

// Initialize Apollo Client
const client = new ApolloClient({
  uri: 'https://eu-central-1-shared-euc1-02.cdn.hygraph.com/content/cliiu60970diy01t69chc1zqv/master',
  cache: new InMemoryCache()
});

const query = gql`
    query TinyThoughtsQuery {
      tinyThoughts(orderBy: createdAt_DESC) {
        id
        createdAt
        content {
          html
        }
      }
    }
  `;

const RichTextEditor = ({ initialHtml }) => {
  const richText = useRef();

  return (
    <View>
      <RichToolbar
        editor={richText}
        selectedIconTint="#873c1e"
        iconTint="#312921"
        actions={[
          actions.insertImage,
          actions.setBold,
          actions.setItalic,
          actions.insertBulletsList,
          actions.insertOrderedList,
          actions.insertLink,
          actions.setStrikethrough,
          actions.setUnderline,
        ]}
        style={styles.richTextToolbarStyle}
      />
      <RichEditor
        ref={richText}
        androidHardwareAccelerationDisabled={true}
        style={styles.richTextEditorStyle}
        initialContentHTML={initialHtml}
      />
    </View>
  )
}

const TinyThoughWebview = ({ htmlString }) => {
  const { width } = useWindowDimensions();
  return (
    <RenderHtml
      contentWidth={width}
      source={{ html: htmlString }}
    />
  )

}

const TinyThoughtItem = ({ htmlString }) => {
  const [editMode, setEditMode] = useState(false);

  return (
    <>
      {
        editMode ? <RichTextEditor initialHtml={htmlString} /> : <TinyThoughWebview htmlString={htmlString} />
      }
      <Button
        onPress={() => setEditMode(!editMode)}
        title={editMode ? 'save' : 'edit'}
      />
    </>
  )
}

const TinyThoughtsList = () => {
  const { data, loading } = useQuery(query);

  if (loading) {
    return <Text>Loading....</Text>
  }
  return (
    <ScrollView overScrollMode="never" nestedScrollEnabled={true}>
      {data.tinyThoughts.map(item => {

        return (
          <View key={item.id}>
            <TinyThoughtItem htmlString={item.content.html} />
          </View>
        )
      })}
    </ScrollView>
  )
}

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <ApolloProvider client={client}>
        <TinyThoughtsList />
      </ApolloProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingTop: 100,
  },
  richTextContainer: {
    display: "flex",
    flexDirection: "column-reverse",
    width: "100%",
    marginBottom: 10,
  },

  richTextEditorStyle: {
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1,
    borderColor: "#ccaf9b",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
    fontSize: 20,
  },

  richTextToolbarStyle: {
    backgroundColor: "#c6c3b3",
    borderColor: "#c6c3b3",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 1,
  },
});
