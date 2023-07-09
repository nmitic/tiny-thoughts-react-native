import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  Button,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
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
import { forwardRef, useCallback } from "react";

const client = new ApolloClient({
  uri: "https://api-eu-central-1-shared-euc1-02.hygraph.com/v2/cliiu60970diy01t69chc1zqv/master",
  cache: new InMemoryCache(),
});

const RichTextEditor = forwardRef(
  (
    {
      initialHtml,
      onChange,
      editMode,
      onClose,
      onEdit,
      onPublish,
      onSave,
      saveButtonDisabled,
      closeButtonDisabled,
      publishButtonDisabled,
      showActivityIndicator,
      showErrorMsg,
      placeholder,
    },
    ref
  ) => {
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
          placeholder={placeholder}
        />
        {editMode ? (
          <>
            <View style={styles.buttonsContainer}>
              <Button
                onPress={onPublish}
                title="publish"
                disabled={publishButtonDisabled}
                color="black"
              />
              <Button
                onPress={onSave}
                title="save"
                disabled={saveButtonDisabled}
                color="black"
              />
              <Button
                onPress={onClose}
                title="close"
                disabled={closeButtonDisabled}
                color="black"
              />
            </View>
            {showActivityIndicator ? (
              <ActivityIndicator size="large" color="white" />
            ) : null}
            {showErrorMsg ? (
              <Text style={styles.errorMsg}>
                Error while updating or fetching
              </Text>
            ) : null}
          </>
        ) : (
          <Button onPress={onEdit} title="edit" color="black" />
        )}
      </View>
    );
  }
);

const UPDATE_TT = gql`
  mutation updateTinyThought($content: RichTextAST, $id: ID) {
    updateTinyThought(data: { content: $content }, where: { id: $id }) {
      id
      content {
        html
      }
    }
  }
`;

const CREATE_NEW_TT = gql`
  mutation createTinyThought($content: RichTextAST) {
    createTinyThought(data: { content: $content }) {
      id
      content {
        html
      }
    }
  }
`;

const PUBLISH_TT = gql`
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

const QUERY_ALL_TT = gql`
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

const TinyThoughtItem = ({ initialHtml, id }) => {
  const richTextRef = useRef();
  const [editMode, setEditMode] = useState(false);
  const [richTextHTML, setRichTextHTML] = useState(initialHtml);

  const [
    mutateTinyThought,
    { data: updateData, loading: updateLoading, error: updateError },
  ] = useMutation(UPDATE_TT);

  const [
    publishTinyThought,
    { data: publishData, loading: publishLoading, error: publishError },
  ] = useMutation(PUBLISH_TT, {
    refetchQueries: () => [{ query: query }],
    onCompleted: () => setEditMode(false),
  });

  // const publishButtonDisabled =
  //   updateLoading ||
  //   publishData?.publishTinyThought.content.html ===
  //     updateData?.updateTinyThought.content.html;

  // const saveButtonDisabled =
  //   updateLoading ||
  //   richTextHTML === initialHtml ||
  //   publishData?.publishTinyThought.content.html !==
  //     updateData?.updateTinyThought.content.html;

  // const closeButtonDisabled = updateLoading;

  const showErrorMsg = updateError || publishError;
  const showActivityIndicator = updateLoading || publishLoading;

  const handleOnClose = () => setEditMode(false);
  const handleOnEdit = () => setEditMode(true);
  const handleOnPublish = () => {
    publishTinyThought({
      variables: { id: updateData?.updateTinyThought.id },
    });
  };
  const handleOnSave = () => {
    mutateTinyThought({
      variables: {
        content: { children: htmlToSlate(richTextHTML) },
        id,
      },
    });
  };

  if (updateError) {
    console.log(JSON.stringify(updateError, null, 2));
  }

  return (
    <View style={styles.tinyThoughtItem}>
      <RichTextEditor
        initialHtml={initialHtml}
        editMode={editMode}
        ref={richTextRef}
        onChange={(htmlString) => {
          setRichTextHTML(htmlString);
        }}
        onEdit={handleOnEdit}
        onSave={handleOnSave}
        onPublish={handleOnPublish}
        onClose={handleOnClose}
        showActivityIndicator={showActivityIndicator}
        showErrorMsg={showErrorMsg}
      />
    </View>
  );
};

const AddNewTinyThoughtItem = () => {
  const richTextRef = useRef();
  const [editMode, setEditMode] = useState(false);
  const [richTextHTML, setRichTextHTML] = useState(null);

  const [
    mutateTinyThought,
    { data: createData, loading: createLoading, error: createError },
  ] = useMutation(CREATE_NEW_TT);

  const [
    publishTinyThought,
    { data: publishData, loading: publishLoading, error: publishError },
  ] = useMutation(PUBLISH_TT, {
    refetchQueries: () => [{ query: QUERY_ALL_TT }],
    onCompleted: () => setEditMode(false),
  });

  // const publishButtonDisabled =
  //   updateLoading ||
  //   publishData?.publishTinyThought.content.html ===
  //     updateData?.updateTinyThought.content.html;

  // const saveButtonDisabled =
  //   updateLoading ||
  //   richTextHTML === initialHtml ||
  //   publishData?.publishTinyThought.content.html !==
  //     updateData?.updateTinyThought.content.html;

  // const closeButtonDisabled = updateLoading;

  const showErrorMsg = createError || publishError;
  const showActivityIndicator = createLoading || publishLoading;

  const handleOnClose = () => setEditMode(false);
  const handleOnEdit = () => setEditMode(true);
  const handleOnPublish = () => {
    publishTinyThought({
      variables: { id: createData?.createTinyThought.id },
    });
  };
  const handleOnSave = () => {
    mutateTinyThought({
      variables: {
        content: { children: htmlToSlate(richTextHTML) },
      },
    });
  };

  if (createError) {
    console.log(JSON.stringify(createError, null, 2));
  }

  return (
    <View style={styles.tinyThoughtItem}>
      <RichTextEditor
        editMode={editMode}
        ref={richTextRef}
        onChange={(htmlString) => {
          setRichTextHTML(htmlString);
        }}
        onEdit={handleOnEdit}
        onSave={handleOnSave}
        onPublish={handleOnPublish}
        onClose={handleOnClose}
        showActivityIndicator={showActivityIndicator}
        showErrorMsg={showErrorMsg}
        placeholder="Add new tiny thought"
      />
    </View>
  );
};

const TinyThoughtsList = () => {
  const { data, loading, refetch } = useQuery(QUERY_ALL_TT, {
    notifyOnNetworkStatusChange: true,
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, []);

  if (loading) {
    return null;
  }
  return (
    <ScrollView
      overScrollMode="never"
      nestedScrollEnabled={true}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
    >
      <AddNewTinyThoughtItem />
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
    color: "red",
  },
  editorStyle: {
    backgroundColor: "black",
    color: "white",
  },
});
