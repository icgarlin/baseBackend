import { Document } from 'mongoose';
import { ICloudServiceRepo, 
         IBlobRepo, 
         IPageInfo, 
         UpdatedDocument } from '../__shared__/interfaces';
import { FileUrlOrErrorUnion } from './types.resolver';
import { BasicError, 
         ISuccess } from '../__shared__/error';
import { TFile } from './file/file.schema';
import { IFolderModel } from './folder/folder.model';
import BaseRepo from '../__shared__/baseRepo';

export interface IFileRepo extends BaseRepo { 
   fromCursorHash: (cursor: string) => string;
   toCursorHash: (cursor: string) => string; 
   findFileByName: (userId: string, name: string) => Promise<IFile | BasicError>; 
   atRoot: (fileId: string, ownerId: string) => Promise<boolean | BasicError>; 
   moveFileToRoot: (fileId: string, parentId: string, ownerId: string) => Promise<ISuccess | BasicError>; 
   changeFileParent: (fileId: string, parentId: string, ownerId: string) => Promise<UpdatedDocument | BasicError>; 
   getFilesById: (userId: string, fileIds: string[]) => Promise<IFile[] | BasicError>; 
   getFilesByFolder: (userId: string, parentId: string, cursor: string | null, limit: number) => Promise<IFile[] | BasicError>; 
   getRootFiles: (userId: string, limit: number, cursor: string | null) => Promise<IFile[] | BasicError>; 
   getRecentlyDeleted: (userId: string, limit: number, cursor: string | null) => Promise<IFile[] | BasicError>; 
   getStarredFiles: (userId: string, limit: number, cursor: string | null) => Promise<IFile[] | BasicError>; 
   setDeletedTrue: (fileId: string, ownerId: string) => Promise<ISuccess | BasicError>; 
   setDeletedFalse: (fileId: string, ownerId: string) => Promise<ISuccess | BasicError>; 
   starFile: (fileId: string, ownerId: string) => Promise<ISuccess | BasicError>; 
   unstarFile: (fileId: string, ownerId: string) => Promise<ISuccess | BasicError>; 
   renameFile: (fileId: string, ownerId: string, name: string) => Promise<ISuccess | BasicError>; 
   createPreSignedUrls: (userId: string, info: IFileInfo[], blobRepo: IBlobRepo, serverId?: string) => Promise<PreSignedInfo>; 
   createFile: (fileInput: IFileInput) => Promise<IFile | BasicError>; 
   removeFileChild: (fileId: string, parentId: string, userId: string) => Promise<ISuccess | BasicError>;
   getFilesByMatchingPattern: (userId: string, pattern: string) => Promise<IFile[] | BasicError>; 
   searchFiles: (userId: string, pattern: string) => Promise<IFile[] | BasicError>; 
}

export interface IFolderRepo {
   getFolder: (folderId: string, userId: string) => Promise<IFolder | null | BasicError>;
   removeFileChild: (fileId: string, parentId: string, userId: string) => Promise<UpdatedDocument | BasicError>; 
   removeFolderChild: (folderId: string, parentId: string, userId: string) => Promise<ISuccess | BasicError>;
   doesFolderExist: (name: string, userId: string) => Promise<boolean | BasicError>;
   createFolderAtRoot: (input: IFolderInput) => Promise<IFolder | BasicError>; 
   createFolder: (input: IFolderInput) => Promise<IFolder | BasicError>;
   changeParent: (folderId: string, parentId: string, ownerId: string, toRoot: boolean) => Promise<ISuccess | BasicError> 
   moveFolderToRoot: (folderId: string, parentId: string, ownerId: string) => Promise<ISuccess | BasicError> 
   renameFolder: (name: string, folderId: string, ownerId: string) => Promise<ISuccess | BasicError>; 
   deleteFolder: (folderId: string, ownerId: string) => Promise<UpdatedDocument | BasicError>; 
   getFolders: (userId: string, limit: number, cursor: string | null, folderId?: string, folderOptionsInput?: IFolderOptionsInput) => Promise<IFolder[] | BasicError>;
   getRootFoldersByUpdate: (userId: string, limit: number, cursor: string) => Promise<IFolder[] | BasicError>; 
   getFoldersByParentId: (userId: string, limit: number, cursor: string | null, folderId: string) => Promise<IFolder[] | BasicError>; 
   getRootFoldersByCreated: (userId: string, limit: number, cursor: string) => Promise<IFolder[] | BasicError>;
   getRecentlyDeletedFolders: (userId: string, limit: number, cursor: string) => Promise<IFolder[] | BasicError>;
   getStarredFolders: (userId: string, limit: number, cursor: string) => Promise<IFolder[] | BasicError>; 
   setDeletedTrue: (folderId: string, ownerId: string) => Promise<ISuccess | BasicError>;
   setDeletedFalse: (folderId: string, ownerId: string) => Promise<ISuccess | BasicError>;
   starFolder: (folderId: string, ownerId: string) => Promise<ISuccess | BasicError>;
   unstarFolder: (folderId: string, ownerId: string) => Promise<ISuccess | BasicError>;
   searchFolders: (userId: string, pattern: string) => Promise<IFolder[] | BasicError>; 
}

