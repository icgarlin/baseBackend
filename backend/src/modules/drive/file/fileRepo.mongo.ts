import mongoose from 'mongoose'; 
import { IFileRepo, 
         IFile, 
         IFileInfo, 
         IFileInput, 
         PreSignedInfo } from '../interfaces';
import { FileModel } from './file.model';
import { BasicError, 
         ErrorCode, 
         ISuccess } from '../../__shared__/error';
import { ObjectID } from 'mongodb';
import { IBlobRepo, 
         UpdatedDocument } from '../../__shared__/interfaces';
import { Service } from 'typedi';
import { FolderModel } from '../folder/folder.model';
import BaseRepo from '../../__shared__/baseRepo';


@Service()
class MongoDBFileRepo extends BaseRepo implements IFileRepo {
    // private fromCursorHash = (cursor: string): string => Buffer.from(cursor, 'base64').toString('ascii');
    findFileByName = async (userId: string, name: string): Promise<IFile | BasicError> => {
        try {
            const fileExists = await FileModel.findOne({ownerId:userId,name}) as IFile;
            if (fileExists instanceof BasicError)  throw (new BasicError(ErrorCode.UserInputError)); 
            return fileExists; 
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

    searchFiles = async (userId: string, pattern: string): Promise<IFile[] | BasicError> => {
        try {
            const regex = new RegExp(pattern); 
            const files = await FileModel.find({ownerId: userId,name:{$regex: regex, $options : 'ix'}}); 
            const fileList = files.map((file) => {
                return file.toObject(); 
            })
            return fileList as IFile[];  
        } catch (error) {
            return error as BasicError; 
        }
    }


    createPreSignedUrls = async (userId: string, info: IFileInfo[], blobRepo: IBlobRepo, serverId?: string): Promise<PreSignedInfo> => {
        const urls: string[] = []; 
        const keys: string[] = [];
        await Promise.all(info.map(async (file) => {
            const { name, type } = file;
            const presignedInfo: {url: string, key: string} | BasicError = await blobRepo.handleGetPreSignedUrl(name,type,userId,serverId); 
            if (presignedInfo instanceof Error) throw (presignedInfo); 
            else {
                const { url, key } = presignedInfo; 
                urls.push(url); 
                keys.push(key);
            }
        }));
        return { urls, keys }; 
    }

    atRoot = async (fileId: string, ownerId: string): Promise<boolean | BasicError>=> {
        try {
            const parentId = await FileModel.find({_id:fileId, ownerId},{parentId: 1}); 
            if (parentId && parentId !== undefined && parentId.length === 1) {
                return true; 
            }
            else throw (new BasicError()); 
        } catch (error) {
            return error as BasicError; 
        }
    }

    createFile = async (fileInput: IFileInput): Promise<IFile | BasicError> => {
        try {
            const { parentId, name, key, size, type, ownerId } = fileInput; 
             const fileRes = await this.findFileByName(ownerId,name);
             if ('_id' in fileRes) throw (new BasicError(ErrorCode.UserInputError,`Duplicate item`))
             if (fileRes instanceof BasicError) throw (fileRes); 
             const newFile = await FileModel.create({
                                                        name,
                                                        ownerId, 
                                                        key,
                                                        parentId: parentId === '' ? null : parentId, 
                                                        size,
                                                        type, 
                                                        deleted: false,
                                                        isPersonal: true
                                                    })
              return newFile.toObject() as IFile;  
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

    moveFileToRoot = async (fileId: string, parentId: string, ownerId: string): Promise<ISuccess | BasicError> => {
        try {
            const updated = await FileModel.updateOne({_id: fileId, ownerId, parentId}, {$unset:{parentId:1}}) as UpdatedDocument; 
            if (updated instanceof BasicError) throw (updated); 
            if (updated.nModified === 1) return {success:true}; 
            else throw (new BasicError()); 
        } catch (error) {
            return error as BasicError; 
        }
    }

    changeFileParent = async (fileId: string, parentId: string, ownerId: string): Promise<UpdatedDocument | BasicError>=> {
        try {
            const updated = await FileModel.updateOne({_id:fileId,ownerId}, {       
                                                                                parentId: parentId

                                                                                    }) as UpdatedDocument; 
            if (updated instanceof BasicError) throw (updated); 
            return updated; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    getFilesById = (userId: string, fileIds: string[]): Promise<IFile[] | BasicError> => {
        try {
            const fileArray = fileIds.map(async (id) => { 
                const foundFile = await FileModel.findOne({_id:id,ownerId:userId});
                const file = foundFile.toObject() as IFile;
                return file; 
            });
            if (fileArray instanceof BasicError) throw (fileArray); 
            return Promise.all(fileArray); 
        } catch (error) {
            return error as Promise<BasicError>; 
        }
    }

    getFilesByFolder = async (userId: string, parentId: string, cursor: string | null, limit: number): Promise<IFile[] | BasicError> => {
        try {
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
                          'ownerId': userId
                         },

                         {
                            'parentId': new ObjectID(parentId)
                         }
                    ],
            };
            const fileFeed = await FileModel.aggregate([
                                                { $match: match },
                                                {
                                                    $sort: {
                                                    'createdAt': -1,
                                                    },
                                                },
                                                {
                                                    $limit: limit + 1,
                                                },
                                                ]).exec() as IFile[];
            if (fileFeed instanceof BasicError) throw (fileFeed); 
            return fileFeed; 

        } catch (error) {
            return error as BasicError; 
        }
    }

    getRootFiles = async (userId: string, limit: number, cursor: string | null): Promise<IFile[] | BasicError> => {
        try {
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
                            'ownerId': userId
                            },

                            {
                             'parentId': {
                                $exists: false
                              } 
                            },
                            {
                              deleted: false
                            }
                        ],
            };
    
            const fileFeed = await FileModel.aggregate([
                                                { $match: match },
                                                {
                                                    $sort: {
                                                    'createdAt': -1,
                                                    },
                                                },
                                                {
                                                    $limit: limit + 1,
                                                },
                                                ]).exec() as IFile[];

            

            return fileFeed ; 

        } catch (error) {
            return error as BasicError; 
        }
    }

