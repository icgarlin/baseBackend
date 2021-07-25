import { GenericError } from "../__shared__/schema";
import { Login, ProfileInfo } from "./schema";
import { createUnionType } from "type-graphql";

export const LoginOrErrorUnion = createUnionType({
    name: 'LoginOrError', // the name of the GraphQL union
    types: () => [Login, GenericError] as const, // function that returns tuple of object types classes
    resolveType: value => {
      if ('accessToken' in value) {
        return Login; 
      } 
      return GenericError;
    },
}); 
 

export const ProfileInfoOrErrorUnion = createUnionType({
    name: "ProfileInfoOrError", 
    types: () => [ProfileInfo, GenericError] as const, 
    resolveType: value => {
      if ('code' in value) {
        return GenericError; 
      } 
      return ProfileInfo;
    },
})