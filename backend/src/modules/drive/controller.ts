import { BasicError,
         ErrorCode } from '../__shared__/error';
import { IConnectionOptions } from '../__shared__/interfaces';
import { IFileRepo, 
         IFolderRepo, 
         IFileAndFolderList, 
         IFileOrFolderConnection, 
         IFolder,
         IFile,
         IDataOptions,
         IDriveItemType} from './interfaces';






class DriveController { 

  private fileRepo: IFileRepo; 
  private folderRepo: IFolderRepo; 

  constructor (folderRepo: IFolderRepo, fileRepo: IFileRepo) {
    this.folderRepo = folderRepo; 
    this.fileRepo = fileRepo; 
  }

  getDriveData = async (dataOptions: IDataOptions): Promise<IFileOrFolderConnection | BasicError> => {
    try { 
      const { itemOptions, options } = dataOptions; 
      const { userId, limit, cursor } = options; 
      const { itemType, parentId, deleted } = itemOptions; 
      if (parentId === '' && !deleted) {
        const res = await this.getRootDriveData(options,itemType);
        if ('code' in res) throw (res); 
        return res;  
      } else  if (deleted) {
        const res = await this.getDeletedDriveData(userId,limit,cursor); 
        if ('code' in res) throw (res); 
        return res; 
      } else { 
        const res = await this.getFolderChildren(userId,parentId,limit,cursor); 
        if ('code' in res) throw (res); 
        return res; 
      }
    } catch (error) {
        return error as BasicError; 
    }
  }

  getFolderChildren = async (userId: string, parentId: string, limit: number, cursor: string | null): Promise<IFileOrFolderConnection | BasicError>  => {
    try { 
      const fileChildren = await this.fileRepo.getFilesByFolder(userId,parentId,cursor,limit); 
      if (fileChildren instanceof Error) throw (fileChildren); 
      const folderChildren = await this.folderRepo.getFoldersByParentId(userId,limit,cursor,parentId); 
      if (folderChildren instanceof Error) throw (folderChildren); 
      const res = [...fileChildren, ...folderChildren] as [(IFile | IFolder)];
      const fileOrFolder = res.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const hasNextPage = fileOrFolder.length > (limit * 2);
      const edges = hasNextPage ? fileOrFolder.slice(0, -1) as [IFile | IFolder] : fileOrFolder; 
      return  {
         edges,
         pageInfo: {
           hasNextPage, 
           endCursor: this.fileRepo.toCursorHash(
            edges[edges.length-1]?.createdAt.toString(),
          ), 
         }
      }
    } catch (error) {
        return error as BasicError; 
    }
  }

