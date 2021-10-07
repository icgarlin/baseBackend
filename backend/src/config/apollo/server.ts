/* eslint-disable @typescript-eslint/ban-types */
import { ConnectionContext } from '../../modules/__shared__/interfaces';
import { createContext } from './createContext';
import { ApolloServer } from 'apollo-server-express';
import { DataSources } from 'apollo-server-core/src/graphqlOptions'; 
import { ExpressContext } from 'apollo-server-express/dist/ApolloServer'; 
import { GraphQLSchema } from 'graphql';
import { Express } from 'express-serve-static-core';
import { BasicError } from '../../modules/__shared__/error';


interface TApolloServerConfig {
    application: Express; 
    apiKey: string; 
    schema: GraphQLSchema;
    restSources?: DataSources<object>;
    playground: boolean; 
    introspection: boolean; 
}

class TApolloServer {

    private apiKey: string; 
    private schema: GraphQLSchema;
    private restSources?:  DataSources<object>; 
    private application: Express; 
    public playground: boolean; 
    public introspection: boolean; 

    constructor (config: TApolloServerConfig) {
        this.apiKey = config.apiKey;
        this.schema = config.schema; 
        this.restSources = config.restSources; 
        this.playground = config.playground; 
        this.application = config.application
        this.introspection = config.introspection; 
    }
    
    build = (): ApolloServer | BasicError => {
        try {
            const server =  new ApolloServer({
                                      debug: true, 
                                      schema: this.schema,
                                      engine: {
                                         apiKey: this.apiKey
                                      },
                                      subscriptions: {
                                        path: '/subscriptions'
                                      }, 
                                      playground: this.playground,
                                      introspection: this.introspection,
                                      context: async ({ req, connection }: ExpressContext) => {
                                          try {
                                            if (connection) {
                                                const { context } = connection as ConnectionContext; 
                                                const ctx = await createContext(context.authToken); 
                                                return ctx;
                                            } else if (req) {
                                                const token = req.headers.authorization || '';
                                                const ctx = await createContext(token);
                                                console.log('the contx ', ctx); 
                                                return ctx; 
                                            }
                                          } catch (error) {
                                              console.log('Error building context ', error);
                                          }
                                      },
                                      uploads: false
                                   })
            server.applyMiddleware({ app: this.application, path: '/', cors: false, bodyParserConfig: true});
            return server; 

        } catch (error) {
            console.log('the errro' ,error); 
            return error as BasicError; 
        }
    }

} 


export default TApolloServer; 
