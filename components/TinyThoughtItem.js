import { StyleSheet, View } from "react-native";
import { useState } from "react";

import { RichTextEditor } from "./RichTextEditor"

export const TinyThoughtItem = ({ initialHtml, id }) => {
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


const styles = StyleSheet.create({
  tinyThoughtItem: {
    borderColor: "white",
    borderWidth: 3,
    padding: 6,
    borderRadius: 25,
    marginBottom: 12,
  },
});
