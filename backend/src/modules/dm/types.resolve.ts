import { createUnionType } from 'type-graphql';
import { GenericError } from '../__shared__/schema';
import { DirectMessage, DMConnection, DMLog, DMUserGroup, DMUserGroupList } from './schema';

export const DMConnectionOrErrorUnion = createUnionType({
  name: 'DMConversationOrError', // the name of the GraphQL union
  types: () => [DMConnection, GenericError] as const, // function that returns tuple of object types classes
  resolveType: value => {
    if ('code' in value) {
      return GenericError; 
    }
    return DMConnection;
  },
});

export const DMLogOrErrorUnion = createUnionType({
    name: 'DMLogOrError', // the name of the GraphQL union
    types: () => [DMLog, GenericError] as const, // function that returns tuple of object types classes
    resolveType: value => {
      if ('code' in value) {
        return GenericError; 
      }
      return DMLog;
    },
});

export const DMOrErrorUnion  = createUnionType({
  name: 'DMOrError', // the name of the GraphQL union
  types: () => [DirectMessage, GenericError] as const, // function that returns tuple of object types classes
  resolveType: value => {
    if ('code' in value) {
      return GenericError; 
    }
    return DirectMessage;
  },
});

export const DMUserGroupListOrErrorUnion  = createUnionType({
  name: 'DMUserGroupListOrError', // the name of the GraphQL union
  types: () => [DMUserGroupList, GenericError] as const, // function that returns tuple of object types classes
  resolveType: value => {
    if ('code' in value) {
      return GenericError; 
    }
    return DMUserGroupList;
  },
});