    getRecentlyDeleted = async (userId: string, limit: number, cursor: string | null): Promise<IFile[] | BasicError> => {
        try {
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
                            'ownerId': new ObjectID(userId)
                            },

                            {
                             'deleted': true
                            }
                        ],
            };

            const fileFeed: IFile[] = await FileModel.aggregate([
                                                { $match: match },
                                                {
                                                    $sort: {
                                                    'createdAt': -1,
                                                    },
                                                },
                                                {
                                                    $limit: limit + 1,
                                                },
                                                ]);
            return fileFeed; 

        } catch (error) {
            return error as BasicError; 
        }
    }

    getStarredFiles = async (userId: string, limit: number, cursor: string | null): Promise<IFile[] | BasicError> => {
        try {
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
                            'ownerId': new ObjectID(userId)
                            },

                            {
                            'starred': true
                            }
                        ],
            };

            const fileFeed = await FileModel.aggregate([
                                                { $match: match },
                                                {
                                                    $sort: {
                                                    'createdAt': -1,
                                                    },
                                                },
                                                {
                                                    $limit: limit + 1,
                                                },
                                                ]).exec() as IFile[];
            return fileFeed; 

        } catch (error) {
            return error as BasicError; 
        }
    }

	getFilesByMatchingPattern = async (userId: string, pattern: string): Promise<IFile[] | BasicError> => {
    try { 
        const regex = new RegExp(pattern); 
        const files = await FileModel.find({ownerId: userId,name:{$regex: regex, $options : 'ix'}}); 
        const fileList = files.map((file) => {
            return file.toObject(); 
        })
        return fileList as IFile[]; 
      return []
    } catch (error) {
      return error as BasicError;
    }
  };

    setDeletedTrue = async (fileId: string, ownerId: string): Promise<ISuccess | BasicError> => {
        try {
            const updated = await FileModel.updateOne({_id: fileId, ownerId}, 
                                                                    {
                                                                      deleted: true
                                                                    }) as UpdatedDocument; 
           if (updated instanceof BasicError) throw (updated); 
           return {success:true}; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    setDeletedFalse = async (fileId: string, ownerId: string): Promise<ISuccess | BasicError> => {
        try {
            const updated = await FileModel.updateOne({_id: fileId, ownerId}, 
                                                                    {
                                                                      deleted: false
                                                                    }) as UpdatedDocument; 
           if (updated instanceof BasicError) throw (updated); 
           return {success:true}; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    starFile = async (fileId: string, ownerId: string): Promise<ISuccess | BasicError> => {
        try {
            const updated = await FileModel.updateOne({_id: fileId, ownerId}, 
                                                                    {
                                                                      starred: true
                                                                    }) as UpdatedDocument; 
           if (updated instanceof BasicError) throw (updated); 
           return {success:true}; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    unstarFile = async (fileId: string, ownerId: string): Promise<ISuccess | BasicError> => {
        try {
            const updated = await FileModel.updateOne({_id: fileId, ownerId}, 
                                                                    {
                                                                      starred: false
                                                                    }) as UpdatedDocument; 
           if (updated instanceof BasicError) throw (updated); 
           return {success:true}; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    renameFile = async (fileId: string, ownerId: string, name: string): Promise<ISuccess | BasicError> => {
        try {
            const updated = await FileModel.updateOne({_id: fileId}, {name}) as UpdatedDocument; 
            if (updated instanceof BasicError) throw (updated); 
            return {success:true}; 
         } catch (error) { 
            return error as BasicError; 
         }   
    }


    getFile = async (ownerId: string, fileId: string): Promise<IFile | BasicError> => {
        try { 
            const res = await FileModel.findOne({_id: fileId, ownerId}) 
            return (res.toObject() as IFile); 
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

export default MongoDBFileRepo; 

