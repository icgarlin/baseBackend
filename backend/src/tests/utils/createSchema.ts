import { buildSchema } from "type-graphql";
import { statusResolvers } from '../../resolvers/';
import { userResolvers } from '../../resolvers/';
import { fileResolvers } from '../../resolvers';
import { GraphQLSchema } from "graphql";

export const createSchema = () => {
  buildSchema({
    resolvers: [
      statusResolvers,
      userResolvers,
      fileResolvers
    ],
  });
}
