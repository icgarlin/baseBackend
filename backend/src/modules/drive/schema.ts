import { Field, 
         ObjectType,
         InputType } from 'type-graphql';
import { PageInfo } from '../__shared__/schema';
import { FileOrFolderUnion } from './types.resolver';

@ObjectType()
export class FileOrFolderConnection {
 @Field(() => [FileOrFolderUnion], {nullable: false})
 edges: (typeof FileOrFolderUnion)[]; 
 @Field(() => PageInfo, {nullable: false})
 pageInfo: PageInfo; 
}

@InputType()
export class DriveOptions { 
 @Field(() => String)  
 parentId: string; 
 @Field(() => Boolean, {nullable: false})
 starred: boolean; 
 @Field(() => Boolean, {nullable: false})
 deleted: boolean; 
}

@ObjectType()
export class FileAndFolderList {
  @Field(() => [FileOrFolderUnion], {nullable: false})
  items: (typeof FileOrFolderUnion)[]; 
}