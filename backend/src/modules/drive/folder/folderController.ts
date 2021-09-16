import { BasicError, 
         ISuccess } from '../../__shared__/error';
import { ICloudServiceRepo, 
         IBlobRepo } from '../../__shared__/interfaces';
import { FileController } from '../file/fileController';
import { IFileRepo, 
         IFolderRepo, 
         IFile, 
         IFileConnection, 
         IFolder, 
         IFolderConnection, 
         IFolderOptionsInput, 
         IFolderInput } from '../interfaces';



class FolderController extends FileController {

    private folderRepo: IFolderRepo; 
    constructor (repo: IFolderRepo, fileRepo?: IFileRepo, blobRepo?: IBlobRepo, cloudRepo?: ICloudServiceRepo) {
        super(fileRepo,blobRepo,cloudRepo);
        // database management system 
        this.folderRepo = repo;
    }
    
    createFolder = async (input: IFolderInput): Promise<IFolder | BasicError> => {
        try {
            const { fileId } = input; 
            if (fileId === undefined) {
                const { fileId, ...folder } = input; 
                const res = await this.folderRepo.createFolder(folder);
                if (res instanceof BasicError) throw (res); 
                return res;  
            } else {
                const res = await this.folderRepo.createFolder(input);
                if (res instanceof BasicError) throw (res); 
                return res;  
            }
         
        } catch (error) {
            return error as BasicError; 
        }
    }

    moveFolder = async (folderId: string, parentId: string, ownerId: string, atRoot: boolean, toRoot: boolean): Promise<ISuccess | BasicError> => {
        try {
            if (atRoot) {
               return await this.moveRootFolder(folderId,parentId,ownerId); 
            } else {
               return await this.moveNonRootFolder(folderId,parentId,ownerId,toRoot); 
            }
        } catch (error) {
            return error as BasicError;  
        }
    }

