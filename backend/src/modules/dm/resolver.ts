/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import 'reflect-metadata';
import { Arg, Resolver, Query, ID, Ctx, Mutation, Int } from 'type-graphql';
import { Service } from 'typedi';
import MongoDBUserRepo from '../user/repo.mongo';
import { CloudFrontRepo } from '../__shared__/aws/cloudfront';
import { BasicError } from '../__shared__/error';
import { Context } from '../__shared__/interfaces';
import { GenericError, Success } from '../__shared__/schema';
import { BoolOrErrorUnion, SuccessOrErrorUnion, UserListOrErrorUnion } from '../__shared__/types.resolver';
import DirectMessageController from './controller';
import MongoDBDirectMessageRepo from './repo.mongo';
import { Conversation, DirectMessage, DMConnection, IncomingPrivateMessage } from './schema';
import { DMConnectionOrErrorUnion, DMLogOrErrorUnion, DMOrErrorUnion, DMUserGroupListOrErrorUnion } from './types.resolve';


@Service()
@Resolver(() => DirectMessage)
export class DirectMessageResolver {

  private dmControl: DirectMessageController; 
  constructor (public readonly dmRepo: MongoDBDirectMessageRepo,
               public readonly userRepo: MongoDBUserRepo,
               public readonly cloudFront: CloudFrontRepo) {
    this.dmControl = new DirectMessageController(dmRepo,userRepo,cloudFront);
  }


  @Query(() => DMUserGroupListOrErrorUnion)
  async getDMUsers(
    @Ctx() context: Context,    
  ): Promise<typeof DMUserGroupListOrErrorUnion> {
    try {
      const { user } = context; 
      const { _id } = user; 
      const res = await this.dmControl.getDMUsers(_id);
      if ('code' in res || res instanceof Error) throw (res);


      console.log('this is the res ', res); 
      res.groups.map((group) => {
        console.log('group ', group)
      })
      return res; 
    } catch (error) {
        if ('code' in error) {
          const { name, code, message } = error; 
          return {
            name,
            code, 
            message, 
            path: 'getDMUsers'
          } as GenericError;  
        } 
    }
  }




  @Query(() => DMConnectionOrErrorUnion)
  async getConversation(
    @Arg('fromId', () => ID, {nullable: false}) fromId: string, 
    @Arg('toIds', () => [ID], {nullable: false}) toIds: string[], 
    @Arg('start', () => Int, {nullable: false}) start: number, 
    @Arg('end', () => Int, {nullable: false}) end: number,
    @Arg('limit', () => Int, {nullable: false}) limit: number
  ): Promise<typeof DMConnectionOrErrorUnion> {
    try {
      const res = await this.dmControl.getConversation(fromId,toIds,start,end,limit);
      if ('code' in res || res instanceof Error) throw (res);
      const { cloudService, userRepo } = this.dmControl; 
      res.edges.forEach((msg) => {
        msg.cloudService = cloudService;
        msg.userRepo = userRepo; 
        return msg;
      })
      return res;  
    } catch (error) {
        if (error instanceof Error) {
          (error as GenericError).path = 'getConversation'; 
          return error as GenericError; 
        } 
    }
  }

  @Query(() =>  DMLogOrErrorUnion)
  async getUserConversation(
    @Arg('to', () => ID, {nullable: false}) to: string, 
    @Arg('from', () => ID, {nullable: false}) from: string, 
    @Arg('limit', () => Int, {nullable: false}) limit: number, 
    @Arg('cursor', () => String) cursor: string,
    @Ctx() context: Context,     
  ): Promise<typeof  DMLogOrErrorUnion> {
    try {
      const res = await context.dataSources.dm.loadConversation(from,to,limit,cursor);
      if ('code' in res || res instanceof Error) throw (res);
      return {chatMsgs: res}; 
    } catch (error) {
        if (error instanceof Error) {
          return error as GenericError; 
        } 
    }
  }
  
