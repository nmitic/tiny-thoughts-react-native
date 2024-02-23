import {
  Text,
  View,
  Button,
  ActivityIndicator,
  StyleSheet
} from "react-native";
import { useState, useRef } from "react";
import { useMutation } from "@apollo/client";
import {
  actions,
  RichEditor,
  RichToolbar,
} from "react-native-pell-rich-editor";
import { htmlToSlate, slateDemoHtmlToSlateConfig } from "slate-serializers";
import { UPDATE_TT, DELETE_TT, CREATE_NEW_TT, PUBLISH_TT, QUERY_ALL_TT } from "../queries"

export const RichTextEditor = ({
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
        usecontainer={false}
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
