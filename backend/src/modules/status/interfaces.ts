import { IPageInfo, 
         IReactions } from '../__shared__/interfaces';
import { BasicError, 
         ISuccess } from '../__shared__/error';
import { StatusList } from './types';
import { IUser } from '../user/interfaces';
import StatusController from './controller';
import { PreSignedInfoOrErrorUnion, 
        UserOrErrorUnion } from '../__shared__/types.resolver';
import { Thndr } from './schema';
import { IThndrModel } from './status.model';
import { IStatusCommentModel } from './comment.model';

export interface IStatusRepo {
  createThndr: (text: string, key: string[], userId: string) => Promise<IThndr | BasicError>; 
  createComment: (userId: string, input: IStatusCommentInput) => Promise<IStatusComment | BasicError>;
  getComments:  (statusId: string, limit: number, cursor: string | null) => Promise<IStatusCommentConnection | BasicError>;
  deleteComment: (commentId: string) => Promise<ISuccess | BasicError>; 
  getAllComments: (statusId: string) => Promise<IStatusComment[] | BasicError>; 
  getStatusFeed: (userId: string, cursor: string | null, limit: number, findUser: (userId: string) => Promise<IUser | BasicError>) => Promise<StatusList | BasicError>; 
  getThndrFeed: (userId: string, cursor: string | null, limit: number, findUser: (userId: string) => Promise<IUser | BasicError>) => Promise<IThndr[] | BasicError>;
  getThndr: (thndrId: string) => Promise<IThndrModel | BasicError>;
  getThndrOwner: (userId: string, findUser: (userId: string) => Promise<IUser | BasicError>) => Promise<{_id: string, username: string, name: string, avatar: string} | BasicError>;
  likeThndrById: (thndrId: string, ownerId: string) => Promise<ISuccess | BasicError>;
  unlikeThndrById: (thndrId: string, ownerId: string) => Promise<ISuccess | BasicError>;
}


export interface IThndr {
  _id: string;
  userId: string;
  createdAt: Date; 
  updatedAt?: Date; 
  fileKeys: string[];
  likeIds: string[];
  text: string;
  reactions: IReactions; 
  commentIds?: string[]; 
  fileUrls?: (thndr: Thndr) => typeof PreSignedInfoOrErrorUnion;  
  owner?: (thndr: Thndr) => Promise<typeof UserOrErrorUnion>;
  statusControl?: StatusController; 
}


export interface IStatus {
  _id: string;
  userId: string;
  createdAt: string; 
  updatedAt?: string; 
  fileKeys: string[];
  likeIds: string[];
  text: string;
  reactions: IReactions; 
  commentIds?: string[]; 
  fileUrls?: (thndr: Thndr) => typeof PreSignedInfoOrErrorUnion;  
  owner?: (thndr: Thndr) => Promise<typeof UserOrErrorUnion>;
  statusControl?: StatusController; 
}


export interface IThndrList {
  thndr: IThndr[]; 
}

export interface IStatusConnection {
  edges: (IThndr)[];
  pageInfo: IPageInfo; 
}

export interface IThndrConnection {
  edges: IThndr[]; 
  pageInfo: IPageInfo; 
}

export interface IStatusCommentInput {
  statusId: string; 
  text?: string; 
  fileKeys?: string[]; 
}

export interface IStatusComment {
  _id: IStatusCommentModel['_id']; 
  userId: IStatusCommentModel['userId']; 
  statusId: IStatusCommentModel['statusId']; 
  text?: IStatusCommentModel['text']; 
  fileKeys?: IStatusCommentModel['fileKeys']; 
  createdAt: IStatusCommentModel['createdAt']; 
}

export interface IStatusCommentConnection {
  edges: IStatusComment[]; 
  pageInfo: IPageInfo; 
}
