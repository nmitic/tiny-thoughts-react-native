import { gql } from "@apollo/client";

export const UPDATE_TT = gql`
  mutation updateTinyThought($content: RichTextAST, $id: ID) {
    updateTinyThought(data: { content: $content }, where: { id: $id }) {
      id
      content {
        html
      }
    }
  }
`;

export const DELETE_TT = gql`
  mutation deleteTinyThought($id: ID) {
    deleteTinyThought(where: { id: $id }) {
      id
      content {
        html
      }
    }
  }
`;

export const CREATE_NEW_TT = gql`
  mutation createTinyThought($content: RichTextAST) {
    createTinyThought(data: { content: $content }) {
      id
      content {
        html
      }
    }
  }
`;

export const PUBLISH_TT = gql`
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

export const QUERY_ALL_TT = gql`
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