import { Field, 
         ObjectType,
         InputType } from 'type-graphql';
import { PageInfo } from '../__shared__/schema';
import { FileOrFolderUnion } from './types.resolver';



@ObjectType()
export class FileOrFolderConnection {
@Field(() => [FileOrFolderUnion], {nullable: false})
edges: [(typeof FileOrFolderUnion)]; 
@Field(() => PageInfo, {nullable: false})
pageInfo: PageInfo; 
}

@InputType()
export class DriveOptions { 
@Field(() => String, {nullable: false})  
parentId: string; 
@Field(() => Boolean, {nullable: false})
deleted: boolean; 
@Field(() => Boolean, {nullable: false})
itemType: DriveItemType; 
}

@InputType()
export class DriveItemType {
    @Field(() => Boolean, {nullable: false})
    files: boolean; 
    @Field(() => Boolean, {nullable: false})
    folders: boolean; 
}   

@ObjectType()
export class FileAndFolderList {
@Field(() => [FileOrFolderUnion], {nullable: false})
items: [typeof FileOrFolderUnion]; 
}