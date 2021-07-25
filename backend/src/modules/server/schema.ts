import { Field, 
         ID, 
         Int, 
         ObjectType, 
         Root } from 'type-graphql';
import { IUserRepo } from '../user/interfaces';
import { ICloudServiceRepo } from '../__shared__/interfaces';
import { GenericError, 
         PageInfo, 
         Reactions, 
         ServerInvitationCode } from '../__shared__/schema';
import { FileUrlListOrErrorUnion, 
  FileUrlOrErrorUnion, 
         UserOrErrorUnion } from '../__shared__/types.resolver';
import { SERVERTIER } from './types';

@ObjectType()
export class ServerData {
  @Field(() => String, {nullable: false})
  ownerId: string; 
  @Field(() => [ID], {nullable: false})
  adminIds: string[]; 
  @Field(() => Int, {nullable: false})
  size: number; 
  @Field(() => SERVERTIER, {nullable: false})
  tier: SERVERTIER; 
  @Field(() => [Channel], {nullable: false})
  channels: Channel[];
  @Field(() => String, {nullable: false})
  serverId: string;
  @Field(() => String, {nullable: false})
  name: string; 
}

@ObjectType()
export class ServerDataList {
   @Field(() => [ServerData], {nullable: false})
   servers: ServerData[]; 
}

@ObjectType()
export class Channel {
  @Field(() => String, {nullable: false})
  serverId: string; 
  @Field(() => String, {nullable: false})
  channelId: string; 
  @Field(() => String, {nullable: false})
  channelName: string; 
}

@ObjectType()
export class ChannelData {
  @Field(() => ID, {nullable: false})
  serverId: string; 
  @Field(() => String, {nullable: false})
  channelId: string; 
  @Field(() => String)
  channelName?: string; 
  @Field(() => [ServerMessage], {nullable: false})
  msgs: ServerMessage[]; 
  @Field(() => String)
  cursor?: string | null; 
}

@ObjectType()
export class ChannelDataList {
   @Field(() => [ChannelData])
   channelData: ChannelData[];
}

@ObjectType()
export class Server {
    @Field(() => String, {nullable: false})
    serverId: string;
    @Field(() => String, {nullable: false})
    serverName: string; 
    @Field(() => ID, {nullable: false})
    ownerId: string; 
    @Field(() => Int, {nullable: false})
    size: number; 
    @Field(() => SERVERTIER, {nullable: false}) 
    tier: SERVERTIER;
    @Field(() => [ID], {nullable: false})
    admins: string[];
    @Field(() => [ServerInvitationCode], {nullable: false})
    inviteCodes: ServerInvitationCode[]; 
}

@ObjectType()
export class ServerList {
   @Field(() =>  [Server])
   servers: Server[]; 
}


@ObjectType()
export class ServerMessageConnection {
    @Field(() => String, {nullable: false})
    serverId: string; 
    @Field(() => String, {nullable: false})
    channelId?: string; 
    @Field(() => [ServerMessage], {nullable: false})
    edges: ServerMessage[];
    @Field(() => PageInfo, {nullable: false})
    pageInfo: PageInfo; 
}

@ObjectType()
export class ServerMessage {
    constructor (public cloudService?: ICloudServiceRepo, public userRepo?: IUserRepo) {}
    @Field(() => String, {nullable: false})
    serverId: string; 
    @Field(() => String, {nullable: false})
    channelId: string; 
    @Field(() => ID, {nullable: false})
    fromId: string;
    @Field(() => UserOrErrorUnion, {nullable: false})
    async fromUser?(
      @Root() msg: ServerMessage
    ): Promise<typeof UserOrErrorUnion> {
        try {
          const user = await this.userRepo.findUser(msg.fromId);
          if ('code' in user || user instanceof Error) throw (user);
          return {_id: msg.fromId, username: user.username}; 
        } catch (error) {
          return error as GenericError; 
        }
    }
    @Field(() => String, {nullable: false})
    msg: string; 
    @Field(() => String, {nullable: false})
    msgId: string; 
    @Field(() => [String], {nullable: false})
    fileKeys: string[]; 
    @Field(() => FileUrlListOrErrorUnion, {nullable: false})
    fileUrls?(
        @Root() msg: ServerMessage
    ): typeof FileUrlListOrErrorUnion {
        try {
            if (this.cloudService !== undefined) {
                const { fileKeys } = msg; 
                const urls = this.cloudService.getUrls(fileKeys);
                return {urls}; 
            }
        } catch (error) {
            return error as GenericError; 
        }
    }
    @Field(() => Reactions, {nullable: false})
    reactions: Reactions;
    @Field(() => Boolean, {nullable: false})
    isSaved: boolean; 
    @Field(() => Boolean, {nullable: false})
    deleted: boolean;   
    @Field(() => String, {nullable: false})
    createdAt: string; 
}


@ObjectType()
export class ServerFile {
  constructor (public cloudService?: ICloudServiceRepo) {}
  @Field(() => String, {nullable: false})
  serverId: string; 
  @Field(() => String, {nullable: false})
  channelId: string; 
  @Field(() => String, {nullable: false})
  key: string;
  @Field(() => FileUrlOrErrorUnion, {nullable: false})
  fileUrl?(
      @Root() file: ServerFile
  ): typeof FileUrlOrErrorUnion {
      try {
          if (this.cloudService !== undefined) {
              const { key } = file; 
              const url= this.cloudService.getUrl(key);
              return {url}; 
          }
      } catch (error) {
          return error as GenericError; 
      }
  }
}


@ObjectType()
export class ServerFileConnection {
  @Field(() => [ServerFile], {nullable: false})
  edges: ServerFile[]; 
  @Field(() => PageInfo, {nullable: false})
  pageInfo: PageInfo; 
}