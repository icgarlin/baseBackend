
import { ApolloServer } from 'apollo-server-express';
import { BasicError } from '../../modules/__shared__/error';
import { AdminResolver as adminResolver } from '../../modules/__shared__/admin/resolver';
import { NotificationResolver as notificationResolver } from '../../modules/__shared__/notification/resolver'; 
import { UserResolver as userResolver } from '../../modules/user/resolver';
import { FolderResolver as folderResolver } from '../../modules/drive/folderResolver';
import { FileResolver as fileResolver } from '../../modules/drive/fileResolver';
import { StatusResolver as statusResolver } from '../../modules/status/resolver';
import { DirectMessageResolver as dmResolver } from '../../modules/dm/resolver';
import { ServerResolver as serverResolver } from '../../modules/server/resolver';
import { DriveResolver as driveResolver } from '../../modules/drive/resolver'; 
import TApolloServer from './server';
import SchemaBuilder from './schema';
import Container from 'typedi';
import ServerAPI from '../../modules/server/api';
import DirectMessageAPI from '../../modules/dm/api';
import app from '../../app';
import { pubSub } from '../redis';



export const buildApolloServerGateway = async (): Promise<ApolloServer | BasicError> => {
  try {
    const schemaBuilder = new SchemaBuilder({
                                              resolvers: [ adminResolver,
                                                           notificationResolver,
                                                           userResolver,
                                                           folderResolver,
                                                           fileResolver,
                                                           statusResolver,
                                                           serverResolver,
                                                           dmResolver,
                                                           driveResolver ],
                                              container: Container,
                                              nullableByDefault: true,
                                              validate: false,
                                              pubSub: pubSub
                                              
                                            })
    const schema = await schemaBuilder.build();
    if ('code' in schema || schema instanceof Error) throw (schema);
    const apolloServerBuilder = new TApolloServer({
                                                    apiKey: process.env.APOLLO_KEY,
                                                    schema,
                                                    restSources: ({ server: new ServerAPI(), 
                                                                    dm: new DirectMessageAPI() }),
                                                    playground: false,
                                                    introspection: true,
                                                    application: app
                                                  })
    const server = apolloServerBuilder.build();
    if ('code' in server) throw (server);
    return server; 
  } catch (error) {
    return error as BasicError; 
  }
}



