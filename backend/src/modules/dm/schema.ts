import 'reflect-metadata';
import { IConversation, IDirectMessage, IIncomingPrivateMessage } from './interfaces';
import { ObjectType, Field, ID, Root, InputType, Int } from 'type-graphql';
import { ICloudServiceRepo } from '../__shared__/interfaces';
import { FileUrlListOrErrorUnion, UserListOrErrorUnion } from '../__shared__/types.resolver';
import { GenericError } from '../__shared__/schema';
import { IUserRepo } from '../user/interfaces';
import { BasicError } from '../__shared__/error';
import { User } from '../user/schema';

@ObjectType() 
export class DMLog { 
  @Field(() => [DirectMessage], {nullable:false})
  chatMsgs: DirectMessage[]; 
}

@ObjectType()
export class DirectMessage {
  constructor (public cloudService?: ICloudServiceRepo, public userRepo?: IUserRepo) {} 
  @Field(() => [String], {nullable: false})
  users: IDirectMessage['users'];
  @Field(() => UserListOrErrorUnion, {nullable: false})
  async getUsers?(
    @Root() convo: Conversation
  ): Promise<typeof UserListOrErrorUnion> {
    try {
      if (this.userRepo !== undefined) {
        const fromUser = await this.userRepo.findUser(convo.from);
        const toUser = await this.userRepo.findUser(convo.userTo);
        if ('code' in fromUser || 'code' in toUser) throw (new BasicError());
        if (this.cloudService !== undefined) {
          fromUser.cloudService = this.cloudService;
          toUser.cloudService = this.cloudService; 
        }
        return {users: [fromUser,toUser]}; 
      }
    } catch (error) {
        return error as GenericError; 
    }
  } 
  @Field(() => [Conversation], {nullable:false})
  conversation: Conversation[];
}

@ObjectType()
export class Conversation {
    constructor (public cloudService?: ICloudServiceRepo, public userRepo?: IUserRepo) {}
    @Field(() => ID, {nullable: false})
    _id?: IConversation['_id']; 
    @Field(() => ID, {nullable: false})
    from: IConversation['from'];
    @Field(() => ID, {nullable: false})
    userTo: IConversation['userTo']; 
    @Field(() => UserListOrErrorUnion, {nullable: false})
    async getUsers?(
      @Root() convo: Conversation
    ): Promise<typeof UserListOrErrorUnion> {
      try {
        if (this.userRepo !== undefined) {
          const fromUser = await this.userRepo.findUser(convo.from);
          const toUser = await this.userRepo.findUser(convo.userTo);
          if ('code' in fromUser || 'code' in toUser 
              || toUser instanceof Error || fromUser instanceof Error) throw (new BasicError());
          if (this.cloudService !== undefined) {
            fromUser.cloudService = this.cloudService;
            toUser.cloudService = this.cloudService; 
          }
          const res = {users:[fromUser,toUser]}
          return res; 
        }
      } catch (error) {
          return error as GenericError; 
      }
    } 
    @Field(() => String, {nullable: false})
    msgId: IConversation['msgId'];
    @Field(() => String, {nullable: false})
    msg: IConversation['msg']; 
    @Field(() => [String], {nullable: false})
    fileKeys: IConversation['fileKeys'];
    @Field(() => FileUrlListOrErrorUnion)
    fileUrls?(
      @Root() chatMsg: Conversation
    ): typeof FileUrlListOrErrorUnion {
        try {
            let urls: string[] = [];
            const { fileKeys } = chatMsg; 
            if (fileKeys.length > 0 && this.cloudService !== undefined) {
              urls = this.cloudService.getUrls(fileKeys);
            }
            return {urls}; 
        } catch (error) {
            return error as GenericError; 
        }
    }
    @Field(() => Date, {nullable: false})
    createdAt: Date;
}


@InputType()
@ObjectType()
export class IncomingPrivateMessage {
  @Field(() => ID)
  userToId: IIncomingPrivateMessage['userToId']; 
  @Field(() => String)
  userTo: IIncomingPrivateMessage['userTo']; 
  @Field(() => ID)
  fromId: IIncomingPrivateMessage['fromId']; 
  @Field(() => String)
  from: IIncomingPrivateMessage['from']; 
  @Field(() => String)
  msg: IIncomingPrivateMessage['msg']; 
  @Field(() => [String])
  fileKeys: IIncomingPrivateMessage['fileKeys'];
  @Field(() => Date)
  createdAt: IIncomingPrivateMessage['createdAt'];  
}

@ObjectType()
export class DMConnection {
  @Field(() => [Conversation], {nullable: false})
  edges: Conversation[];
  @Field(() => DMPageInfo, {nullable: false})
  pageInfo: DMPageInfo; 
}

@ObjectType()
export class DMPageInfo {
  @Field(() => Boolean, {nullable: false})
  hasNextPage: boolean; 
  @Field(() => Int, {nullable: false})
  start: number; 
  @Field(() => Int, {nullable: false})
  end: number; 
}


@ObjectType() 
export class DMUserGroupList {
  @Field(() => [DMUserGroup], {nullable: false})
  groups: DMUserGroup[]; 
}


@ObjectType()
export class DMUserGroup {
  @Field(() => [User], {nullable: false})
  users: User[]; 
}



