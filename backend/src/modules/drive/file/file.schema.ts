import { GenericError, PageInfo } from '../../__shared__/schema';
import { Field, 
         InputType, 
         ObjectType, 
         Int, 
         ID, 
         Root } from 'type-graphql';
import { FileUrlOrErrorUnion } from '../../__shared__/types.resolver';
import { ICloudServiceRepo } from '../../__shared__/interfaces';
import FileHelper from '../../__shared__/file.helper';
import { BasicError, ErrorCode } from '../../__shared__/error';




@ObjectType()
export class TFile {
    constructor(public cloudService?: ICloudServiceRepo, public fileHelp?: FileHelper) {}
    @Field(() => ID, {nullable: false})
    _id: string; 
    @Field(() => String,{nullable: false})
    name: string;
    @Field(() => ID)
    parentId: string;
    @Field(() => String, {nullable: false})
    key: string; 
    @Field(() => String, {nullable: false})
    type: string;
    @Field(() => ID, {nullable: false})
    ownerId: string;
    @Field(() => Int, {nullable: false})
    size: number;
    @Field(() => Boolean, {nullable: false})
    isPersonal: boolean;
    @Field(() => Boolean, {nullable: false})
    deleted: boolean;
    @Field({nullable: false})
    updatedAt: Date; 
    @Field({nullable: false})
    createdAt: Date;
    @Field(() => FileUrlOrErrorUnion, {nullable: false})
    fileUrl(
    @Root() file: TFile
    ): typeof FileUrlOrErrorUnion {
        try {
            const { key, name, type } = file;
            if (this.fileHelp !== undefined) {
              const createdKey = `${key}-${name}`; 
              console.log('the created Key ', createdKey); 
              const url = this.cloudService.getUrl(createdKey); 
              return {url}
            } else throw (new BasicError(ErrorCode.InternalServerError,`Could not get url`))
        
        } catch (error) {
            if ('message' in error) {
              return error as GenericError; 
            } 
        }
    } 
}

@ObjectType()
export class FileConnection {
  @Field(() => [TFile])
  edges: TFile[]; 
  @Field(() => PageInfo)
  pageInfo: PageInfo; 
}

@InputType()
export class FileInfo {
  @Field(() => String, {nullable: false})
  name: string;

  @Field(() => String, {nullable: false})
  type: string;
}

@ObjectType()
export class PreSignedInfo {
  @Field(() => [String])
  urls: string[];

  @Field(() => [String])
  keys: string[];
}


@InputType()
export class FileInput {
  @Field(() => String, {nullable: false})
  ownerId: string; 
  @Field(() => Boolean, {nullable: false})
  isPersonal: boolean;
  @Field(() => String, {nullable: false})
  key: string; 
  @Field(() => String, {nullable: false})
  parentId: string;
  @Field(() => String, {nullable: false})
  name: string;
  @Field(() => Int, {nullable: false})
  size: number; 
  @Field(() => String, {nullable: false})
  type: string;
}


@ObjectType()
export class FileList {
   @Field(() => [TFile], {nullable: false})
   files: TFile[];
}


