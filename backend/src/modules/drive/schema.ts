import { Field, 
    ObjectType,
    InputType, 
    createUnionType} from 'type-graphql';
import { PageInfo } from '../__shared__/schema';
import { TFile } from './file/file.schema';
import { Folder } from './folder/folder.schema';
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
@Field(() => String)  
parentId: string; 
@Field(() => Boolean, {nullable: false})
deleted: boolean; 
}

@ObjectType()
export class FileAndFolderList {
@Field(() => [FileOrFolderUnion], {nullable: false})
items: [typeof FileOrFolderUnion]; 
}