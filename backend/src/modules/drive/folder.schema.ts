
import { ObjectType, ID, Field, Root, InputType } from 'type-graphql';
import FolderController from './folderController';
import { GenericError, PageInfo } from '../__shared__/schema';
import { FileConnectionOrErrorUnion } from './types.resolver';
import { TFile } from './file.schema';


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
   @Field(() => [String], {nullable: false})
   childrenIds?: string[]; 
   @Field(() => ID)
   parentId?: string; 
   @Field(() => ID, {nullable: false})
   ownerId: string;
   @Field(() => Date, {nullable: false})
   updatedAt: Date; 
   @Field(() => FileConnectionOrErrorUnion, {nullable: false})
   async getChildren?(
       @Root() folder: Folder 
   ): Promise<typeof FileConnectionOrErrorUnion> {
       try {
        const { childrenIds, ownerId } = folder; 
        if (childrenIds !== undefined && childrenIds.length > 0) {
            const res = await this.folderControl.getFolderFiles(ownerId,folder._id,4,''); 
            const { cloudService } = this.folderControl; 
            if ('code' in res) throw (res); 
            res.edges.forEach((file) => {
                (file as TFile).cloudService = cloudService; 
            })
            return res; 
        } else if (childrenIds.length === 0) {
           return { edges: [],
                    pageInfo: {
                        hasNextPage: false,
                        endCursor: ''
                    }}
        }
       } catch (error) {
            error as GenericError; 
       }
   }
   @Field(() => Boolean, {nullable: false})
   deleted: boolean;
   @Field(() => Boolean, {nullable: false})
   starred: boolean;  
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




