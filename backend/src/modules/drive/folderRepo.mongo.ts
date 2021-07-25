import { ObjectID } from "mongodb";
import { Service } from "typedi";
import { BasicError, ErrorCode, ISuccess } from "../__shared__/error";
import { UpdatedDocument } from "../__shared__/interfaces";
import { FolderModel } from "./folder.model";
import { IDriveFolderRepo, IFolder, IFolderInput, IFolderOptionsInput } from "./interfaces";

@Service()
class MongoDBFolderRepo implements IDriveFolderRepo {
    private fromCursorHash = (cursor: string): string => Buffer.from(cursor, 'base64').toString('ascii');
    toCursorHash = (cursor: string): string => cursor ? Buffer.from(cursor).toString('base64') : ''; 
    
    getFolder = async (folderId: string, userId: string): Promise<IFolder | null | BasicError> => {
        try {
            if (folderId === null || folderId === '' || folderId === undefined) return null; 
            const folder = await FolderModel.findOne({_id:folderId,ownerId:userId});
            if (folder instanceof BasicError) throw (folder); 
            return folder as IFolder; 
        } catch (error) {
            return error as BasicError; 
        }
    }   
    
    removeFileChild = async (fileId: string, parentId: string, userId: string): Promise<UpdatedDocument | BasicError> => {
        try {
            const res = await FolderModel.updateOne({_id: parentId, ownerId: userId}, {
                                                                    $pull: {
                                                                        'childrenIds': fileId
                                                                    }
                                                                 }) as UpdatedDocument;
            if (res instanceof BasicError) return res; 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    removeFolderChild = async (folderId: string, parentId: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            const res = await FolderModel.updateOne({_id: parentId, ownerId: userId}, {
                                                                                        $pull: {
                                                                                            'childrenIds': folderId
                                                                                        }
                                                                                    }) as UpdatedDocument;
            if (res instanceof BasicError) return res; 
            if (res.nModified === 1) return {success:true}; 
            else throw (new BasicError()); 
        } catch (error) {
            return error as BasicError; 
        }
    }


    searchFolders = async (userId: string, pattern: string): Promise<IFolder[] | BasicError> => {
        try {
            const regex = new RegExp(pattern); 
            const folders = await FolderModel.find({ownerId: userId,name:{$regex: regex, $options : 'ix'}}); 
            const folderList = folders.map((folder) => {
                return folder.toObject(); 
            })
            return folderList as IFolder[]; 
        } catch (error) {   
            return error as BasicError; 
        }
    }

    doesFolderExist = async (name: string, userId: string): Promise<boolean | BasicError> => {
        try {
            const folder = await this.getFolder(name,userId); 
            if (folder instanceof BasicError) throw (folder); 
            if ('_id' in folder) return true; 
            else return false; 
        } catch (error) {
            return error as BasicError
        }
    }

    createFolder = async (userId: string, name: string, personal: boolean, parentId: string): Promise<IFolder | BasicError> => {
        try {
            const folderExists = await this.doesFolderExist(name,userId);
            if (folderExists) throw (new BasicError(ErrorCode.UserInputError)); 
            if (folderExists instanceof BasicError) throw (folderExists); 
            let folderStruct: IFolderInput; 
            if (parentId !== null || parentId === '' || parentId === undefined) {
                folderStruct = {
                    parentId,
                    ownerId: userId, 
                    isPersonal: personal,
                    name,
                    starred: false,
                    deleted: false
                }
            } else {
                folderStruct = {
                    ownerId: userId, 
                    isPersonal: personal,
                    name,
                    starred: false,
                    deleted: false
                } 
            }
            const folder = await FolderModel.create(folderStruct); 
            if (folder instanceof BasicError) throw (folder); 
            return folder.toObject() as IFolder; 
        } catch (error) {
            if (error instanceof BasicError) {
                if (error.code === 420) {
                    error.message = 'DUPLICATE FOLDER NAME'; 
                    return error; 
                }
            }
        }
    }

    changeParent = async (folderId: string, parentId: string, ownerId: string, toRoot: boolean): Promise<ISuccess | BasicError> => {
        try {
            if (toRoot) {
              return await this.moveFolderToRoot(folderId,parentId,ownerId); 
            }
            const updatedFolder = await FolderModel.updateOne({_id:folderId, ownerId}, {parentId}) as UpdatedDocument;
            if (updatedFolder instanceof Error) throw (updatedFolder); 
            if (updatedFolder.nModified === 1) return {success:true}; 
            else throw (new BasicError()); 
        } catch (error) {
            return error as BasicError;  
        }
    }

    moveFolderToRoot = async (folderId: string, parentId: string, ownerId: string): Promise<ISuccess | BasicError> => {
        try {
            const updated = await FolderModel.updateOne({_id: folderId, ownerId, parentId}, {$unset:{parentId:1}}) as UpdatedDocument; 
            if (updated instanceof BasicError) throw (updated); 
            if (updated.nModified === 1) return {success:true}; 
            else throw (new BasicError()); 
        } catch (error) {
            return error as BasicError; 
        }
    }

    renameFolder = async (name: string, folderId: string, ownerId: string): Promise<ISuccess | BasicError> => {
        try {
           const updated = await FolderModel.updateOne({_id: folderId, ownerId}, {name}) as UpdatedDocument; 
           if (updated instanceof BasicError) throw (updated); 
           if (updated.nModified === 1) return {success:true}; 
           else throw (new BasicError());  
        } catch (error) { 
           return error as BasicError; 
        }   
    }

    deleteFolder = async (folderId: string, ownerId: string): Promise<UpdatedDocument | BasicError> => {
        try {
            const deletedFolder = await FolderModel.updateOne({_id:folderId,ownerId}, {
                                                                                        deleted: true
                                                                                }) as UpdatedDocument; 
            if (deletedFolder instanceof Error) throw (deletedFolder); 
            return deletedFolder; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    getFolders = async (userId: string, limit: number, cursor: string | null, folderId?: string, folderOptionsInput?: IFolderOptionsInput): Promise<IFolder[] | BasicError> => {
        try {

            let res: IFolder[] | BasicError; 
            if (folderOptionsInput === undefined && folderId !== undefined) {
                // If Open Folder 
                res = await this.getFoldersByParentId(userId,limit,cursor,folderId); 
            } else if ((folderId === undefined || folderId === '' || folderId === null) && folderOptionsInput !== undefined) {
                // If Starred, or Deleted Page
 
                const { deleted, starred } = folderOptionsInput; 
                if (deleted !== undefined && deleted) {

                    res = await this.getRecentlyDeletedFolders(userId,limit,cursor); 
            
                } else if (starred !== undefined && starred) {
                    res = await this.getStarredFolders(userId,limit,cursor); 
                }
            } else if ((folderId === undefined || folderId === '' || folderId === null) && folderOptionsInput === undefined) {
                // If Home page

                res = await this.getRootFoldersByCreated(userId,limit,cursor); 
            } 
      
            if (res instanceof BasicError) throw (res); 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    getRootFoldersByUpdate = async (userId: string, limit: number, cursor: string): Promise<IFolder[] | BasicError> => {
        try {
            // const user = await userDbUtils.findUser(userId); 
            // if (user instanceof Error) throw (user);
            const cursorTime = cursor
            ? new Date(this.fromCursorHash(cursor)) //.toISOString()
            : null;
            const match = {
                                // no cursor is needed for the first query
                            ...(cursorTime && {
                                updatedAt: {
                                $lt: cursorTime, //MORA NEW DATE(), sa toISOString ne radi
                                },
                            }),
                            $and:[
                                   {
                                   'isPersonal': true
                                   },
                                   {
                                   'ownerId': new ObjectID(userId)
                                   },
                                   {
                                    'parentId': {
                                        $exists: false
                                    }
                                   },
                                   {
                                    $or: [ 
                                        {
                                        'deleted': false,
                                        },

                                        {
                                            'deleted': {
                                                $exists: false
                                            }
                                        }
                                    
                                        ]
                                   }
                               
                                ],
                           };

            const folders = await FolderModel.aggregate([
                                                { $match: match },
                                                {
                                                    $sort: {
                                                    updatedAt: -1,
                                                    },
                                                },
                                                {
                                                    $limit: limit + 1,
                                                },
                                                ]).exec() as IFolder[];
            if (folders instanceof BasicError) throw (folders);  
            return folders; 
        } catch (error) {
            return error as BasicError; 
        }
    }


    getFoldersByParentId = async (userId: string, limit: number, cursor: string | null, folderId: string): Promise<IFolder[] | BasicError> => {
        try {
            const cursorTime = cursor
            ? new Date(this.fromCursorHash(cursor)) //.toISOString()
            : null;
            const match = {
                                // no cursor is needed for the first query
                            ...(cursorTime && {
                                updatedAt: {
                                $lt: cursorTime, //MORA NEW DATE(), sa toISOString ne radi
                                },
                            }),
                            $and:[
                                   {
                                   'isPersonal': true
                                   },
                                   {
                                   'ownerId': userId
                                   },
                                   {
                                    'parentId': folderId
                                   },
                                   {
                                    $or: [ 
                                        {
                                        'deleted': false,
                                        },

                                        {
                                            'deleted': {
                                                $exists: false
                                            }
                                        }
                                    
                                        ]
                                   }
                                
                                ],
                           };

            const folders = await FolderModel.aggregate([
                                                { $match: match },
                                                {
                                                    $sort: {
                                                    createAt: -1,
                                                    },
                                                },
                                                {
                                                    $limit: limit + 1,
                                                },
                                                ]).exec() as IFolder[];
    
            if (folders instanceof BasicError) throw (folders);  
            return folders; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    getRootFoldersByCreated = async (userId: string, limit: number, cursor: string): Promise<IFolder[] | BasicError> => {
        try {
            // const user = await userDbUtils.findUser(userId); 
            // if (user instanceof Error) throw (user);
            const cursorTime = cursor
            ? new Date(this.fromCursorHash(cursor)) //.toISOString()
            : null;
            const match = {
                                // no cursor is needed for the first query
                            ...(cursorTime && {
                                createdAt: {
                                $lt: cursorTime, //MORA NEW DATE(), sa toISOString ne radi
                                },
                            }),
                            $and:[
                                   {
                                   'isPersonal': true
                                   },
                                   {
                                   'ownerId': userId
                                   },
                                   {
                                    'parentId': {
                                        $exists: false
                                    },
                                   },
                                   {
                                    $or: [ 
                                        {
                                        'deleted': false,
                                        },

                                        {
                                            'deleted': {
                                                $exists: false
                                            }
                                        }
                                    
                                        ]
                                   }
                               
        
                                   
                                ],
                           };

            const folders = await FolderModel.aggregate([
                                                { $match: match },
                                                {
                                                    $sort: {
                                                    createdAt: -1,
                                                    },
                                                },
                                                {
                                                    $limit: limit + 1,
                                                },
                                                ]).exec() as IFolder[];
            if (folders instanceof BasicError) throw (folders);  
            return folders; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    getRecentlyDeletedFolders = async (userId: string, limit: number, cursor: string): Promise<IFolder[] | BasicError> => {
        try {
            // const user = await userDbUtils.findUser(userId); 
            // if (user instanceof Error) throw (user);
            const cursorTime = cursor
            ? new Date(this.fromCursorHash(cursor)) //.toISOString()
            : null;
            const match = {
                            // no cursor is needed for the first query
                            ...(cursorTime && {
                                createdAt: {
                                $lt: cursorTime, //MORA NEW DATE(), sa toISOString ne radi
                                },
                            }),
                            $and:
                                [
                                   {
                                   'isPersonal': true
                                   },
                                   {
                                   'ownerId': userId
                                   },
                                   {
                                   'deleted': true
                                   }
                                ],
                          };

            const folders = await FolderModel.aggregate([
                                                { $match: match },
                                                {
                                                    $sort: {
                                                    createdAt: -1,
                                                    },
                                                },
                                                {
                                                    $limit: limit + 1,
                                                },
                                                ]).exec() as IFolder[];
            if (folders instanceof BasicError) throw (folders);  
            return folders; 
        } catch (error) {
            return error as BasicError; 
        }
    }


    getStarredFolders = async (userId: string, limit: number, cursor: string): Promise<IFolder[] | BasicError> => {
        try {
            // const user = await userDbUtils.findUser(userId); 
            // if (user instanceof Error) throw (user);
            const cursorTime = cursor
            ? new Date(this.fromCursorHash(cursor)) //.toISOString()
            : null;
            const match = {
                                // no cursor is needed for the first query
                            ...(cursorTime && {
                                createdAt: {
                                $lt: cursorTime, //MORA NEW DATE(), sa toISOString ne radi
                                },
                            }),
                            $and:[
                                   {
                                   'isPersonal': true
                                   },
                                   {
                                   'ownerId': userId
                                   },
                                    {
                                      'starred': true
                                    },

                                    {
                                        $or: [ 
                                            {
                                            'deleted': false,
                                            },
    
                                            {
                                                'deleted': {
                                                    $exists: false
                                                }
                                            }
                                        
                                            ]
                                       }
                                   
                                ],
                           };

            const folders = await FolderModel.aggregate([
                                                { $match: match },
                                                {
                                                    $sort: {
                                                    createdAt: -1,
                                                    },
                                                },
                                                {
                                                    $limit: limit + 1,
                                                },
                                                ]).exec() as IFolder[];
            if (folders instanceof BasicError) throw (folders);  
            return folders; 
        } catch (error) {
            return error as BasicError; 
        }
    }


    setDeletedTrue = async (folderId: string, ownerId: string): Promise<ISuccess | BasicError> => {
        try {
            const updated = await FolderModel.updateOne({_id: folderId, ownerId}, 
                                                                    {
                                                                      deleted: true
                                                                    }) as UpdatedDocument; 
           if (updated instanceof BasicError) throw (updated); 
           return {success:true}; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    setDeletedFalse = async (folderId: string, ownerId: string): Promise<ISuccess | BasicError> => {
        try {
            const updated = await FolderModel.updateOne({_id: folderId, ownerId}, 
                                                                    {
                                                                      deleted: false
                                                                    }) as UpdatedDocument; 
           if (updated instanceof BasicError) throw (updated); 
           return {success:true}; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    starFolder = async (folderId: string, ownerId: string): Promise<ISuccess | BasicError> => {
        try {
            const updated = await FolderModel.updateOne({_id: folderId, ownerId}, 
                                                                    {
                                                                      starred: true
                                                                    }) as UpdatedDocument; 
           if (updated instanceof BasicError) throw (updated); 
           return {success:true}; 
        } catch (error) {
            return error as BasicError; 
        }
    }


    unstarFolder = async (folderId: string, ownerId: string): Promise<ISuccess | BasicError> => {
        try {
            const updated = await FolderModel.updateOne({_id: folderId, ownerId}, 
                                                                    {
                                                                      starred: false
                                                                    }) as UpdatedDocument; 
           if (updated instanceof BasicError) throw (updated); 
           return {success:true}; 
        } catch (error) {
            return error as BasicError; 
        }
    }

}

export default MongoDBFolderRepo; 