    moveRootFolder = async (folderId: string, parentId: string, ownerId: string): Promise<ISuccess | BasicError> => {
        try {
            const res = await this.folderRepo.changeParent(folderId,parentId,ownerId,false); 
            if (res instanceof BasicError) throw (res); 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    moveNonRootFolder = async (folderId: string, parentId: string, ownerId: string, toRoot: boolean): Promise<ISuccess | BasicError> => {
        try {
            const deleteRes = await this.folderRepo.removeFolderChild(folderId,parentId,ownerId); 
            if (deleteRes instanceof BasicError) throw (deleteRes); 
            if ('success' in deleteRes) {
                const res = await this.folderRepo.changeParent(folderId,parentId,ownerId,toRoot); 
                if (res instanceof BasicError) throw (res); 
                return res; 
            } else throw (new BasicError()); 
        } catch (error) {
            return error as BasicError; 
        }
    }

    renameFolder = async (name: string, folderId: string, ownerId: string): Promise<ISuccess | BasicError> => {
        try {
            const res = await this.folderRepo.renameFolder(name,folderId,ownerId); 
            if (res instanceof Error) throw (res);
            return res;  
        } catch (error) {
           return error as BasicError; 
        }   
    }

    deleteFolder = async (folderId: string, ownerId: string): Promise<true | BasicError> => {
        try {
            const res = await this.folderRepo.deleteFolder(folderId,ownerId); 
            if ('code' in res) throw (res); 
            if (res.nModified === 1) return true;
            throw new BasicError();   
        } catch (error) {
            return error as BasicError; 
        }
    }

    getRootFolders = async (userId: string, limit: number, cursor: string, sortByCreated: boolean): Promise<IFolderConnection | BasicError> => {
        try {
            if (sortByCreated) {
                const res = await this.folderRepo.getRootFoldersByCreated(userId,limit,cursor);
                if ('code' in res) throw (res);
                const hasNextPage =  res.length > limit;
                const edges = hasNextPage ? res.slice(0, -1) : res;
                return {    
                        edges,
                        pageInfo: {
                            hasNextPage,
                            endCursor: this. toCursorHash(
                                edges[edges.length - 1]?.createdAt.toString(),
                            ),
                        }
                    }; 
            } else {
                const res = await this.folderRepo.getRootFoldersByUpdate(userId,limit,cursor); 
                if ('code' in res) throw (res); 
                const hasNextPage =  res.length > limit;
                const edges = hasNextPage ? res.slice(0, -1) : res;
                return {    
                        edges,
                        pageInfo: {
                            hasNextPage,
                            endCursor: this.toCursorHash(
                                edges[edges.length - 1]?.createdAt.toString(),
                            ),
                        }
                    };
            }
        } catch (error) {
            return error as BasicError; 
        }
    }

    getFolderItemsOfPage = async (userId: string, limit: number, cursor: string, folderId?: string, folderOptionsInput?: IFolderOptionsInput): Promise<IFolderConnection | BasicError> => {
        try {
          
            let res: IFolder[] | BasicError; 
            if (folderOptionsInput === undefined && (folderId !== '')) {
                // If Open Folder 
                res = await  this.folderRepo.getFolders(userId,limit,cursor,folderId); 
            } else if ((folderId === null || folderId === undefined) && (folderOptionsInput !== undefined && folderOptionsInput !== null)) {
                // If Recents, Starred, or Deleted Page
                res = await this.folderRepo.getFolders(userId,limit,cursor,undefined,folderOptionsInput); 
            } else if ((folderId === '') && (folderOptionsInput === undefined || folderOptionsInput === null)) {
                // If Home page
                res = await this.folderRepo.getFolders(userId,limit,cursor); 
            } 
            if (res !== undefined && !(res instanceof BasicError)) {
                const hasNextPage =  res.length > limit;
                const edges = hasNextPage ? res.slice(0, -1) : res;
                return {    
                        edges,
                        pageInfo: {
                            hasNextPage,
                            endCursor: this.toCursorHash(
                                edges[edges.length - 1]?.createdAt.toString(),
                            ),
                        }
                    };
            } else throw (res);  
        } catch (error) {
            return error as BasicError; 
        }
    }   

    // FIXME: Double check this 
    getFolderFiles = async (userId: string, folderId: string | null, limit: number, cursor: string, folderOptionsInput?: IFolderOptionsInput): Promise<IFileConnection | BasicError> => {
        try {
            if (folderOptionsInput === undefined) {
                if (folderId === '' || !folderId) {
                    const rootFiles = await this.fileRepo.getRootFiles(userId,limit,cursor);
                    if ('code' in rootFiles) throw (rootFiles);
                    const hasNextPage = rootFiles.length > limit;
                    const edges = hasNextPage ? rootFiles.slice(0, -1) : rootFiles;
                    return {    
                            edges,
                            pageInfo: {
                                hasNextPage,
                                endCursor: this.toCursorHash(
                                    edges[edges.length - 1]?.createdAt.toString(),
                                ),
                            }
                        };
                } else {
                    const files = await this.fileRepo.getFilesByFolder(userId,folderId,cursor,limit); 
                    if ('code' in files) throw (files); 
                    const hasNextPage = files.length > limit;
                    const edges = hasNextPage ? files.slice(0, -1) : files;
                    return {    
                            edges,
                            pageInfo: {
                                hasNextPage,
                                endCursor: this.toCursorHash(
                                    edges[edges.length - 1]?.createdAt.toString(),
                                ),
                            }
                        };
                }   
            } else {
                let files: IFile[] | BasicError; 
                const { starred, deleted } = folderOptionsInput; 
                if (deleted !== undefined && deleted) {
                    files = await this.fileRepo.getRecentlyDeleted(userId,limit,cursor); 
                } else if (starred !== undefined && starred) {
                    files = await this.getStarredFiles(userId,limit,cursor); 
                }
                if (files instanceof BasicError) throw (files); 
                const hasNextPage = files.length > limit;
                const edges = hasNextPage ? files.slice(0, -1) : files;
                return {    
                        edges,
                        pageInfo: {
                            hasNextPage,
                            endCursor: this.toCursorHash(
                                edges[edges.length - 1]?.createdAt.toString(),
                            ),
                        }
                    };
            }
        } catch (error) {
            return error as BasicError; 
        }
    }

    getFilesByMatchingPattern = async (userId: string, pattern: string): Promise<IFileConnection | BasicError> => {
        try {
          const edges =
            await this.fileRepo.getFilesByMatchingPattern(userId, pattern);

    
          if (edges instanceof Error) throw edges;
          return {
            edges: edges,
            pageInfo: {
              hasNextPage: false,
              endCursor: this.toCursorHash(
                edges[edges.length - 1]?.createdAt.toString()
              ),
            },
          };
        } catch (error) {
          return error as BasicError;
        }
      };

    setDeletedTrue = async (folderId: string, ownerId: string): Promise<ISuccess | BasicError> => {
        try {
            const res = await this.folderRepo.setDeletedTrue(folderId,ownerId); 
            if (res instanceof BasicError) throw (res); 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    setDeletedFalse = async (folderId: string, ownerId: string): Promise<ISuccess | BasicError> => {
        try {
            const res = await this.folderRepo.setDeletedFalse(folderId,ownerId); 
            if (res instanceof BasicError) throw (res); 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    starFolder = async (folderId: string, ownerId: string): Promise<ISuccess | BasicError> => {
        try {
            const res = await this.folderRepo.starFolder(folderId,ownerId); 
            if (res instanceof BasicError) throw (res); 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    unstarFolder = async (folderId: string, ownerId: string): Promise<ISuccess | BasicError> => {
        try {
            const res = await this.folderRepo.unstarFolder(folderId,ownerId); 
            if (res instanceof BasicError) throw (res); 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }
}
export default FolderController; 