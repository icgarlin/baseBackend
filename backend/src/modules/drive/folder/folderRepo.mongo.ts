/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import mongoose from 'mongoose'; 
import { ObjectID } from 'mongodb';
import { Service } from 'typedi';
import { BasicError, 
         ErrorCode, 
         ISuccess } from '../../__shared__/error';
import { UpdatedDocument } from '../../__shared__/interfaces';
import { FolderModel } from './folder.model';
import { IFolderRepo, 
         IFolder, 
         IFolderInput, 
         IFolderOptionsInput } from '../interfaces';
import { typesenseClient } from '../../../config/typesense/index.js'; 

@Service()
class MongoDBFolderRepo implements IFolderRepo {
    private fromCursorHash = (cursor: string): string => Buffer.from(cursor, 'base64').toString('ascii');
    toCursorHash = (cursor: string): string => cursor ? Buffer.from(cursor).toString('base64') : ''; 
    
    getFolder = async (folderId: string, userId: string): Promise<IFolder | null | BasicError> => {
        try {
            if (folderId === null || folderId === '' || folderId === undefined) return null; 
            const folder = await FolderModel.findOne({_id:folderId,ownerId:userId});
            if (folder instanceof BasicError) throw (folder); 
            return folder as IFolder; 
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                return new BasicError(ErrorCode.InternalServerError,error.message)
            } else if (error instanceof mongoose.Error) {
                return new BasicError(ErrorCode.BadRequest,error.message); 
            } else if (error instanceof BasicError) {
                return error
            }
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
            if (error instanceof mongoose.Error.ValidationError) {
                return new BasicError(ErrorCode.InternalServerError,error.message)
            } else if (error instanceof mongoose.Error) {
                return new BasicError(ErrorCode.BadRequest,error.message); 
            } else if (error instanceof BasicError) {
                return error
            } 
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
            if (error instanceof mongoose.Error.ValidationError) {
                return new BasicError(ErrorCode.InternalServerError,error.message)
            } else if (error instanceof mongoose.Error) {
                return new BasicError(ErrorCode.BadRequest,error.message); 
            } else if (error instanceof BasicError) {
                return error
            }
        }
    }

    doesFolderExist = async (name: string, userId: string): Promise<boolean | BasicError> => {
        try {
            const folder = await this.getFolder(name,userId); 
            if (folder instanceof BasicError) throw (folder); 
            if ('_id' in folder) return true; 
            else return false; 
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                return new BasicError(ErrorCode.InternalServerError,error.message)
            } else if (error instanceof mongoose.Error) {
                return new BasicError(ErrorCode.BadRequest,error.message); 
            } else if (error instanceof BasicError) {
                return error
            }
        }
    }


    createFolderAtRoot = async (input: IFolderInput): Promise<IFolder | BasicError> => {
        try { 
            const { name, ownerId, isPersonal } = input; 
            const folderExists = await this.doesFolderExist(name,ownerId);
            if (folderExists === true) throw (new BasicError(ErrorCode.UserInputError,`Item with that name found`)); 
            if (folderExists instanceof Error) throw (folderExists); 
            const newFolder = await FolderModel.create({
                                                         ownerId, 
                                                         name, 
                                                         isPersonal, 
                                                         parentId: null, 
                                                         starred: false, 
                                                         deleted: false
                                                       });
            return newFolder.toObject() as IFolder; 
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
              return new BasicError(ErrorCode.InternalServerError,error.message)
            } else if (error instanceof mongoose.Error) {
              return new BasicError(ErrorCode.BadRequest,error.message); 
            } else if (error instanceof BasicError) {
              return error
            }
        }
    }

    createFolder = async (input: IFolderInput): Promise<IFolder | BasicError> => {
        try {
            const { name, ownerId } = input; 
            const folderExists = await this.doesFolderExist(name,ownerId);
            if (folderExists) throw (new BasicError(ErrorCode.UserInputError,`Duplicate item`)); 
            if (folderExists instanceof BasicError) throw (folderExists); 
            const folder = await FolderModel.create(input);
            
            const typesenseFolderInput = {
                id: folder['_id'],
                ownerId: folder['ownerId'],
                name: folder['name'],
                type: folder['type'], 
                createdAt: folder['createdAt'].toString(),
            }
            typesenseClient.collections('files').documents().create(typesenseFolderInput); 
            return folder.toObject() as IFolder; 
        } catch (error) {
            console.log('The error ', error); 
            if (error instanceof mongoose.Error.ValidationError) {
                return new BasicError(ErrorCode.InternalServerError,error.message)
            } else if (error instanceof mongoose.Error) {
                return new BasicError(ErrorCode.BadRequest,error.message); 
            } else if (error instanceof BasicError) {
                return error
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
            if (error instanceof mongoose.Error.ValidationError) {
                return new BasicError(ErrorCode.InternalServerError,error.message)
            } else if (error instanceof mongoose.Error) {
                return new BasicError(ErrorCode.BadRequest,error.message); 
            } else if (error instanceof BasicError) {
                return error
            } 
        }
    }

    moveFolderToRoot = async (folderId: string, parentId: string, ownerId: string): Promise<ISuccess | BasicError> => {
        try {
            const updated = await FolderModel.updateOne({_id: folderId, ownerId, parentId}, {$unset:{parentId:1}}) as UpdatedDocument; 
            if (updated instanceof BasicError) throw (updated); 
            if (updated.nModified === 1) return {success:true}; 
            else throw (new BasicError()); 
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                return new BasicError(ErrorCode.InternalServerError,error.message)
            } else if (error instanceof mongoose.Error) {
                return new BasicError(ErrorCode.BadRequest,error.message); 
            } else if (error instanceof BasicError) {
                return error
            }
        }
    }

    renameFolder = async (name: string, folderId: string, ownerId: string): Promise<ISuccess | BasicError> => {
        try {
           const updated = await FolderModel.updateOne({_id: folderId, ownerId}, {name}) as UpdatedDocument; 
           if (updated instanceof BasicError) throw (updated); 
           if (updated.nModified === 1) return {success:true}; 
           else throw (new BasicError());  
        } catch (error) { 
            if (error instanceof mongoose.Error.ValidationError) {
                return new BasicError(ErrorCode.InternalServerError,error.message)
            } else if (error instanceof mongoose.Error) {
                return new BasicError(ErrorCode.BadRequest,error.message); 
            } else if (error instanceof BasicError) {
                return error
            }
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
            if (error instanceof mongoose.Error.ValidationError) {
                return new BasicError(ErrorCode.InternalServerError,error.message)
            } else if (error instanceof mongoose.Error) {
                return new BasicError(ErrorCode.BadRequest,error.message); 
            } else if (error instanceof BasicError) {
                return error
            } 
        }
    }

    getFolders = async (userId: string, limit: number, cursor: string | null, folderId?: string, folderOptionsInput?: IFolderOptionsInput): Promise<IFolder[] | BasicError> => {
        try {

            let res: IFolder[] | BasicError; 
            if (folderOptionsInput === undefined && folderId !== '') {
                // If Open Folder 
                res = await this.getFoldersByParentId(userId,limit,cursor,folderId); 
            } else if ((folderId === '') && folderOptionsInput !== undefined) {
                // If Starred, or Deleted Page
 
                const { deleted, starred } = folderOptionsInput; 
                if (deleted !== undefined && deleted) {

                    res = await this.getRecentlyDeletedFolders(userId,limit,cursor); 
            
                } else if (starred !== undefined && starred) {
                    res = await this.getStarredFolders(userId,limit,cursor); 
                }
            } else if ((folderId === '') && folderOptionsInput === undefined) {
                // If Home page

                res = await this.getRootFoldersByCreated(userId,limit,cursor); 
            } 
      
            if (res instanceof BasicError) throw (res); 
            return res; 
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                return new BasicError(ErrorCode.InternalServerError,error.message)
            } else if (error instanceof mongoose.Error) {
                return new BasicError(ErrorCode.BadRequest,error.message); 
            } else if (error instanceof BasicError) {
                return error
            }
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
            if (error instanceof mongoose.Error.ValidationError) {
                return new BasicError(ErrorCode.InternalServerError,error.message)
            } else if (error instanceof mongoose.Error) {
                return new BasicError(ErrorCode.BadRequest,error.message); 
            } else if (error instanceof BasicError) {
                return error
            }
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
    
            return folders; 
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                return new BasicError(ErrorCode.InternalServerError,error.message)
            } else if (error instanceof mongoose.Error) {
                return new BasicError(ErrorCode.BadRequest,error.message); 
            } else if (error instanceof BasicError) {
                return error
            }
          
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
            if (error instanceof mongoose.Error.ValidationError) {
                return new BasicError(ErrorCode.InternalServerError,error.message)
            } else if (error instanceof mongoose.Error) {
                return new BasicError(ErrorCode.BadRequest,error.message); 
            } else if (error instanceof BasicError) {
                return error
            } 
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
            if (error instanceof mongoose.Error.ValidationError) {
                return new BasicError(ErrorCode.InternalServerError,error.message)
            } else if (error instanceof mongoose.Error) {
                return new BasicError(ErrorCode.BadRequest,error.message); 
            } else if (error instanceof BasicError) {
                return error
            }
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
            if (error instanceof mongoose.Error.ValidationError) {
                return new BasicError(ErrorCode.InternalServerError,error.message)
            } else if (error instanceof mongoose.Error) {
                return new BasicError(ErrorCode.BadRequest,error.message); 
            } else if (error instanceof BasicError) {
                return error
            }
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
            if (error instanceof mongoose.Error.ValidationError) {
                return new BasicError(ErrorCode.InternalServerError,error.message)
            } else if (error instanceof mongoose.Error) {
                return new BasicError(ErrorCode.BadRequest,error.message); 
            } else if (error instanceof BasicError) {
                return error
            }
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
            if (error instanceof mongoose.Error.ValidationError) {
                return new BasicError(ErrorCode.InternalServerError,error.message)
            } else if (error instanceof mongoose.Error) {
                return new BasicError(ErrorCode.BadRequest,error.message); 
            } else if (error instanceof BasicError) {
                return error
            } 
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
            if (error instanceof mongoose.Error.ValidationError) {
                return new BasicError(ErrorCode.InternalServerError,error.message)
            } else if (error instanceof mongoose.Error) {
                return new BasicError(ErrorCode.BadRequest,error.message); 
            } else if (error instanceof BasicError) {
                return error
            }
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
            if (error instanceof mongoose.Error.ValidationError) {
                return new BasicError(ErrorCode.InternalServerError,error.message)
            } else if (error instanceof mongoose.Error) {
                return new BasicError(ErrorCode.BadRequest,error.message); 
            } else if (error instanceof BasicError) {
                return error
            }
        }
    }

}

export default MongoDBFolderRepo; 