/* eslint-disable type-graphql/wrong-decorator-signature */
import { Arg, 
         Ctx, 
         Mutation, 
         Query, 
         Resolver, 
         ID, 
         Int, 
         Authorized} from 'type-graphql';
import { Context } from '../../__shared__/interfaces';
import { Folder, 
    FolderInput, 
         FolderOptionsInput } from './folder.schema';
import { FileConnectionOrErrorUnion, 
         FolderConnectionOrErrorUnion, 
         FolderOrErrorUnion } from '../types.resolver';
import { GenericError } from '../../__shared__/schema';
import { SuccessOrErrorUnion } from '../../__shared__/types.resolver';
import FolderController from './folderController';
import MongoDBFolderRepo from './folderRepo.mongo';
import { Service } from 'typedi';



@Service()
@Resolver(() => Folder)
export class FolderResolver {

    private folderControl: FolderController;
    constructor (folderRepo: MongoDBFolderRepo) {
        this.folderControl = new FolderController(folderRepo); 
    }
   
    @Authorized()
    @Mutation(() => FolderOrErrorUnion, {nullable: false})
    async createFolder(
        @Arg('folderInput', () => FolderInput, {nullable: false}) folderInput: FolderInput,
        @Ctx() context: Context,
    ): Promise<typeof FolderOrErrorUnion> {
        try {
            const { user } = context; 
            const { parentId, isPersonal, fileId, type, name } = folderInput; 
            const input = {
                            ownerId: user._id, 
                            name, 
                            isPersonal, 
                            type, 
                            parentId: parentId !== '' ? parentId: undefined,
                            fileId: fileId !== '' ? fileId : undefined,
                            starred: false, 
                            deleted: false, 
                          }
            const res = await this.folderControl.createFolder(
                                                              input
                                                             ); 
            if ('code' in res) throw (res);
            console.log('our res ', res); 
            return {
                ...res
            } as Folder
        } catch (error) {
            return error as GenericError; 
        }
    }

    @Mutation(() => SuccessOrErrorUnion, {nullable: false})
    async addFolderToDeleted(
        @Arg('folderId', () => ID, {nullable: false}) folderId: string,
        @Ctx() context: Context
    ): Promise<typeof SuccessOrErrorUnion> {
        try {
            const { user } = context; 
            const { _id } = user; 
            const res = await this.folderControl.setDeletedTrue(folderId,_id); 
            if ('code' in res) throw (res); 
            return res; 
        } catch (error) {
            return error as GenericError; 
        }
    }

    @Mutation(() => SuccessOrErrorUnion, {nullable: false})
    async removeFolderFromDeleted(
        @Arg('folderId', () => ID, {nullable: false}) folderId: string,
        @Ctx() context: Context
    ): Promise<typeof SuccessOrErrorUnion> {
        try {
            const { user } = context; 
            const { _id } = user; 
            const res = await this.folderControl.setDeletedFalse(folderId,_id); 
            if ('code' in res) throw (res); 
            return res; 
        } catch (error) {
            return error as GenericError; 
        }
    }

    @Mutation(() => SuccessOrErrorUnion, {nullable: false})
    async starFolder(
        @Arg('folderId', () => ID, {nullable:false}) folderId: string, 
        @Ctx() context: Context
    ): Promise<typeof SuccessOrErrorUnion> {
        try {
            const { user } = context; 
            const { _id } = user; 
            const res = await this.folderControl.starFolder(folderId,_id); 
            if ('code' in res) throw (res); 
            return res; 
        } catch (error) {
            return error as GenericError; 
        }
    }

    @Mutation(() => SuccessOrErrorUnion, {nullable: false})
    async unstarFolder(
        @Arg('folderId', () => ID, {nullable:false}) folderId: string, 
        @Ctx() context: Context
    ): Promise<typeof SuccessOrErrorUnion> {
        try {
            const { user } = context; 
            const { _id } = user; 
            const res = await this.folderControl.unstarFolder(folderId,_id); 
            if ('code' in res) throw (res); 
            return res; 
        } catch (error) {
            return error as GenericError; 
        }
    } 

    @Mutation(() => SuccessOrErrorUnion, {nullable: false})
    async moveFolder(
        @Arg('folderId', () => ID, {nullable: false}) folderId: string,
        @Arg('atRoot', () => Boolean, {nullable:false}) atRoot: boolean,   
        @Arg('toRoot', () => Boolean, {nullable:false}) toRoot: boolean,
        @Ctx() context: Context,
        @Arg('parentId', () => ID, {nullable: true}) parentId?: string
    ): Promise<typeof SuccessOrErrorUnion> {
        try {
            const { user } = context; 
            const res = await this.folderControl.moveFolder(folderId,parentId,user._id,atRoot,toRoot); 
            if ('code' in res) throw (res); 
            return res; 
        } catch (error) {
            return error as GenericError; 
        }
    }

    @Mutation(() => SuccessOrErrorUnion, {nullable: false})
    async renameFolder(
        @Arg('name', () => String, {nullable: false}) name: string,
        @Arg('folderId', () => ID, {nullable: false}) folderId: string,
        @Ctx() context: Context
    ): Promise<typeof SuccessOrErrorUnion> {
        try {
            const { user } = context; 
            const { _id } = user; 
            const res = await this.folderControl.renameFolder(name,folderId,_id); 
            if ('code' in res) throw (res); 
            return res; 
        } catch (error) {
            return error as GenericError; 
        }
    }

    @Query(() =>  FolderConnectionOrErrorUnion, {nullable: false})
    async rootFolders(
        @Arg('sortByCreated', () => Boolean, {nullable: false}) sortByCreated: boolean,
        @Arg('limit', () => Int, {nullable: false}) limit: number, 
        @Ctx() context: Context,
        @Arg('cursor', () => String, {nullable: true}) cursor?: string
    ): Promise<typeof  FolderConnectionOrErrorUnion> {
        try {
            const { user } = context; 
            const res = await this.folderControl.getRootFolders(user._id,limit,cursor,sortByCreated); 
            if ('code' in res) throw (res);
            return res; 
        } catch (error) {
            return error as GenericError; 
        }
    }

    @Query(() =>  FileConnectionOrErrorUnion, {nullable: false})
    async queryFilePatternMatch(
        @Arg('pattern', () => String, {nullable: false}) pattern: string,
        @Ctx() context: Context
    ): Promise<typeof  FileConnectionOrErrorUnion> {
        try {
            const { user } = context; 
            const res = await this.folderControl.getFilesByMatchingPattern(user._id, pattern);
            if ('code' in res) throw (res);
            const { cloudService } = this.folderControl; 
            res.edges.map((file) => {
              file.cloudService = cloudService; 
            })
            return res; 
        } catch (error) {
            return error as GenericError; 
        }
    }

    @Query(() => FolderConnectionOrErrorUnion, {nullable: false})
    async queryFolderChildren(
        @Arg('limit', () => Int, {nullable: false}) limit: number, 
        @Ctx() context: Context,
        @Arg('cursor', () => String, {nullable: true}) cursor: string | null,
        @Arg('folderId', () => ID, {nullable: false}) folderId: string,
        @Arg('folderOptionsInput', () => FolderOptionsInput, {nullable: true}) folderOptionsInput?: FolderOptionsInput
    ): Promise<typeof FolderConnectionOrErrorUnion> {
        try {
            const { user } = context; 
            const { _id } = user; 
            const res = await this.folderControl.getFolderItemsOfPage(_id,limit,cursor,folderId,folderOptionsInput); 
            if ('code' in res) throw (res);
            return res; 
        } catch (error) {
            return error as GenericError; 
        }
    }




}