import { ExecutionResult, graphql } from "graphql";
import { Maybe } from "graphql/jsutils/Maybe";
import { buildSchema } from "type-graphql";
import { statusResolvers } from '../../resolvers/';
import { userResolvers } from '../../resolvers/';
import { fileResolvers } from '../../resolvers';
import { folderResolvers } from '../../resolvers';
import { authChecker } from "../../auth";

interface Options {
  source: string;
  contextValue?: unknown,  
  variableValues?: Maybe<{
    [key: string]: unknown;
  }>;
}

export const gCall = async ({ source, variableValues, contextValue }: Options): Promise<ExecutionResult<{[key: string]: unknown}, {[key: string]: unknown}>> => {
            return graphql({
              schema: await buildSchema({
                            resolvers: [
                                        statusResolvers,
                                        userResolvers,
                                        fileResolvers, 
                                        folderResolvers
                                      ],
                            emitSchemaFile: true,
                            nullableByDefault: true 
                        }),
              source,
              contextValue,
              variableValues
            });
};
