import { IUser, 
         IUserRepo } from '../user/interfaces';
import { BasicError, 
         ISuccess } from "../__shared__/error";
import { ICloudServiceRepo } from '../__shared__/interfaces';
import { IDirectMessageModel } from './directMessage.model';
import { FileUrlListOrErrorUnion, 
         UserListOrErrorUnion } from '../__shared__/types.resolver';
import { Conversation } from './schema';

export interface IDirectMessageRepo {
  getDMUsers: (userId: string, findUser: (userId: string) => Promise<IUser | BasicError>) => Promise<IDMUserGroupList | BasicError>; 
  getConversation: (fromId: string, toIds: string[], start: number, end: number, limit: number) => Promise<IDMConnection | BasicError>; 
  loadConversation: (fromUserId: string, toUserId: string, cursor: string, limit: number) => Promise<IDirectMessage[] | BasicError>; 
  loadDMGroups: (userId: string, findUser: (userId: string) => Promise<BasicError | IUser>) => Promise<IDirectMessage[] | BasicError>;
  getDM: (fromId: string, toIds: string[]) => Promise<IDirectMessage | BasicError>; 
  startDM: (fromId: string, toIds: string[], createDMGroup: (fromId: string, toIds: string[]) => Promise<ISuccess | BasicError>) => Promise<IDirectMessage | BasicError>;
  dmGroupExists: (fromId: string, toIds: string[]) => Promise<boolean | BasicError>; 
  removeDMConvo: (fromId: string, toIds: string[], deleteDMGroup: (fromId: string, toIds: string[]) => Promise<ISuccess | BasicError>) => Promise<ISuccess | BasicError>;
  insertDM: (msg: IIncomingPrivateMessage) => Promise<IConversation | BasicError>;
  deleteDM: (msgId: string, fromUserId: string, toUserId: string) => Promise<ISuccess | BasicError>;
}


export interface IDMUserGroupList {
  groups: IDMUser[]; 
}

export interface IDMUser {
  users: IUser[]; 
}

export interface INewDMInput {
  fromId: string; 
  toIds: string[]; 
}

export interface IDMLog {
  chatMsgs: IDirectMessage[];
}

export interface IDirectMessage {
  users: IDirectMessageModel['users'];
  conversation: IDirectMessageModel['conversation'];
  cloudService?: ICloudServiceRepo; 
  userRepo?: IUserRepo; 
  getUsers?: () => Promise<typeof UserListOrErrorUnion>;   
}

export interface IConversation {
  _id?: string; 
  from: string; 
  userTo: string; 
  msgId: string; 
  msg: string; 
  fileKeys: string[]; 
  createdAt: Date;
  cloudService?: ICloudServiceRepo;
  userRepo?: IUserRepo; 
  fileUrls?: (chatMsg: Conversation) => typeof FileUrlListOrErrorUnion; 
}

export interface IIncomingPrivateMessage {
  from: string;
  fromId: string;
  userTo: string;
  userToId: string; 
  msg: string;
  fileKeys: string[]; 
  createdAt: Date;
}


export interface IDMConnection {
  edges: IConversation[];
  pageInfo: IDMPageInfo; 
}

export interface IDMPageInfo {
  hasNextPage: boolean; 
  start: number; 
  end: number;
}