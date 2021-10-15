
import { Arg, 
         Ctx,
         Query, 
         Resolver, 
         Int, 
         Authorized} from 'type-graphql';
import { Context } from '../__shared__/interfaces';
import { Folder } from './folder/folder.schema';
import { FileOrFolderConnectionOrErrorUnion } from './types.resolver';
import { ConnectionOptions, GenericError } from '../__shared__/schema';
import MongoDBFileRepo from './file/fileRepo.mongo';
import MongoDBFolderRepo from './folder/folderRepo.mongo';
import { CloudFrontRepo } from '../__shared__/aws/cloudfront';
import { S3Repo } from '../__shared__/aws/s3';
import { Service } from 'typedi';
import DriveController from './controller';
import { DriveOptions } from './schema';
import { IDataOptions } from './interfaces';


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

 @Authorized()
 @Query(() => FileOrFolderConnectionOrErrorUnion)
 async getDriveData(
    @Arg('connectionOptions', () => ConnectionOptions, {nullable: false}) options: ConnectionOptions, 
    @Arg('driveOptions', () => DriveOptions, {nullable: false}) driveOptions: DriveOptions,
    @Ctx() context: Context,
 ): Promise<typeof FileOrFolderConnectionOrErrorUnion> {
     try {  
        const { user } = context; 

        const { _id } = user; 

        const dataOptions: IDataOptions = { 
            itemOptions: driveOptions,
            options: {...options, userId: _id }
        }; 
        
        const res = await this.driveControl.getDriveData(dataOptions); 
        if ('code' in res) throw (res); 
        return res; 
     } catch (error) {
         return error as GenericError; 
     }
 }


}



