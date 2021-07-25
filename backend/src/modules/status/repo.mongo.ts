import { Service } from 'typedi';
import { IUser } from '../user/interfaces';
import { BasicError, 
         ErrorCode, 
         ISuccess } from '../__shared__/error';
import { UpdatedDocument } from '../__shared__/interfaces';
import { StatusCommentModel } from './comment.model';
import { IStatusCommentInput, 
         IStatusComment, 
         IStatusCommentConnection, 
         IStatusRepo, 
         IThndr } from './interfaces';
import StatusHelper from './status.helper';
import { IThndrModel, 
         StatusModel } from './status.model';
import { StatusList } from './types';

 
@Service()
class MongoDBStatusRepo extends StatusHelper implements IStatusRepo { 
    private fromCursorHash = (cursor: string): string => Buffer.from(cursor, 'base64').toString('ascii');
    toCursorHash = (cursor: string): string => cursor ? Buffer.from(cursor).toString('base64') : '';
    createThndr = async (text: string, keys: string[], userId: string): Promise<IThndr | BasicError> => {
        try {
            const thndr = await StatusModel.create({
                                                     isReverb: false, 
                                                     text: text ? text : '',
                                                     fileKeys: (keys && keys.length > 0) ? keys : [],
                                                     userId: userId,
                                                   });
            if (thndr instanceof BasicError) throw (thndr);  
            return thndr.toObject() as IThndr; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    getStatusFeed = async (userId: string, cursor: string | null, limit: number, findUser: (userId: string) => Promise<IUser | BasicError>): Promise<StatusList | BasicError> => {
        try {
            const user = await findUser(userId); 
            if (!user) throw (new BasicError(ErrorCode.NotFound));
            if (user instanceof BasicError) throw (user); 
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
                    $or:[
                        {
                            'userId': {
                                $in: [...user.followingIds, user._id],
                            },
                            },

                            {
                            'reverb.userId': {
                                $in: [...user.followingIds, user._id],
                            }
                            },
                        ],
            };

            const statusFeed = await StatusModel.aggregate([
                                                { $match: match },
                                                {
                                                    $sort: {
                                                    createdAt: -1,
                                                    },
                                                },
                                                {
                                                    $limit: limit + 1,
                                                },
                                                ]).exec() as StatusList;
            return statusFeed; 

        } catch (error) {
            return error as BasicError; 
        }
    }
    
    getThndrFeed = async (userId: string, cursor: string | null, limit: number, findUser: (userId: string) => Promise<IUser | BasicError>): Promise<IThndr[] | BasicError> => {
      try {
            const user = await findUser(userId); 
            if (!user) throw (new BasicError(ErrorCode.NotFound));
            if (user instanceof BasicError) throw (user); 
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
                            'userId': {
                                   $in: [...user.followingIds, user._id],
                                },
                            },

                            {
                            'isReverb': false
                            }
                        ],
            };

            const thndrFeed = await StatusModel.aggregate([
                                                { $match: match },
                                                {
                                                    $sort: {
                                                    createdAt: -1,
                                                    },
                                                },
                                                {
                                                    $limit: limit + 1,
                                                },
                                                ]).exec() as IThndr[];
            if (thndrFeed instanceof Error) throw (thndrFeed);  
            return thndrFeed; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    getThndr = async (thndrId: string): Promise<IThndrModel | BasicError> => {
        try {
            const thndr = await StatusModel.findById(thndrId);
            if (thndr instanceof BasicError) throw (thndr); 
            return thndr; 
        } catch (error) {
            console.log('our errro after finding ', error);
            return error as BasicError; 
        }
    }