  @Query(() => DMLogOrErrorUnion)
  async loadDMs(
    @Arg('userId', () => ID, {nullable: false}) userId: string,
    @Ctx() context: Context,    
  ): Promise<typeof DMLogOrErrorUnion> {
    try {
      const res = await context.dataSources.dm.loadDMs(userId);
      if (res instanceof Error) throw (res);
      res.chatMsgs.forEach((dm) => {
        dm.userRepo = this.userRepo; 
        dm.conversation.forEach((convoMsg) => {
          convoMsg.cloudService = this.cloudFront;
        }); 
      });
      return res; 
    } catch (error) {
        if (error instanceof Error) {
          return error as GenericError; 
        } 
    }
  }


  @Mutation(() => SuccessOrErrorUnion) 
  async removeDMConvo(
    @Arg('toIds', () => [ID], {nullable: false}) toIds: string[], 
    @Ctx('context') context: Context 
  ): Promise<typeof SuccessOrErrorUnion> {
    try {
      const { user } = context; 
      const res = await this.dmControl.removeDMConvo(user._id,toIds);
      if ('code' in res || res instanceof Error) throw (res);
      return res; 
    } catch (error) {
        return error as GenericError; 
    }
  }

  @Mutation(() => DMOrErrorUnion)
  async startDM(
    @Arg('fromId', () => ID, {nullable:false}) fromId: string,
    @Arg('toIds', () => [ID], {nullable:false}) toIds: string[], 
  ): Promise<typeof DMOrErrorUnion> {
    try {
        const res = await this.dmControl.startNewDM(fromId,toIds);
        if ('code' in res) throw (res); 
        return res; 
    } catch (error) {
        return error as GenericError; 
    }
  }

  @Mutation(() => DMOrErrorUnion)
  async sendServerDM(
    @Arg('fromId', () => ID, {nullable: false}) fromId: string,
    @Arg('toId', () => ID, {nullable: false}) toId: string,
    @Arg('msg', () => IncomingPrivateMessage, {nullable:false}) msg: IncomingPrivateMessage,
  ): Promise<typeof DMOrErrorUnion> {
    try {
        const res = await this.dmControl.sendDMFromServer(fromId,toId,msg);
        if ('code' in res || res instanceof Error) throw (res); 
        return {
          users: [fromId, toId],
          conversation: [res]
        }; 
    } catch (error) {
        return error as GenericError; 
    }
  }

  @Mutation(() => DMOrErrorUnion)
  async sendDM(
    @Arg('msg', () => IncomingPrivateMessage, {nullable:false}) msg: IncomingPrivateMessage,
    @Ctx() context: Context,    
  ): Promise<typeof DMOrErrorUnion> {
    try {
        const res = await context.dataSources.dm.insertMessage(msg);
        if ('code' in res) throw (res); 
        return res; 
    } catch (error) {
        return error as GenericError; 
    }
  }

  @Mutation(() => SuccessOrErrorUnion)
  async deleteDM(
    @Arg('msgId', () => String, {nullable: false}) msgId: string, 
    @Arg('fromUserId', () => ID, {nullable:false}) fromUserId: string,
    @Arg('toUserId', () => ID, {nullable:false}) toUserId: string,
    @Ctx() context: Context   
  ): Promise<typeof SuccessOrErrorUnion> {
    try {
        const res = await context.dataSources.dm.deleteMessage(msgId,fromUserId,toUserId);
        if ('code' in res) throw (res); 
        return res; 
    } catch (error) {
        return error as GenericError; 
    }
  }
  
  @Query(() => BoolOrErrorUnion)
  async dmExists(
    @Arg('fromUserId', () => ID, {nullable:false}) fromUserId: string,
    @Arg('toUserId', () => ID, {nullable:false}) toUserId: string, 
    @Ctx() context: Context   
  ): Promise<typeof BoolOrErrorUnion> {
    try {
        const res = await context.dataSources.dm.dmExists(fromUserId,toUserId);
        if (res instanceof Error) throw (res); 
        return {bool:res}; 
    } catch (error) {
        return error as GenericError; 
    }
  }
}