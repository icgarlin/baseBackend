import 'reflect-metadata';
import { ObjectType, 
         Field, 
         ID, 
         Root, 
         InputType, 
         Int } from 'type-graphql';
import { User } from '../user/schema';
import { BasicError } from '../__shared__/error';
import { GenericError, 
         PageInfo, 
         Reactions } from '../__shared__/schema';
import {  PreSignedInfoOrErrorUnion, 
          UserOrErrorUnion } from '../__shared__/types.resolver';
import StatusController from './controller';
import { StatusCommentCountOrErrorUnion } from './types.resolver';


@ObjectType()
export class Thndr {

  constructor(public statusControl?: StatusController) {}
  @Field(() => ID, {nullable: false})
  _id: string;
  @Field(() => ID, {nullable: false})
  userId: string; 
  @Field(() => Date, {nullable: false})
  createdAt: Date;
  @Field(() => Date, {nullable: false})
  updatedAt?: Date; 
  @Field(() => [String], {nullable: false})
  commentIds?: string[]; 
  @Field(() => [String], {nullable: false})
  fileKeys: string[];
  @Field(() => Reactions, {nullable: false})
  reactions: Reactions; /* Temporarily will be left as nullable */ 
  @Field(() => String, {nullable: false})
  text: string;
  @Field(() => StatusCommentCountOrErrorUnion, {nullable: false})
  async commentCount(
    @Root() status: Thndr
  ): Promise<typeof StatusCommentCountOrErrorUnion> {
    try {
      const { _id } = status; 
      const comments = await this.statusControl.getAllComments(_id); 
      if (comments instanceof Error) throw (comments); 
      return {count: comments.length}; 
    } catch (error) {
      return error as GenericError; 
    }
  }
  @Field(() => PreSignedInfoOrErrorUnion, {nullable: false})
  fileUrls?(
    @Root() thndr: Thndr
  ): typeof PreSignedInfoOrErrorUnion {
    try {
      const { fileKeys } = thndr;
      if (!fileKeys || fileKeys === undefined || fileKeys.length === 0) return {urls: [], keys: []};
      if (this.statusControl !== undefined) {
        const { cloudRepo } = this.statusControl;  
        const res = cloudRepo.getUrls(fileKeys); 
        if (res instanceof BasicError) throw res; 
        return {urls: res, keys: fileKeys};  
      } else {
          throw (new BasicError()); 
      }
    } catch (error) {
        return error as GenericError;
    }    
  }

  @Field(() => UserOrErrorUnion, {nullable: false})
  async owner?(
    @Root() thndr: Thndr
  ): Promise<typeof UserOrErrorUnion> {
    try {
       const { userId } = thndr; 
       // create new interface for OwnerData
       const res = await this.statusControl.queryOwnerData(userId); 
       if (this.statusControl !== undefined) {
        const { cloudRepo } = this.statusControl; 
        if (res instanceof BasicError) throw (res); 
        return { 
            ...res, 
            cloudService: cloudRepo
        }; 
       } else { 
           throw (new BasicError()); 
       }
    } catch (error) {
        return error as GenericError; 
    }
  }
}

@ObjectType()
export class StatusCommentCount { 
  @Field(() => Int, {nullable: false})
  count: number; 
}

@ObjectType() 
export class ThndrConnection {
  @Field(() => [Thndr], { nullable: false})
  edges: Thndr[]; 
  @Field(() => PageInfo, {nullable: false})
  pageInfo: PageInfo; 
}

@ObjectType()
export class StatusConnection {
  @Field(() => [Thndr], { nullable: false})
  edges: Thndr[]; 
  @Field(() => PageInfo)
  pageInfo: PageInfo; 
}


@ObjectType()
export class RThndr {
  @Field(() => ID, {nullable: false})
  _id: string;
  @Field(() => ID, {nullable: false})
  userId: string; 
  @Field(() => String, {nullable: false})
  createdAt: string;
  @Field(() => String, {nullable: false})
  updatedAt?: string; 
  @Field(() => [String])
  commentIds?: string[]; 
  @Field(() => [String], {nullable: false})
  fileKeys: string[];
  @Field(() => Reactions, {nullable: false})
  reactions: Reactions;
  @Field(() => String, {nullable: false})
  text: string;
}


@ObjectType()
export class StatusComment {
  constructor(public statusControl?: StatusController) {}
  @Field(() => String, {nullable: false})
  _id: string;
  @Field(() => String, {nullable: false})
  userId: string;
  @Field(() => UserOrErrorUnion)
  async user?(
    @Root() comment: StatusComment
  ): Promise<typeof UserOrErrorUnion> {
    try {
      const { userId } = comment; 
      const owner = await this.statusControl.queryOwnerData(userId); 
      if (owner instanceof Error) throw (owner);
      const { cloudRepo } = this.statusControl; 
      const user: User = {
        cloudService: cloudRepo,
        ...owner
      }
      return user; 
    } catch (error) {
        return error as GenericError; 
    }
  }

  @Field(() => String, {nullable: false})
  text?: string; 
  @Field(() => [String], {nullable: false})
  fileKeys?: string[]; 
  @Field(() => Date, {nullable: false})
  createdAt: Date; 
}


@ObjectType()
export class StatusCommentConnection {
  @Field(() => [StatusComment], {nullable: false})
  edges: StatusComment[];
  @Field(() => PageInfo, {nullable: false})
  pageInfo: PageInfo; 
}


@InputType()
export class StatusCommentInput { 
  @Field(() => String, {nullable: false})
  statusId: string;
  @Field(() => [String])
  fileKeys: string[]; 
  @Field(() => String)
  text: string;
}