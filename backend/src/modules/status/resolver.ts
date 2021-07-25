import 'reflect-metadata';
import { withFilter } from 'graphql-subscriptions';
import { BasicError, 
         ErrorCode } from '../__shared__/error';
import { Context } from '../__shared__/interfaces';
import { StatusCommentConnectionOrErrorUnion,
         StatusFeedOrErrorUnion,
         ThndrConnectionOrErrorUnion, 
         ThndrOrErrorUnion } from './types.resolver';
import { Arg, 
         Resolver, 
         Query, 
         Ctx, 
         Mutation, 
         ID, 
         Root,
         Publisher,
         Subscription, 
         Int, 
         PubSub } from 'type-graphql';

import { RThndr, 
  StatusComment, 
         StatusCommentInput, 
         Thndr } from './schema';
import { NotificationOrErrorUnion, SuccessOrErrorUnion } from '../__shared__/types.resolver';
import { GenericError } from '../__shared__/schema';
import StatusController from './controller';
import MongoDBStatusRepo from './repo.mongo';
import { CloudFrontRepo } from '../__shared__/aws/cloudfront';
import { S3Repo } from '../__shared__/aws/s3';
import MongoDBUserRepo from '../user/repo.mongo';
import { Service } from 'typedi';
import MongoDBStatusReactionsRepo from './reactions.repo';
import { NOTIFICATIONS } from '../__shared__/notification/interface';
import { IStatusComment } from './interfaces';
import MongoDBNotificationRepo from '../__shared__/notification/mongo.repo';

@Service()
@Resolver()
export class StatusResolver {

  private statusControl: StatusController; 
  constructor (private readonly mongoStatusRepo: MongoDBStatusRepo,
               private readonly mongoUserRepo: MongoDBUserRepo,
               private readonly reactionsRepo: MongoDBStatusReactionsRepo,
               private readonly s3Repo: S3Repo,
               private readonly cloudFront: CloudFrontRepo,
               private readonly notifications: MongoDBNotificationRepo) {
    this.statusControl = new StatusController(mongoStatusRepo,
                                              mongoUserRepo,
                                              reactionsRepo,
                                              s3Repo,
                                              cloudFront,
                                              notifications);
  }

  @Mutation(() => ThndrOrErrorUnion)
  async createThndrStatus(
     @Arg('text', () => String) text: string,
     @Arg('keys', () => [String]) keys: string[],
     @Ctx() context: Context,
     @PubSub('STATUS_CREATED') statusCreated: Publisher<RThndr>
  ): Promise<typeof ThndrOrErrorUnion> {
     try {
          if (!text && !keys) throw (new BasicError(ErrorCode.UserInputError))
          const { user } = context; 
          const { _id } = user; 
          const res = await this.statusControl.createThndr(text,keys,_id); 
          if (res instanceof BasicError) throw (res); 
          // console.log('before pubsub ', res);
          console.log('the res ', res);
          const redisThndr: RThndr = {
            ...res,
            createdAt: res.createdAt ? res.createdAt.toString() : new Date().toString(),
            updatedAt: res.updatedAt ? res.updatedAt.toString() : new Date().toString()
          }
          await statusCreated(redisThndr);
          return {
            ...res,
            statusControl: this.statusControl
          }; 
    } catch (error) {
        console.log('the error ', error); 
        return error as GenericError; 
    }
  }

  // @Subscription(() => Thndr, {
  //   subscribe: withFilter(
  //    () => pubSub.asyncIterator('statusCreated'),
  //    (thndr: Thndr) => {
  //      return !!thndr && true;
  //    }), 
  //  })
  //  statusCreated(
  //     @Root() thndr: Thndr,
  //     @Ctx() context: Context
  //  ): Thndr {
  //      const { user } = context; 
  //      const { _id } = user; 
  //      console.log('the thndr ', thndr); 
  //      if (_id === thndr.userId || _id.toString() === thndr.userId || user.followingIds.includes(thndr.userId)) {
  //        console.log('our thndr ', thndr);
  //        return thndr; 
  //      }
  // }

  @Subscription(() => Thndr, {
    topics: 'STATUS_CREATED'
   })
   statusCreated(
      @Root() thndr: RThndr,
      @Ctx() context: Context
   ): Thndr {
       const { user } = context; 
       const { _id } = user; 
       if (_id === thndr.userId || _id.toString() === thndr.userId.toString()|| user.followingIds.includes(thndr.userId)) {
        return {
          ...thndr,
          createdAt: new Date(thndr.createdAt),
          updatedAt: new Date(thndr.updatedAt), 
          statusControl: this.statusControl
        }; 
       }
  }


  @Mutation(() => SuccessOrErrorUnion) 
  async deleteThndrStatus(
    @Arg('id', () => ID) id: string,
  ): Promise<typeof SuccessOrErrorUnion> {
    try {
        // If thndr exists delete it and return success
        // otherwise return error
        const res = await this.statusControl.deleteThndr(id); 
        if (res instanceof BasicError) throw (res); 
        return res;  
     } catch (error) {
        return error as GenericError; 
     }
  } 

  @Query(() => ThndrConnectionOrErrorUnion)
  async getThndrFeed(
    @Arg('limit', () => Int, {nullable: false}) limit: number,
    @Ctx() context: Context,
    @Arg('cursor', () => String) cursor?: string | null, 
  ): Promise<typeof ThndrConnectionOrErrorUnion> {
    try { 
      const { _id } = context.user; 
      const res = await this.statusControl.getThndrFeed(_id,cursor,limit); 
      if ('code' in res || res instanceof Error) throw (res);
      console.log('how res ', res); 
      return res; 
    } catch (error) {
        return error as GenericError; 
    }
  }

