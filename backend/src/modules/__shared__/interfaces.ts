import DirectMessageAPI from '../dm/api';
import ServerAPI from '../server/api';
import { IUser } from '../user/interfaces';
import { BasicError,
         ISuccess } from './error';

export interface Context {
  user: IUser;
  dataSources?: {server: ServerAPI, dm: DirectMessageAPI}; 
}


// FIXME: 
// Create better naming distinction between S3 database files and 
// the File domain in Thndr microservices 
export interface IBlobRepo {
  downloadFile: (key: string, bucket: string) => Promise<ISuccess | BasicError>; 
  sizeOfFile: (key: string, bucket: string) => Promise<number | BasicError>; 
  getS3SignedUrl: (bucketName: string, key: string, expires: number, type: string, acl: string) => Promise<string | BasicError>;
  createUserFileKey: (userId: string, fname: string, ftype: string) => string;
  deleteFile:  (key: string) => ISuccess | BasicError; 
  handleGetPreSignedUrl: (fName: string, fType: string, userId: string, serverId?: string) => Promise<{url: string, key: string} | BasicError> 
}

export interface ICloudServiceRepo { 
  getUrl: (key: string) => string; 
  getUrls: (keys: string[]) => string[];
}

export interface IReactionsRepo {
  hasReacted: (reactions: IReactions, userId: string) => string | BasicError; 
  heartReaction: (thndrId: string, userId: string) => Promise<ISuccess | BasicError>; 
  removeHeartReaction: (thndrId: string, userId: string) => Promise<ISuccess | BasicError>;
  thumbsUpReaction: (thndrId: string, userId: string) => Promise<ISuccess | BasicError>; 
  removeThumbsUpReaction: (thndrId: string, userId: string) => Promise<ISuccess | BasicError>; 
  thumbsDownReaction: (thndrId: string, userId: string) => Promise<ISuccess | BasicError>; 
  removeThumbsDownReaction: (thndrId: string, userId: string) => Promise<ISuccess | BasicError>; 
  prayReaction: (thndrId: string, userId: string) => Promise<ISuccess | BasicError>;  
  removePrayReaction: (thndrId: string, userId: string) => Promise<ISuccess | BasicError>; 
  raisedHandsReaction: (thndrId: string, userId: string) => Promise<ISuccess | BasicError>; 
  removeRaisedHandsReaction: (thndrId: string, userId: string) => Promise<ISuccess | BasicError>; 
}

export interface IReactions {
  heart: string[]; 
  thumbsup: string[];
  thumbsdown: string[];
  pray: string[]; 
  raised_hands: string[];
}

export interface IPageInfo {
  hasNextPage: boolean; 
  endCursor: string; 
}

export interface UpdatedDocument {
  n: number; 
  nModified: number; 
}

export interface DecodedInfo {
  userId: string; 
  iat: number; 
  exp: number; 
}

export interface ConnectionContext {
  context: {
    authToken: string; 
  } 
}


export interface IDeleteServerMessageData {
  serverId: string; 
  channelId: string; 
  msgId: string; 
}

export interface INodeMailerConfig {
  host: string; 
  secureConnection: boolean; 
  port: number; 
  auth: {
    user: string; 
    pass: string; 
  }
}


export interface IServerInviteCode {
  code: string; 
  expiration: Date; 
}