export interface IFile {
   _id: IFileModel['_id']; 
   name: IFileModel['name'];
   ownerId: IFileModel['ownerId'];
   parentId: IFileModel['parentId'];  
   key: IFileModel['key']; 
   size: IFileModel['size'];
   type: IFileModel['key']; 
   isPersonal: IFileModel['isPersonal']; 
   deleted: IFileModel['deleted'];
   starred: IFileModel['starred'];
   position: IFileModel['position']; 
   updatedAt: IFileModel['updatedAt'];
   createdAt: IFileModel['createdAt']; 
   fileUrl: (file: TFile) => typeof FileUrlOrErrorUnion; 
   cloudService?: ICloudServiceRepo  
}

export interface IFolder {
   _id: IFolderModel['_id']; 
   name: IFolderModel['name']; 
   parentId: IFolderModel['parentId']; 
   type: IFolderModel['type']; 
   ownerId: IFolderModel['ownerId']; 
   isPersonal: IFolderModel['isPersonal'];
   deleted: IFolderModel['deleted']; 
   starred: IFolderModel['starred']; 
   position: IFolderModel['position']; 
   createdAt: IFolderModel['createdAt']; 
   updatedAt: IFolderModel['updatedAt'];
}

export interface IFileModel extends Document { 
    _id: string; 
    name: string;
    ownerId: string;
    parentId: string;  
    key: string; 
    size: number;
    type: string; 
    isPersonal: boolean; 
    deleted: boolean;
    starred: boolean;
    position: number; 
    updatedAt: Date;
    createdAt: Date; 
    fileUrl?: (file: TFile) => typeof FileUrlOrErrorUnion;  
}

export interface IFileConnection {
   edges: IFile[]; 
   pageInfo: IPageInfo; 
}

export interface IFolderConnection {
   edges: IFolder[]; 
   pageInfo: IPageInfo; 
}

export interface IFileUrl {
   url: string; 
}

export interface IFileInfo {
    name: string; 
    type: string; 
}

export interface IFileInput { 
   name: string; 
   ownerId: string; 
   key: string; 
   size: number; 
   type: string; 
   deleted: boolean;
   parentId: string | null; 
   isPersonal: boolean; 
}

export interface IFolderInput {
   parentId: string | null; 
   ownerId: string; 
   isPersonal: boolean;
   name: string; 
   starred: boolean; 
   deleted: boolean;
   fileId?: string; 
}

export interface PreSignedInfo {
    urls: string[]; 
    keys: string[]; 
}

export interface IFolderOptionsInput {
   deleted?: boolean; 
   starred?: boolean;
   recents?: boolean; 
}



export interface IFileAndFolderList { 
   items: (IFile | IFolder)[];  
 }


export interface IFileOrFolderConnection {
   edges: (IFile | IFolder)[]; 
   pageInfo: IPageInfo; 
 }
 