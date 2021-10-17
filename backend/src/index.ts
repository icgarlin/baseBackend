import { buildApolloServerGateway } from './config/apollo';
import app from './app';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { buildSocket } from './modules/__shared__/socket';
import { mongooseConnect } from './config/mongodb/db.mongo';
import ServerController from './modules/server/controller';
import DirectMessageController from './modules/dm/controller';
import MongoDBUserRepo from './modules/user/repo.mongo';
import MongoDBServerMessageReactionsRepo from './modules/server/reactions.repo';
import { S3Repo } from './modules/__shared__/aws/s3';
import MongoDBServerRepo from './modules/server/serverRepo.mongo';
import MongoDBDirectMessageRepo from './modules/dm/repo.mongo';
import { CloudFrontRepo } from './modules/__shared__/aws/cloudfront';
import { createClient } from 'redis'; 
import { createAdapter } from '@socket.io/redis-adapter';




const cloudService = new CloudFrontRepo();
const blobRepo = new S3Repo();
const userRepo = new MongoDBUserRepo();
const serverRepo = new MongoDBServerRepo();
const dmRepo = new MongoDBDirectMessageRepo();
const reactionRepo = new MongoDBServerMessageReactionsRepo();
const serverControl = new ServerController(serverRepo,userRepo,reactionRepo,cloudService,blobRepo);
const dmControl = new DirectMessageController(dmRepo,userRepo,cloudService); 
const apolloGate = buildApolloServerGateway();

apolloGate.then((gateway) => {
    if ('code' in gateway) throw (gateway);
    const httpServer = createServer(app); 
    const hS = httpServer.listen({ port: process.env.PORT || 4000 }, () => {
        console.log(`🚀 Server ready at ${gateway.graphqlPath}`)
        console.log(`🚀 Subscriptions ready at ${gateway.subscriptionsPath}`)
        mongooseConnect(); 
    });
    gateway.installSubscriptionHandlers(hS); 

    // const pubClient = createClient({ host: 'localhost', port: 6379 });
    // const subClient = pubClient.duplicate();

    const io = new Server(hS, {transports: ['polling']});
    // io.adapter(createAdapter(pubClient, subClient)); 
    buildSocket(io,serverControl,dmControl); 
}).catch((error) => {
    console.log('Our error building server ', error);
})


