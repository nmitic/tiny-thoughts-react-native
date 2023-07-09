import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  Button,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { unified } from "unified";
import markdown from "remark-parse";
import slate from "remark-slate";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkStringify from "remark-stringify";
import { useState, useRef, useEffect } from "react";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  gql,
  useQuery,
  useMutation,
} from "@apollo/client";
import {
  actions,
  RichEditor,
  RichToolbar,
} from "react-native-pell-rich-editor";
import RenderHtml from "react-native-render-html";
import { htmlToSlate, payloadHtmlToSlateConfig } from "slate-serializers";
import { forwardRef } from "react";

const client = new ApolloClient({
  uri: "https://api-eu-central-1-shared-euc1-02.hygraph.com/v2/cliiu60970diy01t69chc1zqv/master",
  cache: new InMemoryCache(),
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

const RichTextEditor = forwardRef(
  ({ initialHtml, onChange, editMode }, ref) => {
    return (
      <View>
        {editMode ? (
          <RichToolbar
            editor={ref}
            iconSize={20}
            selectedIconTint="#873c1e"
            iconTint="white"
            actions={[
              actions.setBold,
              actions.insertBulletsList,
              actions.insertOrderedList,
              actions.insertLink,
              actions.blockquote,
              actions.redo,
              actions.undo,
            ]}
            style={styles.richTextToolbarStyle}
          />
        ) : null}
        <RichEditor
          ref={ref}
          androidHardwareAccelerationDisabled={true}
          initialContentHTML={initialHtml}
          onChange={onChange}
          disabled={!editMode}
          editorStyle={styles.editorStyle}
        />
      </View>
    );
  }
);

const MUTATION = gql`
  mutation createTinyThought($content: RichTextAST, $id: ID) {
    updateTinyThought(data: { content: $content }, where: { id: $id }) {
      content {
        html
      }
    }
  }
`;

const PUBLISH_MUTATION = gql`
  mutation publishTinyThought($id: ID) {
    publishTinyThought(where: { id: $id }) {
      id
      createdAt
      content {
        html
      }
    }
  }
`;

const TinyThoughtItem = ({ initialHtml, id }) => {
  const richTextRef = useRef();
  const [editMode, setEditMode] = useState(false);
  const [richTextHTML, setRichTextHTML] = useState(initialHtml);
  const [
    mutateTinyThought,
    {
      data: updateData,
      loading: updateLoading,
      error: updateError,
      client: updateClient,
    },
  ] = useMutation(MUTATION, {
    onCompleted: (data) => {
      console.log("TT updated");
    },
  });
  const [
    publishTinyThought,
    {
      data: publishData,
      loading: publishLoading,
      error: publishError,
      client: publishClient,
    },
  ] = useMutation(PUBLISH_MUTATION, {
    onCompleted: (data) => {
      console.log("TT published", JSON.stringify(data, null, 2));
      updateClient.clearStore();
      publishClient.clearStore();
    },
    refetchQueries: () => [{ query: query }],
  });

  return (
    <View style={styles.tinyThoughtItem}>
      <RichTextEditor
        initialHtml={initialHtml}
        editMode={editMode}
        ref={richTextRef}
        onChange={(htmlString) => {
          setRichTextHTML(htmlString);
        }}
      />

      {editMode ? (
        <>
          <View style={styles.buttonsContainer}>
            <Button
              onPress={() => {
                publishTinyThought({ variables: { id } });
              }}
              title="publish"
              disabled={
                updateLoading ||
                publishData?.publishTinyThought.content.html ===
                  updateData?.updateTinyThought.content.html
              }
              color="black"
            />
            <Button
              onPress={() => {
                mutateTinyThought({
                  variables: {
                    content: { children: htmlToSlate(richTextHTML) },
                    id,
                  },
                });
              }}
              title="save"
              disabled={
                updateLoading ||
                richTextHTML === initialHtml ||
                publishData?.publishTinyThought.content.html !==
                  updateData?.updateTinyThought.content.html
              }
              color="black"
            />
            <Button
              onPress={() => {
                setEditMode(false);
              }}
              title="close"
              disabled={updateLoading}
              color="black"
            />
          </View>
          {updateLoading || publishLoading ? (
            <ActivityIndicator size="large" color="white" />
          ) : null}
          {updateError || publishError ? (
            <Text style={styles.errorMsg}>
              Error while updating or fetching
            </Text>
          ) : null}
        </>
      ) : (
        <Button
          onPress={() => {
            setEditMode(true);
          }}
          title="edit"
          color="black"
        />
      )}
    </View>
  );
};

const TinyThoughtsList = () => {
  const { data, loading } = useQuery(query);

  if (loading) {
    return <ActivityIndicator size="large" color="white" />;
  }
  return (
    <ScrollView overScrollMode="never" nestedScrollEnabled={true}>
      {data.tinyThoughts.map((item) => {
        return (
          <TinyThoughtItem
            initialHtml={item.content.html}
            id={item.id}
            key={item.id}
          />
        );
      })}
    </ScrollView>
  );
};

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

  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "black",
    paddingBottom: 12,
    paddingTop: 12,
  },

  tinyThoughtItem: {
    borderColor: "white",
    borderWidth: 3,
    padding: 6,
    borderRadius: 25,
    marginBottom: 12,
  },

  richTextToolbarStyle: {
    backgroundColor: "black",
  },

  errorMsg: {
    color: "white",
  },
  editorStyle: {
    backgroundColor: "black",
    color: "white",
  },
});
