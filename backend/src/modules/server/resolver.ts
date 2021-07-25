import 'reflect-metadata';
import { Arg, 
         Ctx, 
         ID, 
         Int, 
         Mutation, 
         Query, 
         Resolver, 
         Subscription } from 'type-graphql';
import { Service } from 'typedi';
import { withFilter } from 'graphql-subscriptions';
import MongoDBUserRepo from '../user/repo.mongo';
import { CloudFrontRepo } from '../__shared__/aws/cloudfront';
import { S3Repo } from '../__shared__/aws/s3';
import { BasicError, ErrorCode } from '../__shared__/error';
import { Context } from '../__shared__/interfaces';
import { GenericError } from '../__shared__/schema';
import { IDListOrErrorUnion, SuccessOrErrorUnion } from '../__shared__/types.resolver';
import ServerController from './controller';
import MongoDBServerMessageReactionsRepo from './reactions.repo';
import { ServerData } from './schema';
import { MongoDBServerRepo } from './serverRepo.mongo';
import { ChannelOrErrorUnion, 
         ServerDataListOrErrorUnion, 
         ServerDataOrErrorUnion, 
         ServerFileConnectionOrErrorUnion, 
         ServerMessageConnectionOrErrorUnion } from './types.resolve';
import { SERVERTIER } from './types';
import AdminRepo from '../__shared__/admin/admin.repo';
import { AdminController } from '../__shared__/admin/controller';


@Service()
@Resolver()
export class ServerResolver {
    serverControl: ServerController; 
    adminControl: AdminController; 
    constructor (serverRepo: MongoDBServerRepo,
                 cloudRepo: CloudFrontRepo,
                 reactionsRepo: MongoDBServerMessageReactionsRepo,
                 userRepo: MongoDBUserRepo,
                 blobRepo: S3Repo, 
                 adminRepo: AdminRepo) {
      this.serverControl = new ServerController(serverRepo,userRepo,reactionsRepo,cloudRepo,blobRepo);
      this.adminControl = new AdminController(adminRepo,userRepo); 
    }

    /*     ServerData Domain      */
    // @Authorized('SERVEROWNER')
    @Query(() => IDListOrErrorUnion)
    async getServerMembers(
      @Arg('serverId', () => String, {nullable: false}) serverId: string,
    ): Promise<typeof IDListOrErrorUnion> {
      try {
        const res = await this.serverControl.getServerMembers(serverId)
        if ('code' in res || res instanceof Error) throw (res); 
        if (res.ids.length) {
           return res; 
        } else {
           return {
             ids: []
           }
        }
      } catch (error) {
        return error as GenericError; 
      }
    }
    
    @Query(() => ServerDataListOrErrorUnion)
    async loadServerData(
      @Arg('userId', () => ID, {nullable: false}) userId: string, 
    ): Promise<typeof ServerDataListOrErrorUnion> {
      try {
        const res = await this.serverControl.queryUserServerList(userId);
        if (res instanceof Error) throw (res);
        if (res.length === 0) {
         return {servers: []};  
        }
        const servers = res.map((server) => {
          return server as ServerData
        });
        return {servers: servers}; 
      } catch (error) {
          if (error instanceof Error) {
            console.log('error ', error);
            return error as GenericError; 
          } 
      }
    }

    @Query(() => ServerMessageConnectionOrErrorUnion)
    async loadChannelMsgs(
      @Arg('serverId', () => String, {nullable:false}) serverId: string, 
      @Arg('channelId', () => String, {nullable: false}) channelId: string,
      @Arg('limit', () => Int, {nullable:false}) limit: number,
      @Arg('cursor', () => String) cursor: string, 
    ): Promise<typeof ServerMessageConnectionOrErrorUnion> {
      try {
      
        console.table([serverId,channelId,limit,cursor])
        const res = await this.serverControl.loadChannelMsgs(serverId,
                                                             channelId,
                                                             cursor,
                                                             limit);
                                                          
        if (res instanceof Error) throw (res);
        const { userRepo, cloudRepo } = this.serverControl;
        if (res.edges.length > 0) {
          res.edges.forEach((msg) => {
           msg.cloudService =  cloudRepo; 
           msg.userRepo = userRepo; 
           if (typeof msg.createdAt === typeof Date) {
             msg.createdAt = msg.createdAt.toString();
           }
          });
        }
        // console.log('res ', res.edges)
        
        return res; 
      } catch (error) {
          if (error instanceof Error) {
            return error as GenericError; 
          } 
      }
    }

