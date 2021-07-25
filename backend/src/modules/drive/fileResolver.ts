import 'reflect-metadata';
import { Arg, Resolver, Ctx, Mutation, Query, ID, Root } from 'type-graphql';
import { Service } from 'typedi';
import { CloudFrontRepo } from '../__shared__/aws/cloudfront';
import { S3Repo } from '../__shared__/aws/s3';
import { BasicError } from '../__shared__/error';
import { Context } from '../__shared__/interfaces';
import { GenericError } from '../__shared__/schema';
import { PreSignedInfoOrErrorUnion, SuccessOrErrorUnion } from '../__shared__/types.resolver';
import { TFile, FileInfo, FileInput } from './file.schema';
import { FileController } from './fileController';
import MongoDBFileRepo from './fileRepo.mongo';
import { FileOrErrorUnion } from './types.resolver';

@Service()
@Resolver(() => TFile)
export class FileResolver {
   private fileControl: FileController; 
   constructor (private readonly mongoFileRepo: MongoDBFileRepo,
                private readonly s3BlobRepo: S3Repo,
               private readonly cloudFront: CloudFrontRepo) {
     this.fileControl = new FileController(mongoFileRepo,s3BlobRepo,cloudFront);
   }

   // TEST: 
   // must induce error to confirm function returns the proper type-graphql shape 
   @Query(() => PreSignedInfoOrErrorUnion)
   async getPreSignedUrls(
     @Arg('files', () => [FileInfo], {nullable: false}) files: FileInfo[],
     @Arg('serverId', () => String) serverId: string,
     @Ctx() context: Context
    ): Promise<typeof PreSignedInfoOrErrorUnion> {
      try {
        const { user } = context; 
        const { _id } = user;
        if (files[0].name === '') return {urls: [], keys: []};
        if (serverId !== null) {
            const preSignedInfo = await this.fileControl.createPreSignedUrls(_id,files,serverId); 
            if (preSignedInfo instanceof Error) throw preSignedInfo; 
            return preSignedInfo;
        } else {
            const preSignedInfo = await this.fileControl.createPreSignedUrls(_id,files); 
            if (preSignedInfo instanceof Error) throw preSignedInfo; 
            return preSignedInfo; 
        }
      } catch (error) {
            console.log('the errror ', error); 
            return error as GenericError; 
      } 
    }
    
    @Mutation(() => FileOrErrorUnion)
    async createFile(
      @Arg('fileInput', () => FileInput) fileInput: FileInput,
      @Ctx() context: Context
    ): Promise<typeof FileOrErrorUnion> {
        try {
            const { user } = context; 
            const input = {
                            ...fileInput,
                            ownerId: user._id
                          };
                        
            const res = await this.fileControl.createFile(user._id,input); 
            if (res instanceof BasicError) throw (res); 
            console.log('he ', res); 
            return {
                cloudService: this.cloudFront,
                ...res
            } as TFile; 
        } catch (error) {
            return error as GenericError;
        }
    }

    @Mutation(() => SuccessOrErrorUnion)
    async moveFile(
        @Arg('fileId', () => ID, {nullable: false}) fileId: string,
        @Arg('atRoot', () => Boolean, {nullable:false}) atRoot: boolean,   
        @Arg('toRoot', () => Boolean, {nullable:false}) toRoot: boolean,
        @Ctx() context: Context,
        @Arg('parentId', () => ID) parentId?: string
    ): Promise<typeof SuccessOrErrorUnion> {
        try {
            const { user } = context; 
            const res = await this.fileControl.moveFile(fileId,parentId,user._id,atRoot,toRoot); 
            if (res instanceof BasicError) throw (res); 
            return {success:true}
        } catch (error) {
            return error as GenericError; 
        }
    }

    @Mutation(() => SuccessOrErrorUnion)
    async addFileToDeleted(
        @Arg('fileId', () => ID, {nullable: false}) fileId: string,
        @Ctx() context: Context
    ): Promise<typeof SuccessOrErrorUnion> {
        try {
            const { user } = context; 
            const { _id } = user; 
            const res = await this.fileControl.setDeletedTrue(fileId,_id); 
            if (res instanceof BasicError) throw (res); 
            return res; 
        } catch (error) {
            return error as GenericError; 
        }
    }

    @Mutation(() => SuccessOrErrorUnion)
    async removeFileFromDeleted(
        @Arg('fileId', () => ID, {nullable: false}) fileId: string,
        @Ctx() context: Context
    ): Promise<typeof SuccessOrErrorUnion> {
        try {
            const { user } = context; 
            const { _id } = user; 
            const res = await this.fileControl.setDeletedFalse(fileId,_id); 
            if (res instanceof BasicError) throw (res); 
            return res; 
        } catch (error) {
            return error as GenericError; 
        }
    }

    @Mutation(() => SuccessOrErrorUnion)
    async starFile(
        @Arg('fileId', () => ID, {nullable:false}) fileId: string, 
        @Ctx() context: Context
    ): Promise<typeof SuccessOrErrorUnion> {
        try {
            const { user } = context; 
            const { _id } = user; 
            const res = await this.fileControl.starFile(fileId,_id); 
            if (res instanceof BasicError) throw (res); 
            return res; 
        } catch (error) {
            return error as GenericError; 
        }
    }

    @Mutation(() => SuccessOrErrorUnion)
    async unstarFile(
        @Arg('fileId', () => ID, {nullable:false}) fileId: string, 
        @Ctx() context: Context
    ): Promise<typeof SuccessOrErrorUnion> {
        try {
            const { user } = context; 
            const { _id } = user; 
            const res = await this.fileControl.unstarFile(fileId,_id); 
            if (res instanceof BasicError) throw (res); 
            return res; 
        } catch (error) {
            return error as GenericError; 
        }
    }

    @Mutation(() => SuccessOrErrorUnion)
    async renameFile(
        @Arg('name', () => String, {nullable:false}) name: string,
        @Arg('fileId', () => ID, {nullable:false}) fileId: string, 
        @Ctx() context: Context
    ): Promise<typeof SuccessOrErrorUnion> {
        try {
            const { user } = context; 
            const { _id } = user; 
            const res = await this.fileControl.renameFile(fileId,_id,name); 
            if (res instanceof BasicError) throw (res);
            return res; 
        } catch (error) {
            return error as GenericError; 
        }
    }

}


