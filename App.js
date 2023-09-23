import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Button,
  StatusBar,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useState, useRef, useCallback } from "react";
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
import { htmlToSlate, slateDemoHtmlToSlateConfig } from "slate-serializers";

const client = new ApolloClient({
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

const DELETE_TT = gql`
  mutation deleteTinyThought($id: ID) {
    deleteTinyThought(where: { id: $id }) {
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
  query TinyThoughtsQuery($first: Int, $skip: Int) {
    tinyThoughts(first: $first, orderBy: createdAt_DESC, skip: $skip) {
      id
      createdAt
      content {
        html
      }
    }
    tinyThoughtsConnection {
      aggregate {
        count
      }
    }
  }
`;

const RichTextEditor = ({
  initialHtml,
  placeholder,
  id,
  handleOnEdit = () => {},
  handleOnClose = () => {},
  editMode = false,
}) => {
  const ref = useRef();
  const [richTextHTML, setRichTextHTML] = useState(initialHtml);

  const [mutateTinyThought, { loading: updateLoading, error: updateError }] =
    useMutation(UPDATE_TT);

  const [deleteTinyThought, { loading: deleteLoading, error: deleteError }] =
    useMutation(DELETE_TT, {
      refetchQueries: () => [{ query: QUERY_ALL_TT }],
    });

  const [publishTinyThought, { loading: publishLoading, error: publishError }] =
    useMutation(PUBLISH_TT, {
      refetchQueries: () => [{ query: QUERY_ALL_TT }],
      onCompleted: () => handleOnClose(),
    });

  const [
    createNewTinnyThought,
    { loading: createLoading, error: createError },
  ] = useMutation(CREATE_NEW_TT);

  const [
    publishNewTinyThought,
    { loading: publishNewLoading, error: publishNewError },
  ] = useMutation(PUBLISH_TT, {
    refetchQueries: () => [{ query: QUERY_ALL_TT }],
    onCompleted: () => {
      ref.current.setContentHTML("");
    },
  });

  const showAddButtonInsteadOfSave = !Boolean(id);

  const showErrorMsg =
    updateError ||
    publishError ||
    createError ||
    deleteError ||
    publishNewError;
  const showActivityIndicator =
    updateLoading ||
    publishLoading ||
    createLoading ||
    publishNewLoading ||
    deleteLoading;

  const handleOnSave = async () => {
    const { data } = await mutateTinyThought({
      variables: {
        content: {
          children: htmlToSlate(richTextHTML, slateDemoHtmlToSlateConfig),
        },
        id,
      },
    });
    await publishTinyThought({
      variables: { id: data?.updateTinyThought.id },
    });
  };

  const handleOnDelete = () => {
    deleteTinyThought({
      variables: {
        id,
      },
    });
  };

  const handleOnChange = (htmlString) => {
    setRichTextHTML(htmlString);
  };

  const handleOnAdd = async () => {
    const { data } = await createNewTinnyThought({
      variables: {
        content: {
          children: htmlToSlate(richTextHTML, slateDemoHtmlToSlateConfig),
        },
      },
    });
    await publishNewTinyThought({
      variables: { id: data?.createTinyThought?.id },
    });
  };

  if (showErrorMsg) {
    console.error(
      JSON.stringify(
        {
          updateError,
          publishError,
          createError,
          deleteError,
          publishNewError,
        },
        null,
        2
      )
    );
  }

  return (
    <View>
      {editMode ? (
        <RichToolbar
          editor={ref}
          iconSize={20}
          selectedIconTint="#873c1e"
          iconTint="white"
          iconMap={{
            [actions.heading1]: ({ tintColor }) => (
              <Text style={[styles.tib, { color: tintColor }]}>H1</Text>
            ),
            [actions.heading2]: ({ tintColor }) => (
              <Text style={[styles.tib, { color: tintColor }]}>H2</Text>
            ),
            [actions.heading3]: ({ tintColor }) => (
              <Text style={[styles.tib, { color: tintColor }]}>H3</Text>
            ),
            [actions.heading4]: ({ tintColor }) => (
              <Text style={[styles.tib, { color: tintColor }]}>H4</Text>
            ),
            [actions.heading5]: ({ tintColor }) => (
              <Text style={[styles.tib, { color: tintColor }]}>H4</Text>
            ),
            [actions.heading6]: ({ tintColor }) => (
              <Text style={[styles.tib, { color: tintColor }]}>H6</Text>
            ),
          }}
          actions={[
            actions.setBold,
            actions.insertBulletsList,
            actions.insertOrderedList,
            actions.insertLink,
            actions.blockquote,
            actions.redo,
            actions.undo,
            actions.heading1,
            actions.heading2,
            actions.heading3,
            actions.heading4,
            actions.heading5,
            actions.heading6,
          ]}
          style={styles.richTextToolbarStyle}
        />
      ) : null}
      <RichEditor
        ref={ref}
        androidHardwareAccelerationDisabled={true}
        initialContentHTML={initialHtml}
        onChange={handleOnChange}
        disabled={!editMode}
        editorStyle={styles.editorStyle}
        placeholder={placeholder}
      />
      {editMode ? (
        <>
          <View style={styles.buttonsContainer}>
            {showAddButtonInsteadOfSave ? (
              <Button onPress={handleOnAdd} title="add" color="black" />
            ) : (
              <Button onPress={handleOnSave} title="save" color="black" />
            )}
            <Button onPress={handleOnClose} title="close" color="black" />
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
        <View style={styles.buttonsContainer}>
          <Button onPress={handleOnEdit} title="edit" color="black" />
          <Button onPress={handleOnDelete} title="Delete" color="tomato" />
        </View>
      )}
    </View>
  );
};

const TinyThoughtItem = ({ initialHtml, id }) => {
  const [editMode, setEditMode] = useState(false);

  return (
    <View style={styles.tinyThoughtItem}>
      <RichTextEditor
        initialHtml={initialHtml}
        id={id}
        editMode={editMode}
        handleOnClose={() => setEditMode(false)}
        handleOnEdit={() => setEditMode(true)}
      />
    </View>
  );
};

const AddNewTinyThoughtItem = () => {
  return (
    <View style={styles.tinyThoughtItem}>
      <RichTextEditor placeholder="Add new tiny thought" editMode />
    </View>
  );
};

const TT_TO_SHOW_PER_FETCH = 10;

const renderFlatListItem = ({ item }) => {
  return (
    <TinyThoughtItem
      initialHtml={item.content.html}
      id={item.id}
      key={item.id}
    />
  );
};

const TinyThoughtsList = () => {
  const [page, setPage] = useState(0);

  const { data, loading, refetch, fetchMore } = useQuery(QUERY_ALL_TT, {
    variables: {
      first: TT_TO_SHOW_PER_FETCH,
      skip: 0,
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network",
    onCompleted: () => {
      console.log("FETCHED");
      setPage((prevPage) => prevPage + 1);
    },
  });

  const onRefresh = useCallback(() => {
    setPage(0);
    refetch();
  }, []);

  if (!data) {
    return null;
  }

  return (
    <>
      <FlatList
        ListHeaderComponent={AddNewTinyThoughtItem}
        data={data.tinyThoughts}
        onRefresh={onRefresh}
        initialNumToRender={TT_TO_SHOW_PER_FETCH}
        refreshing={loading}
        overScrollMode="never"
        onEndReached={() => {
          const noDataLeft =
            data.tinyThoughtsConnection.aggregate.count ===
            data.tinyThoughts.length;
          if (noDataLeft) {
            return;
          }
          fetchMore({
            variables: {
              first: TT_TO_SHOW_PER_FETCH,
              skip: TT_TO_SHOW_PER_FETCH * page,
            },
          });
        }}
        renderItem={renderFlatListItem}
      />
    </>
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
