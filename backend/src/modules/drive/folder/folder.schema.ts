
import { ObjectType, 
         ID, 
         Field, 
         Root, 
         InputType } from 'type-graphql';
import FolderController from './folderController';
import { GenericError,
         PageInfo } from '../../__shared__/schema';
import { FolderType } from './folder.model';


@InputType()
export class FolderOptionsInput {
    @Field(() => Boolean)
    recents: boolean;
    @Field(() => Boolean)
    starred: boolean;
    @Field(() => Boolean)
    deleted: boolean;
}   

@InputType()
export class FolderSortOptionsInput {
   @Field(() => Boolean)
   sortByUpdated?: boolean; 
   @Field(() => Boolean)
   sortByCreated?: boolean; 
}   


@ObjectType()
export class Folder {
   constructor(public folderControl?: FolderController) {}
   @Field(() => ID, {nullable: false})
   _id: string; 
   @Field(() => Date, {nullable: false})
   createdAt: Date; 
   @Field(() => String, {nullable: false})
   name: string;  
   @Field(() => FolderType, {nullable: false})
   type: FolderType; 
   @Field(() => ID) 
   parentId: string; 
   @Field(() => ID, {nullable: false})
   ownerId: string;
   @Field(() => Date, {nullable: false})
   updatedAt: Date; 
   @Field(() => Boolean, {nullable: false})
   deleted: boolean;
   @Field(() => Boolean, {nullable: false})
   starred: boolean; 
   @Field(() => Boolean, {nullable: false})
   isPersonal: boolean; 
   @Field(() => String, {nullable: false})
   fileOriginId?: string; 
}

@ObjectType()
export class FolderConnection {
    @Field(() => [Folder])
    edges: Folder[]; 
    @Field(() => PageInfo)
    pageInfo: PageInfo; 
}   

@ObjectType()
export class FolderList {
   @Field(() => [Folder])
   folders: Folder[]; 
}




