import { StyleSheet, Text, View, ScrollView, SafeAreaView, useWindowDimensions, Button } from "react-native";
import { unified } from 'unified';
import markdown from 'remark-parse';
import slate from 'remark-slate';
import rehypeParse from 'rehype-parse'
import rehypeRemark from 'rehype-remark'
import remarkStringify from 'remark-stringify'
import { useState, useRef } from "react";
import { ApolloClient, InMemoryCache, ApolloProvider, gql, useQuery, useMutation } from '@apollo/client';
import {
  actions,
  RichEditor,
  RichToolbar,
} from "react-native-pell-rich-editor";
import RenderHtml from 'react-native-render-html';
import { htmlToSlate } from 'slate-serializers'

// Initialize Apollo Client
const client = new ApolloClient({
  uri: 'https://api-eu-central-1-shared-euc1-02.hygraph.com/v2/cliiu60970diy01t69chc1zqv/master',
  cache: new InMemoryCache(),
});

const query = gql`
    query TinyThoughtsQuery {
      tinyThoughts(orderBy: createdAt_DESC) {
        id
        createdAt
        content {
          html
          raw
        }
      }
    }
  `;

const RichTextEditor = ({ initialHtml, rawAst, setRichTextAst }) => {
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
        onChange={(htmlString) => setRichTextAst(htmlToSlate(htmlString))}
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

const MUTATION = gql`
  mutation createTinyThought($content:RichTextAST, $id: ID) {
    updateTinyThought(data: {content: $content}, where: {id: $id}) {
      content {
        html
      }
    }
  }
`

const PUBLISH_MUTATION = gql`
  mutation publishTinyThought($id: ID) {
    publishTinyThought(where: {id:$id }) {
      id
    }
  }
`

const TinyThoughtItem = ({ initialHtml, rawAst, id }) => {
  const [editMode, setEditMode] = useState(false);
  const [richTestSlateAst, setRichTextAst] = useState(null)
  const [mutateTinyThought, { data, loading, error }] = useMutation(MUTATION);
  const [publishTinyThought, { publishError }] = useMutation(PUBLISH_MUTATION);

  if (error) {
    console.log(JSON.stringify(error, null, 2));
  }

  if (publishError) {
    console.log(JSON.stringify(publishError, null, 2));
  }

  return (
    <>
      {
        editMode ?
          <RichTextEditor
            initialHtml={initialHtml}
            rawAst={rawAst}
            setRichTextAst={setRichTextAst}
          />
          :
          <TinyThoughWebview htmlString={initialHtml} />
      }
      <Button
        onPress={() => {
          publishTinyThought({ variables: { id } })
        }}
        title="publish"
      />
      <Button
        onPress={() => {
          if (editMode && richTestSlateAst) {
            mutateTinyThought({ variables: { content: { children: richTestSlateAst }, id } })
          }
          setEditMode(!editMode)
        }}
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
            <TinyThoughtItem initialHtml={item.content.html} rawAst={item.content.raw} id={item.id} />
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
