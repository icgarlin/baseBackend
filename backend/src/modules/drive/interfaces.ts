import { ICloudServiceRepo, IFileRepo, IPageInfo, UpdatedDocument } from '../__shared__/interfaces';
import { Folder } from './folder.schema';
import { FileConnectionOrErrorUnion, FileUrlOrErrorUnion } from './types.resolver';
import { BasicError, ISuccess } from '../__shared__/error';
import { Document } from 'mongoose';
import { TFile } from './file.schema';
import BaseRepo from '../__shared__/baseRepo';

export interface IDriveFileRepo extends BaseRepo {
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
   createPreSignedUrls: (userId: string, info: IFileInfo[], blobRepo: IFileRepo, serverId?: string) => Promise<PreSignedInfo>; 
   createFile: (userId: string, fileInput: IFileInput) => Promise<IFile | BasicError>; 
   removeFileChild: (fileId: string, parentId: string, userId: string) => Promise<ISuccess | BasicError>;
   getFilesByMatchingPattern: (userId: string, pattern: string) => Promise<IFile[] | BasicError>; 
   searchFiles: (userId: string, pattern: string) => Promise<IFile[] | BasicError>; 

}


export interface IDriveFolderRepo {
   getFolder: (folderId: string, userId: string) => Promise<IFolder | null | BasicError>;
   removeFileChild: (fileId: string, parentId: string, userId: string) => Promise<UpdatedDocument | BasicError>; 
   removeFolderChild: (folderId: string, parentId: string, userId: string) => Promise<ISuccess | BasicError>;
   doesFolderExist: (name: string, userId: string) => Promise<boolean | BasicError>;
   createFolder: (userId: string, name: string, personal: boolean, parentId: string) => Promise<IFolder | BasicError>;
   changeParent: (folderId: string, parentId: string, ownerId: string, toRoot: boolean) => Promise<ISuccess | BasicError> 
   moveFolderToRoot: (folderId: string, parentId: string, ownerId: string) => Promise<ISuccess | BasicError> 
   renameFolder: (name: string, folderId: string, ownerId: string) => Promise<ISuccess | BasicError>; 
   deleteFolder: (folderId: string, ownerId: string) => Promise<UpdatedDocument | BasicError>; 
   getFolders: (userId: string, limit: number, cursor: string | null, folderId?: string, folderOptionsInput?: IFolderOptionsInput) => Promise<IFolder[] | BasicError>;
   // getFilesByMatchingPattern: (pattern: string, userId: string, limit:number, cursor: string | null) => Promise<IFile[] | BasicError>;
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
   updatedAt: Date;
   createdAt: Date; 
   fileUrl: (file: TFile) => typeof FileUrlOrErrorUnion; 
   cloudService?: ICloudServiceRepo  
}

export interface IFolder {
   _id: string; 
   name: string; 
   parentId: string; 
   ownerId: string; 
   isPersonal: boolean;
   childrenIds: string[]; 
   deleted: boolean; 
   starred: boolean; 
   createdAt: Date; 
   updatedAt: Date;
   getChildren: (folder: Folder) => Promise<typeof FileConnectionOrErrorUnion>;  
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
  updatedAt: Date;
  createdAt: Date; 
  fileUrl?: (file: TFile) => typeof FileUrlOrErrorUnion;  
}

export interface IFolderModel extends Document {
  _id: string; 
  name: string; 
  parentId: string; 
  ownerId: string; 
  isPersonal: boolean;
  childrenIds: string[]; 
  deleted: boolean; 
  starred: boolean; 
  createdAt: Date; 
  updatedAt: Date;
  getChildren?: (folder: Folder) => Promise<typeof FileConnectionOrErrorUnion>;  
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
  deleted?: boolean;
  parentId?: string; 
  isPersonal: boolean; 
}

export interface IFolderInput {
  parentId?: string; 
  ownerId: string; 
  isPersonal: boolean;
  name: string; 
  starred: boolean; 
  deleted: boolean; 
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


export interface IFileOrFolderConnection {
  edges: (IFile | IFolder)[]; 
  pageInfo: IPageInfo; 
}

export interface IDriveOptions {
  parentId: string | null;
  starred: boolean; 
  deleted: boolean; 
}


export interface IFileOrFolder {
  data: IFile | IFolder; 
}


export interface IFileAndFolderList { 
  items: (IFile | IFolder)[];  
}