    /************************************* */

    /*          Saved MSG Domain        */ 
    @Mutation(() => SuccessOrErrorUnion)
    async saveMsg(
      @Arg('serverId', () => String, {nullable: false}) serverId: string,
      @Arg('msgId', () => String, {nullable: false}) msgId: string
    ): Promise<typeof SuccessOrErrorUnion> {
      try {
        const res = await this.serverControl.saveMsg(serverId,msgId);  
        console.log('save msg res ', res);
        if ('code' in res || res instanceof Error) throw (res);
        return res; 
      } catch (error) {
          return error as GenericError; 
      }
    }

    @Mutation(() => SuccessOrErrorUnion)
    async unsaveMsg(
      @Arg('serverId', () => String, {nullable: false}) serverId: string,
      @Arg('msgId', () => String, {nullable: false}) msgId: string
    ): Promise<typeof SuccessOrErrorUnion> {
      try {
        console.log('the serverId ', serverId)
        const res = await this.serverControl.unsaveMsg(serverId,msgId); 
        console.log('This is our res ', res);
        if ('code' in res || res instanceof Error) throw (res);
        return res; 
      } catch (error) {
          return error as GenericError; 
      }
    }


    @Query(() => ServerMessageConnectionOrErrorUnion)
    async loadSavedMsgs(
      @Arg('serverId', () => String, {nullable:false}) serverId: string, 
      @Arg('limit', () => Int, {nullable:false}) limit: number,
      @Arg('cursor', () => String) cursor: string | null,
      @Ctx() context: Context,    
    ): Promise<typeof ServerMessageConnectionOrErrorUnion> {
      try {
        if (serverId === '') throw (new BasicError(ErrorCode.BadRequest, `Must provide serverId`)); 
        const res = await context.dataSources.server.savedMessages(serverId,limit,cursor);
        if (res instanceof Error) throw (res);
        const { cloudRepo } = this.serverControl;
        if (res.edges !== undefined && res.edges.length > 0) {
          res.edges.forEach((msg) => {
            msg.cloudService = cloudRepo; 
          });
        } 
        return res; 
      } catch (error) {
          console.log('our error ', error);
          return error as GenericError; 
      }
    }

    /******************************************** */

    
    @Mutation(() => SuccessOrErrorUnion)
    async deleteServer(
      @Arg('serverId', () => String, {nullable: false}) serverId: string, 
      @Ctx() context: Context
    ): Promise<typeof SuccessOrErrorUnion> {
      try {
        const { user } = context; 
        const { _id } = user; 
        const res = await this.serverControl.deleteServer(serverId,_id)
        if ('code' in res || res instanceof Error) throw (res); 
        return res; 
      } catch (error) {
          return error as GenericError; 
      }
    }

   @Mutation(() => ServerDataOrErrorUnion)
   async joinServer(
    @Arg('serverId', () => String, {nullable: false}) serverId: string, 
    @Arg('inviteCode', () => String, {nullable: false}) inviteCode: string,
    @Ctx() context: Context
   ): Promise<typeof ServerDataOrErrorUnion> {
    try {
      const { user } = context; 
      const res = await this.serverControl.joinServer(serverId,
                                                      user._id,
                                                      inviteCode); 
      if ('code' in res || res instanceof Error) throw (res);
      const { tier, ownerId } = res; 
      if (tier === SERVERTIER.PUBLIC) {
         const newSeatRes = await this.adminControl.addSeatToSubscription(ownerId,serverId); 
         if (newSeatRes instanceof Error) throw (newSeatRes);
          console.log('our newseat res ', newSeatRes); 
      }
      const connections = await this.serverControl.connectToServerMembers(user._id,serverId); 
      if (connections instanceof Error) throw (connections); 
      return res;  
    } catch (error) {
        return error as GenericError; 
    }
   }