  // Queries for a users feed
  // includes all Thndr/Reverbs from the owners
  // followed users and the owner's Thndr/Reverbs
  // @Authorized()
  @Query(() => StatusFeedOrErrorUnion, {nullable: false})
  async statusFeed(
      @Arg('limit', () => Int, {nullable: false}) limit: number,
      @Ctx() context: Context,
      @Arg('cursor', () => String) cursor?: string | null,
  ): Promise<typeof StatusFeedOrErrorUnion> {
      try {
        const { _id } = context.user; 
        const res = await this.statusControl.createStatusConnection(_id,cursor,limit); 
        if ('code' in res || res instanceof Error) throw (res);
        (res.edges).forEach((edge) => {
          (edge as Thndr).statusControl = this.statusControl; 
        });
    
        return res; 
      } catch (error) {
        if (error instanceof Error) return error as GenericError; 
      }
  }
   
  @Mutation(() => SuccessOrErrorUnion)
  async pickEmojiReaction(
    @Arg('thndrId', () => ID, {nullable: false}) thndrId: string,
    @Arg('type', () => String, {nullable: false}) type: string,
    @Ctx() context: Context
  ): Promise<typeof SuccessOrErrorUnion> {
    try {
      const { _id } = context.user; 
      const res = await this.statusControl.pickReaction(thndrId,type,_id);
      if (res instanceof BasicError) throw (res); 
      return res; 
    } catch (error) {
        return error as GenericError; 
    }
  }

  @Mutation(() => SuccessOrErrorUnion)
  async removeEmojiReaction(
    @Arg('thndrId', () => ID, {nullable: false}) thndrId: string,
    @Arg('type', () => String, {nullable: false}) type: string,
    @Ctx() context: Context
  ): Promise<typeof SuccessOrErrorUnion> {
    try {
      const { _id } = context.user; 
      const res = await this.statusControl.removeReaction(thndrId,type,_id);
      if (res instanceof BasicError) throw (res); 
      return res; 
    } catch (error) {
        return error as GenericError; 
    }
  }

  @Mutation(() => SuccessOrErrorUnion)
  async createStatusComment(
    @Arg('input', () => StatusCommentInput, {nullable: false}) input: StatusCommentInput,
    @PubSub(NOTIFICATIONS.STATUS_COMMENT) statusCommentNotifier: Publisher<IStatusComment>,
    @Ctx() context: Context
  ): Promise<typeof SuccessOrErrorUnion> {
    try {
      const { user } = context; 
      const { _id } = user; 
      const { statusId, fileKeys, text } = input; 
      if (!text && fileKeys) {
        const res = await this.statusControl.createComment(_id,{statusId,fileKeys})
        if (res instanceof Error) throw (res); 

        await statusCommentNotifier(res); 
        return {success:true}; 
      } else if (text && !fileKeys) {
        const res = await this.statusControl.createComment(_id,{statusId,text})
        if (res instanceof Error) throw (res);
        await statusCommentNotifier(res);  
        return {success:true}; 
      } else if (text && fileKeys) {
        const res = await this.statusControl.createComment(_id,{statusId,text,fileKeys})
        if (res instanceof Error) throw (res); 
        await statusCommentNotifier(res); 
        return {success:true}; 
      } else {
         throw (new BasicError(ErrorCode.UserInputError,
                              `Comments must have an input`))
      }
    } catch (error) {
        return error as GenericError; 
    }
  }

  @Query(() => StatusCommentConnectionOrErrorUnion)
  async getStatusComments(
    @Arg('statusId', () => String, {nullable: false}) statusId: string,
    @Arg('limit', () => Int, {nullable: false}) limit: number,
    @Arg('cursor', () => String) cursor: string | null
  ): Promise<typeof StatusCommentConnectionOrErrorUnion> {
    try { 
      const res = await this.statusControl.getStatusComments(statusId,limit,cursor); 
      if (res instanceof Error) throw (res);
      res.edges.map((comment) => {
        (comment as StatusComment).statusControl = this.statusControl; 
      })
      return res; 
    } catch (error) {
        return error as GenericError; 
    }
  }

  @Subscription(() => NotificationOrErrorUnion,  {
    topics: [NOTIFICATIONS.STATUS_COMMENT]
  })
  async statusCommentNotification(
    @Root() input: IStatusComment, 
    @Ctx() context: Context
  ): Promise<typeof NotificationOrErrorUnion> {
    try { 
      const { user } = context; 
      const { _id } = user; 
      const { statusId } = input; 
      const status = await this.statusControl.findStatus(statusId); 
      if (status instanceof Error) throw (status); 
      const owner = await this.statusControl.queryOwnerData(status.userId); 
      if (owner instanceof Error) throw (owner); 
      if (owner._id === _id) {
        const notif = await this.statusControl.notifRepo.createNotification(input.userId,[owner._id],NOTIFICATIONS.STATUS_COMMENT); 
        if (notif instanceof Error) throw (notif); 
        return notif;  
      }
    } catch (error) {
        return error as GenericError; 
    }
  }

  @Mutation(() => SuccessOrErrorUnion)
  async deleteStatusComment(
    @Arg('commentId', () => String, {nullable: false}) commentId: string
  ): Promise<typeof SuccessOrErrorUnion> {
    try {
      const res = await this.statusControl.deleteStatusComment(commentId); 
      if (res instanceof Error) throw (res); 
      return res; 
    } catch (error) {
        return error as GenericError; 
    }
  }


  


}


