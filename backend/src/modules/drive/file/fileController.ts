import BaseRepo from '../../__shared__/baseRepo';
import { BasicError, 
         ISuccess } from '../../__shared__/error';
import { ICloudServiceRepo, 
         IBlobRepo } from '../../__shared__/interfaces';
import { IFileInfo, 
         IFileRepo, 
         IFile, 
         IFileInput, 
         PreSignedInfo } from '../interfaces';

export class FileController extends BaseRepo {
    private blobRepo: IBlobRepo;
    cloudService: ICloudServiceRepo; 
    fileRepo: IFileRepo;  
    constructor (repo: IFileRepo, blob: IBlobRepo, cloudRepo: ICloudServiceRepo) {
        super();
        // database management system 
        this.fileRepo = repo;
        // AWS S3
        this.blobRepo = blob; 
        // cloud service 
        this.cloudService = cloudRepo; 
    }

    createPreSignedUrls = async (userId: string, info: IFileInfo[], serverId?: string): Promise<PreSignedInfo | BasicError> => {
        try {
            const res = await this.fileRepo.createPreSignedUrls(userId,info,this.blobRepo,serverId); 
            if (res instanceof BasicError) throw (res); 
            return res ; 
        } catch (error) {
            return error as BasicError; 
        }
    }
    
    createFile = async (fileInput: IFileInput): Promise<IFile | BasicError> => {
        try {
            const res = await this.fileRepo.createFile(fileInput); 
            if (res instanceof BasicError) throw (res); 
            return res ; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    moveFile = async (fileId: string, parentId: string, ownerId: string, atRoot: boolean, toRoot: boolean): Promise<ISuccess | BasicError> => {
        try {
            if (atRoot) {
                return await this.moveRootFile(fileId,parentId,ownerId); 
            } 
            // else {
            //     return await this.moveNonRootFile(fileId,parentId,ownerId,toRoot); 
            // }
        } catch (error) {
            return error as BasicError; 
        }
    }

    moveRootFile = async (fileId: string, parentId: string, ownerId: string): Promise<ISuccess | BasicError> => {
        try {
            const res = await this.fileRepo.changeFileParent(fileId,parentId,ownerId); 
            if (res instanceof BasicError) throw (res); 
            if (res.nModified === 1) return {success:true};
        } catch (error) {
            return error as BasicError; 
        }
    }

    moveToRoot = async (fileId: string, parentId: string, ownerId: string): Promise<ISuccess | BasicError> => {
        try {
            const toRootRes = await this.fileRepo.moveFileToRoot(fileId,parentId,ownerId); 
            if (toRootRes instanceof BasicError) throw (toRootRes);
            return toRootRes; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    changeParent = async (fileId: string, parentId: string, ownerId: string): Promise<ISuccess | BasicError> => {
        try {
            const changeRes = await this.fileRepo.changeFileParent(fileId,parentId,ownerId);
            if (changeRes instanceof BasicError) throw (changeRes);
            if (changeRes.nModified === 1) return {success:true};
        } catch (error) {
            return error as BasicError;
        }
    }

    setDeletedTrue = async (fileId: string, ownerId: string): Promise<ISuccess | BasicError> => {
        try {
            const res = await this.fileRepo.setDeletedTrue(fileId,ownerId); 
            if (res instanceof BasicError) throw (res); 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    setDeletedFalse = async (fileId: string, ownerId: string): Promise<ISuccess | BasicError> => {
        try {
            const res = await this.fileRepo.setDeletedFalse(fileId,ownerId); 
            if (res instanceof BasicError) throw (res); 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    starFile = async (fileId: string, ownerId: string): Promise<ISuccess | BasicError> => {
        try {
            const res = await this.fileRepo.starFile(fileId,ownerId); 
            if (res instanceof BasicError) throw (res); 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    unstarFile = async (fileId: string, ownerId: string): Promise<ISuccess | BasicError> => {
        try {
            const res = await this.fileRepo.unstarFile(fileId,ownerId); 
            if (res instanceof BasicError) throw (res); 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    renameFile = async (fileId: string, ownerId: string, name: string): Promise<ISuccess | BasicError> => {
        try {
            const res = await this.fileRepo.renameFile(fileId,ownerId,name); 
            if (res instanceof BasicError) throw (res); 
            return res;  
        } catch (error) {
            return error as BasicError; 
        }
    }


    getFile = async (ownerId: string, fileId: string): Promise<IFile | BasicError> => {
        try {
            const res = await this.fileRepo.getFile(ownerId,fileId); 
            if ('code' in res) throw (res); 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }
}