    getThndrOwner = async (userId: string, findUser: (userId: string) => Promise<IUser | BasicError>): Promise<{_id: string, username: string, name: string, avatar: string} | BasicError> => {
        try {
            const user = await findUser(userId); 
            if (!user) throw (new BasicError(ErrorCode.NotFound))
            if (user instanceof BasicError) throw (user); 
            return { _id: user._id, username: user.username, name: user.name, avatar: user.avatar }; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    likeThndrById = async (thndrId: string, ownerId: string): Promise<ISuccess | BasicError>=> {
        try {
            const updated = await StatusModel.updateOne(
                                                            {
                                                            _id:thndrId
                                                            },
                                                            { $push: { likeIds: ownerId } },
                                                        
                                                        ) as UpdatedDocument;
            if (updated.nModified === 1) return {success:true}; 
            else throw (new BasicError()); 
        } catch (error) {
            return error as BasicError
        }
    }

    unlikeThndrById = async (thndrId: string, ownerId: string): Promise<ISuccess | BasicError>=> {
        try {
            const updated = await StatusModel.updateOne(
                                                        {
                                                        _id: thndrId
                                                        },
                                                        { $pull: { likeIds: ownerId } },
                                                    
                                                    ) as UpdatedDocument;
            if (updated.nModified === 1) return {success:true}; 
            else throw (new BasicError()); 
        } catch (error) {
            return error as BasicError
        }
    }


    



    createComment = async (userId: string, input: IStatusCommentInput): Promise<IStatusComment | BasicError> => {
        try {
            const { statusId, fileKeys, text } = input; 
            if (fileKeys === undefined && text !== undefined) {
                const res = await StatusCommentModel.create({
                                                             statusId,
                                                             userId,
                                                             text,
                                                             createdAt: new Date()
                                                            })
                if (res._id) return (res.toObject() as IStatusComment); 

            } else if (fileKeys !== undefined && text === undefined) {
                const res = await StatusCommentModel.create({
                                                             statusId,
                                                             userId,
                                                             fileKeys,
                                                             createdAt: new Date()
                                                            })
                if (res._id) return (res.toObject() as IStatusComment); 
            } else if (fileKeys !== undefined && text !== undefined) {
                const res = await StatusCommentModel.create({
                                                             statusId,
                                                             userId,
                                                             fileKeys,
                                                             text,
                                                             createdAt: new Date()
                                                            }) 
                if (res._id) return (res.toObject() as IStatusComment); 
            } else {
                throw new BasicError(ErrorCode.UserInputError,`Comments must have text or files`); 
            }
        } catch (error) {
            return error as BasicError; 
        }
    }

    getComments = async (statusId: string, limit: number, cursor: string | null): Promise<IStatusCommentConnection | BasicError> => {
        try {
            const cursorTime = (cursor !== null && cursor !== 'null') ? new Date(this.fromCursorHash(cursor)) : null;

            const match = {
                            // no cursor is needed for the first query
                        ...(cursorTime && {
                            timestamp: {
                            $lt: cursorTime, //MORA NEW DATE(), sa toISOString ne radi
                            },
                        }),
                        $and:[
                                {
                                  statusId
                                },
                             
                            ],
                       };
            const comments = await StatusCommentModel.aggregate([
                                                { $match: match },
                                                {
                                                    $sort: {
                                                      createdAt: 1,
                                                    },
                                                },
                                                {
                                                   $limit: limit + 1,
                                                }
                                                ]).exec() as IStatusComment[];
                
            const hasNextPage = comments.length > limit;
            const edges = hasNextPage ? comments.slice(0, -1) : comments;
            return {    
                    edges,
                    pageInfo: {
                        hasNextPage,
                        endCursor: this.toCursorHash(
                            edges[edges.length - 1]?.createdAt.toString(),
                        ),
                    }
            }
        } catch (error) {
            return error as BasicError; 
        }
    }


    getAllComments = async (statusId: string): Promise<IStatusComment[] | BasicError> => {
        try { 
            const comments = await StatusCommentModel.find({statusId}).exec() as IStatusComment[]; 
            return comments; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    deleteComment = async (commentId: string): Promise<ISuccess | BasicError> => {
        try { 
            const deleted = await StatusCommentModel.deleteOne({_id: commentId})
            if (deleted.deletedCount === 1) return {success:true};
            else throw (new BasicError(ErrorCode.BadRequest,`Could not delete comment`));  
        } catch (error) {
            return error as BasicError; 
        }
    }

}

export default MongoDBStatusRepo; 