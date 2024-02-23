import { StyleSheet, View } from "react-native";

import { RichTextEditor } from "./RichTextEditor"

export const AddNewTinyThoughtItem = () => {
  return (
    <View style={styles.tinyThoughtItem}>
      <RichTextEditor placeholder="Add new tiny thought" editMode />
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
  }
});
