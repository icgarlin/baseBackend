import { BasicError } from "../__shared__/error";
import { IDriveFileRepo, 
         IDriveFolderRepo, 
         IFile, 
         IFileAndFolderList, 
         IFileOrFolderConnection, 
         IFolder} from './interfaces';






class DriveController { 

  private fileRepo: IDriveFileRepo; 
  private folderRepo: IDriveFolderRepo; 

  constructor (folderRepo: IDriveFolderRepo, fileRepo: IDriveFileRepo) {
    this.folderRepo = folderRepo; 
    this.fileRepo = fileRepo; 
  }

  // addFileRepo = (repo: IDriveFileRepo): DriveController => {
  //   this.fileRepo = repo; 
  //   return this; 
  // }

  // addFolderRepo = (repo: IDriveFolderRepo): DriveController => {
  //   this.folderRepo = repo; 
  //   return this; 
  // }


  getFolderChildren = async (userId: string, parentId: string, limit: number, cursor: string | null): Promise<IFileOrFolderConnection | BasicError>  => {
    try { 
      const fileChildren = await this.fileRepo.getFilesByFolder(userId,parentId,cursor,limit); 
      if (fileChildren instanceof Error) throw (fileChildren); 
      const folderChildren = await this.folderRepo.getFoldersByParentId(userId,limit,cursor,parentId); 
      if (folderChildren instanceof Error) throw (folderChildren); 
      const res = [...fileChildren, ...folderChildren];
      const fileOrFolder = res.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const hasNextPage = fileOrFolder.length > (limit * 2);
      const edges = hasNextPage ? fileOrFolder.slice(0, -1) : fileOrFolder; 
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

  getRootDriveData = async (userId: string, limit: number, cursor: string | null): Promise<IFileOrFolderConnection | BasicError> => {
    try {
      const rootFiles = await this.fileRepo.getRootFiles(userId,limit,cursor); 
      if ('code' in rootFiles) throw (rootFiles); 
      const rootFolders = await this.folderRepo.getRootFoldersByCreated(userId,limit,cursor); 
      if ('code' in rootFolders) throw (rootFolders); 
      const res = [...rootFiles, ...rootFolders]; 
      const fileOrFolder = res.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const hasNextPage = fileOrFolder.length > (limit * 2);
      const edges = hasNextPage ? fileOrFolder.slice(0, -1) : fileOrFolder;
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
    
  getStarredDriveData = async (userId: string, limit: number, cursor: string | null): Promise<IFileOrFolderConnection | BasicError> => {
      try {
        const starredFiles = await this.fileRepo.getStarredFiles(userId,limit,cursor); 
        if ('code' in starredFiles) throw (starredFiles); 
        const starredFolders = await this.folderRepo.getStarredFolders(userId,limit,cursor); 
        if ('code' in starredFolders) throw (starredFolders); 
        const res = [...starredFiles, ...starredFolders]; 
        const fileOrFolder = res.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const hasNextPage = fileOrFolder.length > (limit * 2);
        const edges = hasNextPage ? fileOrFolder.slice(0, -1) : fileOrFolder;
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
        const fileOrFolder = res.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const hasNextPage = fileOrFolder.length > (limit * 2);
        const edges = hasNextPage ? fileOrFolder.slice(0, -1) : fileOrFolder;
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
        return { items: filesAndFolders }; 
      } catch (error) {
          return error as BasicError; 
      }
    }
}

export default DriveController;