   @Mutation(() => ServerDataOrErrorUnion)
   async createServer(
     @Arg('ownerId', () => ID, {nullable: false}) ownerId: string, 
     @Arg('serverName', () => String, {nullable: false}) serverName: string,
     @Arg('channelName', () => String, {nullable: false}) channelName: string, 
   ): Promise<typeof ServerDataOrErrorUnion> {
     try {
       const res = await this.serverControl.createNewServer(serverName,channelName,ownerId); 
       if ('code' in res || res instanceof Error) throw (res);
       return res; 
     } catch (error) {
         console.log('our createServer error ', error);
         return error as GenericError; 
     }
   }


   @Mutation(() => ChannelOrErrorUnion)
   async createChannel(
     @Arg('serverId', () => String, {nullable: false}) serverId: string, 
     @Arg('name', () => String, {nullable: false}) name: string,
   ): Promise<typeof ChannelOrErrorUnion> {
     try {
       const res = await this.serverControl.createNewChannel(serverId,name); 
       if ('code' in res || res instanceof Error) throw (res);
       return res; 
     } catch (error) {
         return error as GenericError; 
     }
   }

   @Mutation(() => SuccessOrErrorUnion)
   async deleteChannel(
     @Arg('serverId', () => String, {nullable: false}) serverId: string, 
     @Arg('channelId', () => String, {nullable: false}) channelId: string,
   ): Promise<typeof SuccessOrErrorUnion> {
     try {
       const res = await this.serverControl.deleteChannel(serverId,channelId); 
       if ('code' in res || res instanceof Error) throw (res);
       return res; 
     } catch (error) {
         return error as GenericError; 
     }
   }


   @Mutation(() => SuccessOrErrorUnion)
   async promoteToAdmin(
    @Arg('userId', () => ID, {nullable: false}) userId: string, 
    @Arg('serverId', () => String, {nullable: false}) serverId: string, 
   ): Promise<typeof SuccessOrErrorUnion> {
      try {
        const res = await this.serverControl.promoteToAdmin(serverId,userId);
        if ('code' in res || res instanceof Error) throw (res);
        return res; 
      } catch (error) {
          return error as GenericError; 
      }
   }
    
   @Mutation(() => SuccessOrErrorUnion)
   async demoteAdmin(
    @Arg('userId', () => ID, {nullable: false}) userId: string, 
    @Arg('serverId', () => String, {nullable: false}) serverId: string, 
   ): Promise<typeof SuccessOrErrorUnion> {
      try {
        const res = await this.serverControl.demoteAdmin(serverId,userId);
        if ('code' in res || res instanceof Error) throw (res);
        return res; 
      } catch (error) {
          return error as GenericError; 
      }
   }

   @Query(() => ServerFileConnectionOrErrorUnion)
   async getSavedServerFiles(
     @Arg('serverId', () => String, {nullable: false}) serverId: string, 
     @Arg('channelId', () => String, {nullable: false}) channelId: string, 
     @Arg('limit', () => Int, {nullable: false}) limit: number, 
     @Arg('cursor', () => String) cursor: string | null
   ): Promise<typeof ServerFileConnectionOrErrorUnion> {
     try { 
        const res = await this.serverControl.getServerSavedFiles(serverId,channelId,limit,cursor); 
        if (res instanceof Error) throw (res); 
        const { cloudRepo } = this.serverControl;
        if (res.edges !== undefined && res.edges.length > 0) {
          res.edges.forEach((msg) => {
            msg.cloudService = cloudRepo; 
          });
        }  
        return res; 
     } catch (error) {
        return error as GenericError; 
     }
   }  

   @Mutation(() => SuccessOrErrorUnion)
   async addFileToServerSaved(
     @Arg('key', () => String, {nullable: false}) key: string, 
     @Arg('serverId', () => String, {nullable: false}) serverId: string, 
     @Arg('channelId', () => String, {nullable: false}) channelId: string, 
   ): Promise<typeof SuccessOrErrorUnion> {
     try { 
        const res = await this.serverControl.addFileToServerSaved(key,serverId,channelId);
        if (res instanceof Error) throw (res); 
        return res; 
     } catch (error) {
        return error as GenericError; 
     }
   }

   

  
}