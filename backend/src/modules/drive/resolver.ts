
/* eslint-disable type-graphql/wrong-decorator-signature */
import { Context } from '../__shared__/interfaces';
import { Folder, 
         FolderOptionsInput } from './folder.schema';
import { FileAndFolderListOrErrorUnion, FileConnectionOrErrorUnion, 
    FileOrFolderConnectionOrErrorUnion, 
         FolderConnectionOrErrorUnion, 
         FolderOrErrorUnion } from './types.resolver';
import { GenericError } from '../__shared__/schema';
import { SuccessOrErrorUnion } from '../__shared__/types.resolver';
import FolderController from './folderController';
import { Arg, 
         Ctx, 
         Mutation, 
         Query, 
         Resolver, 
         ID, 
         Int, 
         Root } from 'type-graphql';
import MongoDBFileRepo from './fileRepo.mongo';
import MongoDBFolderRepo from './folderRepo.mongo';
import { CloudFrontRepo } from '../__shared__/aws/cloudfront';
import { S3Repo } from '../__shared__/aws/s3';
import { Service } from 'typedi';
import { TFile } from './file.schema';
import DriveController from './controller';
import { DriveOptions } from './schema';


@Service()
@Resolver(() => Folder)
export class DriveResolver {

    private driveControl: DriveController;
    constructor (folderRepo: MongoDBFolderRepo, 
                 fileRepo: MongoDBFileRepo, 
                 s3Repo: S3Repo, 
                 cloudRepo: CloudFrontRepo) {

        this.driveControl = new DriveController(folderRepo,fileRepo)

    }
   
 @Query(() => FileOrFolderConnectionOrErrorUnion)
 async getDriveData(
    @Arg('limit', () => Int , {nullable: false}) limit: number,
    @Arg('options', () => DriveOptions, {nullable: false}) options: DriveOptions,
    @Ctx() context: Context,
    @Arg('cursor', () => String) cursor: string | null,
 ): Promise<typeof FileOrFolderConnectionOrErrorUnion> {
     try {  
        const { user } = context; 
        const { _id } = user; 
        const { parentId, starred, deleted } = options; 
        if (!parentId && !starred && !deleted) {
          const res = await this.driveControl.getRootDriveData(_id,limit,cursor); 
          if (res instanceof Error) throw (res);
          return res; 
        } else if (starred) { 
          const res = await this.driveControl.getStarredDriveData(_id,limit,cursor);
          if (res instanceof Error) throw (res);
          return res; 
        } else if (deleted) {
          const res = await this.driveControl.getDeletedDriveData(_id,limit,cursor); 
          if (res instanceof Error) throw (res);
          return res; 
        } else if (parentId) {
          const res = await this.driveControl.getFolderChildren(_id,parentId,limit,cursor); 
          if (res instanceof Error) throw (res); 
          return res; 
        }
     } catch (error) {
         return error as GenericError; 
     }
 }



 @Query(() =>  FileAndFolderListOrErrorUnion)
 async searchDrive(
  @Arg('pattern', () => String, {nullable: false}) pattern: string, 
  @Ctx() context: Context
 ): Promise<typeof FileAndFolderListOrErrorUnion> {
   try { 
      const { user } = context; 
      const { _id } = user; 
      const res = await this.driveControl.searchDrive(_id,pattern); 
      if (res instanceof Error) throw (res); 
      return res; 
   } catch (error) {
      return error as GenericError;
   }
 }
}