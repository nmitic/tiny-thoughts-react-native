import { FlatList } from "react-native";
import { useState, useRef, useCallback } from "react";
import { useQuery } from "@apollo/client";

import { QUERY_ALL_TT } from "../queries"
import { AddNewTinyThoughtItem } from "./AddNewTinyThoughtItem"
import { TinyThoughtItem } from "./TinyThoughtItem"
 
const TT_TO_SHOW_PER_FETCH = 10;

export const TinyThoughtsList = () => {
  const [page, setPage] = useState(0);
  const ref = useRef();

  const { data, loading, refetch, fetchMore } = useQuery(QUERY_ALL_TT, {
    variables: {
      first: TT_TO_SHOW_PER_FETCH,
      skip: 0,
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network",
    onCompleted: () => {
      setPage((prevPage) => prevPage + 1);
    },
  });

  const handleRefresh = useCallback(() => {
    setPage(0);
    refetch();
  }, []);

  if (!data) {
    return null;
  }

  return (
    <>
      <FlatList
        ref={ref}
        ListHeaderComponent={AddNewTinyThoughtItem}
        data={data.tinyThoughts}
        onRefresh={handleRefresh}
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
        renderItem={({ item }) => {
          return (
            <TinyThoughtItem
              initialHtml={item.content.html}
              id={item.id}
              key={item.id}
            />
          );
        }}
      />
    </>
  );
};