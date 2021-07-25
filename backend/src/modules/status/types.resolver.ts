
import { StatusComment, StatusCommentConnection, StatusCommentCount, StatusConnection, Thndr, ThndrConnection } from "./schema";
import { createUnionType, Int } from "type-graphql";
import { GenericError } from "../__shared__/schema";



export const StatusFeedOrErrorUnion = createUnionType({
    name: "StatusFeedOrError", // the name of the GraphQL union
    types: () => [StatusConnection, GenericError] as const, // function that returns tuple of object types classes
    resolveType: value => {
      if ('code' in value) {
        return GenericError; 
      }
      return StatusConnection;
    },
});
  
export const ThndrOrErrorUnion = createUnionType({
   name: "ThndrOrError",
   types: () => [Thndr, GenericError] as const,
   resolveType: value => {
    if ('code' in value) {
      return GenericError;
    }
    return Thndr;
   },
});

export const ThndrConnectionOrErrorUnion = createUnionType({
    name: "ThndrConnectionOrError",
    types: () => [ThndrConnection, GenericError] as const,
    resolveType: value => {
        if ('code' in value) {
            return GenericError;
        }
        return ThndrConnection;
    },
});



export const StatusCommentOrErrorUnion = createUnionType({
  name: 'StatusCommentOrError',
  types: () => [StatusComment, GenericError] as const,
  resolveType: value => {
      if ('code' in value) {
        return GenericError;
      }
      return StatusComment;
  },
});

  
export const StatusCommentConnectionOrErrorUnion = createUnionType({
  name: 'StatusCommentConnectionOrError',
  types: () => [StatusCommentConnection, GenericError] as const,
  resolveType: value => {
      if ('code' in value) {
        return GenericError;
      }
      return StatusCommentConnection;
  },
});


export const StatusCommentCountOrErrorUnion = createUnionType({
  name: 'StatusCommentCountOrError',
  types: () => [StatusCommentCount, GenericError] as const,
  resolveType: value => {
      if ('code' in value) {
        return GenericError;
      }
      return StatusCommentCount;
  },
});


  
  
  
  