  getRootDriveData = async (options: IConnectionOptions,itemType: IDriveItemType): Promise<IFileOrFolderConnection | BasicError> => {
    try { 

      const { userId, limit, cursor } = options; 
      const  { files, folders } = itemType; 
      if (files && folders) {
        const rootFiles = await this.fileRepo.getRootFiles(userId,limit,cursor); 
        if ('code' in rootFiles) throw (rootFiles); 
        const rootFolders = await this.folderRepo.getRootFoldersByCreated(userId,limit,cursor); 
        if ('code' in rootFolders) throw (rootFolders); 
        const res = [...rootFiles, ...rootFolders]; 
        const fileOrFolder = res.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()) as [IFile | IFolder];
        const hasNextPage = fileOrFolder.length > (limit * 2);
        const edges = hasNextPage ? fileOrFolder.slice(0, -1) as [IFile | IFolder] : fileOrFolder;
        return {
          edges,
          pageInfo: {
            hasNextPage,
            endCursor: this.fileRepo.toCursorHash(
                edges[edges.length-1]?.createdAt.toString(),
            ),
          }
        }
      } else if (files && !folders) {
        const rootFiles = await this.fileRepo.getRootFiles(userId,limit,cursor); 
        if ('code' in rootFiles) throw (rootFiles);  
        const hasNextPage = rootFiles.length > limit;
        const edges = hasNextPage ? rootFiles.slice(0, -1) : rootFiles;

        return {
          edges: edges as [IFile],
          pageInfo: {
            hasNextPage,
            endCursor: this.fileRepo.toCursorHash(
                edges[edges.length-1]?.createdAt.toString(),
            ),
          }
        } 
      } else if (!files && folders) {
        const rootFolders = await this.folderRepo.getRootFoldersByCreated(userId,limit,cursor); 
        if ('code' in rootFolders) throw (rootFolders); 
        const hasNextPage = rootFolders.length > limit;
        const edges = hasNextPage ? rootFolders.slice(0, -1) : rootFolders;

        return {
          edges: edges as [IFolder],
          pageInfo: {
            hasNextPage,
            endCursor: this.fileRepo.toCursorHash(
                edges[edges.length-1]?.createdAt.toString(),
            ),
          }
        }  
      } else {
        throw new BasicError(ErrorCode.BadRequest,`Incorrect input`); 
      }
    } catch (error) {
        return error as BasicError; 
    }
  }
    
  getStarredDriveData = async (userId: string, limit: number, cursor: string | null): Promise<IFileOrFolderConnection | BasicError> => {
      try {
        const starredFiles = await this.fileRepo.getStarredFiles(userId,limit,cursor); 
        if ('code' in starredFiles) throw (starredFiles); 
        const starredFolders = await this.folderRepo.getStarredFolders(userId,limit,cursor); 
        if ('code' in starredFolders) throw (starredFolders); 
        const res = [...starredFiles, ...starredFolders]; 
        const fileOrFolder = res.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()) as [IFile | IFolder];
        const hasNextPage = fileOrFolder.length > (limit * 2);
        const edges = hasNextPage ? fileOrFolder.slice(0, -1) as [IFile | IFolder] : fileOrFolder;
        return {
          edges,
          pageInfo: {
            hasNextPage,
            endCursor: this.fileRepo.toCursorHash(
                edges[edges.length-1]?.createdAt.toString(),
            ),
          }
        }
      } catch (error) {
          return error as BasicError; 
      }
    }

    getDeletedDriveData = async (userId: string, limit: number, cursor: string | null): Promise<IFileOrFolderConnection | BasicError> => { 
      try { 
        const deletedFiles = await this.fileRepo.getRecentlyDeleted(userId,limit,cursor); 
        if ('code' in deletedFiles) throw (deletedFiles); 
        const deletedFolders = await this.folderRepo.getRecentlyDeletedFolders(userId,limit,cursor); 
        if ('code' in deletedFolders) throw (deletedFolders); 
        const res = [...deletedFiles, ...deletedFolders]; 
        const fileOrFolder = res.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()) as [IFile | IFolder];
        const hasNextPage = fileOrFolder.length > (limit * 2);
        const edges = hasNextPage ? fileOrFolder.slice(0, -1) as [IFile | IFolder] : fileOrFolder;
        return {
          edges,
          pageInfo: {
            hasNextPage,
            endCursor: this.fileRepo.toCursorHash(
                edges[edges.length-1]?.createdAt.toString(),
            ),
          }
        } 
      } catch (error) {
          return error as BasicError; 
      }
    }


    searchDrive = async (userId: string, pattern: string): Promise<IFileAndFolderList | BasicError> => {
      try { 
        const folders = await this.folderRepo.searchFolders(userId,pattern); 
        if (folders instanceof Error) throw (folders); 
        const files = await this.fileRepo.searchFiles(userId,pattern); 
        if (files instanceof Error) throw (files); 
        const res = [...files, ...folders]; 
        const filesAndFolders = res.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        return { items: filesAndFolders as [IFile | IFolder] }; 
      } catch (error) {
          return error as BasicError; 
      }
    }
}

export default DriveController;