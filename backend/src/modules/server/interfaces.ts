import { IServerInviteCode, 
         IPageInfo, 
         IReactions, 
         ICloudServiceRepo} from '../__shared__/interfaces';
import { BasicError, 
         ISuccess } from '../__shared__/error';
import { SERVERTIER } from './types';
import { IServerJoined, 
         IUser, 
         IUserRepo } from '../user/interfaces';
import { Document } from 'mongoose';
import { IServerMessageModel } from './serverMessage.model';
import { CloudFrontRepo } from '../__shared__/aws/cloudfront';
import { UserOrErrorUnion } from '../__shared__/types.resolver';
import { IServerFileModel } from './file.model';



export interface IServerRepo {
   generateId: () => string;
   loadChannelMsgs: (serverId: string, channelId: string, cursor: string, limit: number) => Promise<IServerMessageConnection | BasicError>; 
   loadServerMsgs: (serverId: string, limit: number) => Promise<IChannelData[] | BasicError>; 
   getUserServerList: (userId: string, getServers: (userId: string) => Promise<IServerJoined[] | BasicError>) => Promise<IServerData[] | BasicError>;
   joinServer: (serverId: string, userId: string, inviteCode?: string) => Promise<IServerData | BasicError>;
   leaveServer: (serverId: string, username: string, pullServerFromUser: (serverId: string, userId: string) => Promise<ISuccess | BasicError>) => Promise<ISuccess | BasicError>; 
   getServerName: (serverId: string) => Promise<string>;
   updateActive: (userId: string, serverId: string) => Promise<ISuccess | BasicError>; 
   getActiveUsers: (serverId: string) => Promise<IUser[] | BasicError>; 
   getUnactiveUsers: (serverId: string) => Promise<IUser[] | BasicError>;
   createServer: (serverName: string, channelName: string, ownerId: string) => Promise<IServerData | BasicError>; 
   deleteServer: (serverId: string, userId: string) => Promise<ISuccess | BasicError>; 
   deleteChannel: (serverId: string, channelId: string) => Promise<ISuccess | BasicError>; 
   renameChannel: (serverId: string, channelId: string, name: string) => Promise<ISuccess | BasicError>; 
   renameServer: (serverId: string, name: string) => Promise<ISuccess | BasicError>; 
   changeOwner: (serverId: string, username: string) => Promise<void | BasicError>; 
   userIsOwner: (serverId: string, userId: string) => Promise<boolean | BasicError>; 
   createChannel: (serverId: string, channelName: string) => Promise<IChannel | BasicError>; 
   getServerMessageFileUrls: (msg: IServerMessage, getUrl: (key: string) => string) => string[] | BasicError; 
   getMsg: (serverId: string, channelId: string, msgId: string) => Promise<IServerMessageModel | BasicError>; 
   changeServerTier: (serverId: string, tier: SERVERTIER) => Promise<ISuccess | BasicError>; 
   findMessage: (serverId: string, msgId: string) => Promise<IServerMessage | BasicError>; 
   savedMessages: (serverId: string, limit: number, cursor: string | null) => Promise<IServerMessageConnection | BasicError>; 
   saveMessage: (serverId: string, msgId: string) =>  Promise<ISuccess | BasicError>; 
   unsaveMessage: (serverId: string, msgId: string) => Promise<ISuccess | BasicError>; 
   updateServerSize: (serverId: string, sizeOfMsg: number) => Promise<ISuccess | BasicError>; 
   sizeOfServerMessages: (serverId: string, sizeOfFile: (key: string, bucket: string) => Promise<number | BasicError>) => Promise<number | BasicError>; 
   sizeOfServerFiles: (serverId: string,  sizeOfFile: (key: string, bucket: string) => Promise<number | BasicError>) => Promise<number | BasicError>;
   isUserAdmin: (serverId: string, userId: string) => Promise<boolean | BasicError>; 
   addAdmin: (serverId: string, username: string) => Promise<ISuccess| BasicError>; 
   removeAdmin: (serverId: string, userId: string) => Promise<ISuccess | BasicError> 
   getMessageSize: (msg: IServerMessageModel, sizeOfFile: (key: string, bucket: string) => Promise<number | BasicError>) => Promise<number | BasicError>;
   insertMessage: (msg: IIncomingServerMessage, sizeOfFile: (key: string, bucket: string) => Promise<number | BasicError>) => Promise<IServerMessage | BasicError>;
   deleteMsg: (serverId: string, channelId: string, msgId: string, sizeOfFile: (key: string, bucket: string) => Promise<number | BasicError>) => Promise<ISuccess | BasicError>; 
   getServerSavedFiles: (serverId: string, channelId: string, limit: number, cursor: string | null) => Promise<IServerFileConnection | BasicError>; 
   addFileToServerSaved: (key: string, serverId: string, channelId: string) => Promise<ISuccess | BasicError>; 
}  


export interface IRemoveUserInfo {
  serverId: string; 
  userId: string; 
  removeId: string;  
}


export interface IServer {
   serverId: string; 
   serverName: string; 
   ownerId: string; 
   size: number; 
   tier: SERVERTIER;
   inviteCodes: IServerInviteCode[];
   admins: string[];
}

export interface IChannel {
   serverId: string; 
   channelId: string; 
   channelName: string; 
}

export interface IChannelData {
   serverId: string; 
   channelId: string; 
   msgs: IServerMessage[]; 
   cursor?: string | null; 
}

export interface IServerMessageConnection {
   serverId: string; 
   channelId?: string; 
   edges: IServerMessage[];
   pageInfo: IPageInfo; 
}

export interface IServerMessage {
   serverId: string; 
   channelId: string; 
   fromId: string; 
   fromUser?: () => Promise<typeof UserOrErrorUnion>; 
   msg: string; 
   msgId: string; 
   fileKeys: string[]; 
   reactions: IReactions;
   isSaved: boolean; 
   deleted: boolean; 
   createdAt: string; 
   cloudService?: CloudFrontRepo;
   userRepo?: IUserRepo;   
}

export interface IIncomingServerMessage {
   serverId: string; 
   channelId: string;
   fromId: string,  
   from?: string; 
   msg: string; 
   fileKeys: string[];  
   createdAt: Date; 
}

export interface IOutgoingServerMessage {
   serverId: string; 
   channelId: string;
   fromId: string,  
   fromUser: {
     username: string; 
   }
   msg: string; 
   fileUrls: {urls:string[]};  
   createdAt: Date; 
}

export interface MessageSize extends Document {
   _id: string;
   combined_object_size: number;
 }
 
export interface IServerMessageConnection {
   edges: IServerMessage[];
   pageInfo: IPageInfo; 
}

export interface SocketClient {
   userId: string;
   id: string;
 }
 
 export interface SocketAction {
   type: string;
   payload: any;
 }
 
 export interface IServerData {
   ownerId: string; 
   adminIds: string[]; 
   size: number; 
   tier: SERVERTIER; 
   channels: IChannel[];
   serverId: string;
   name: string; 
 }

 export interface IServerFile {
   serverId: IServerFileModel['serverId']; 
   channelId: IServerFileModel['channelId']; 
   key: IServerFileModel['key'];
   createdAt: IServerFileModel['createdAt'];
   cloudService?: ICloudServiceRepo;
 }

 export interface IServerFileConnection { 
    edges: IServerFile[]; 
    pageInfo: IPageInfo; 
 }