import { IUserRepo } from '../user/interfaces';
import BaseRepo from '../__shared__/baseRepo';
import { BasicError, 
         ISuccess } from '../__shared__/error';
import { ICloudServiceRepo, 
         IFileRepo, 
         IReactionsRepo } from '../__shared__/interfaces';
import { INotificationRepo } from '../__shared__/notification/interface';
import { IStatusComment, 
         IStatusCommentConnection, 
         IStatusCommentInput, 
         IStatusConnection, 
         IStatusRepo, 
         IThndr, 
         IThndrConnection } from './interfaces';

class StatusController extends BaseRepo {

    private statusRepo: IStatusRepo; 
    private reactionRepo: IReactionsRepo; 
    private userRepo: IUserRepo; 
    public notifRepo: INotificationRepo;
    public cloudRepo: ICloudServiceRepo; 
    public blobRepo: IFileRepo; 
 
    
    constructor (status: IStatusRepo, user: IUserRepo, reaction: IReactionsRepo, blob: IFileRepo, cloud: ICloudServiceRepo, notif: INotificationRepo) {
        super();
        // database management system 
        this.statusRepo = status;
        this.userRepo = user; 
        this.reactionRepo = reaction; 
        this.blobRepo = blob; 
        // Cloudfront 
        this.cloudRepo = cloud;
        this.notifRepo = notif; 
    }
    
    findStatus = async (statusId: string): Promise<IThndr | BasicError> => {
        try {
            const res = await this.statusRepo.getThndr(statusId); 
            if (res instanceof Error) throw (res); 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }
    
    createThndr = async (text: string, keys: string[], userId: string): Promise<IThndr | BasicError> => {
        try {
            const res = await this.statusRepo.createThndr(text,keys,userId); 
            if (res instanceof BasicError) throw (res); 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    createStatusConnection = async (userId: string, cursor: string | null, limit: number): Promise<IStatusConnection | BasicError> => {
        try {
            const { findUser } = this.userRepo;
            const statusFeed = await this.statusRepo.getStatusFeed(userId,cursor,limit,findUser); 
            if (statusFeed instanceof BasicError) throw (statusFeed); 
            const hasNextPage = statusFeed.length > limit;
            const edges = hasNextPage ? statusFeed.slice(0, -1) : statusFeed;
            return {    
                    edges,
                    pageInfo: {
                        hasNextPage,
                        endCursor: this.toCursorHash(
                            edges[edges.length - 1]?.createdAt.toString(),
                        ),
                    }
                   };
        } catch (error) {
            console.log('the error ',error)
            return error as BasicError; 
        }
    }

    pickReaction = async (thndrId: string, type: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            switch (true) {
                case type === 'heart':
                    return await this.reactionRepo.heartReaction(thndrId,userId);
                case type === 'thumbsup':
                    return await this.reactionRepo.thumbsUpReaction(thndrId,userId);
                case type === 'thumbsdown':
                    return await this.reactionRepo.thumbsDownReaction(thndrId,userId);
                case type === 'pray':
                    return await this.reactionRepo.prayReaction(thndrId,userId);
                case type === 'raised_hands':
                    return await this.reactionRepo.raisedHandsReaction(thndrId,userId);
                default: 
                    throw new BasicError();
            }
        } catch (error) {
            return error as BasicError; 
        }
    }

    removeReaction = async (thndrId: string, type: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            switch (true) {
                case type === 'heart':
                    return await this.reactionRepo.removeHeartReaction(thndrId,userId);
                case type === 'thumbsup':
                    return await this.reactionRepo.removeThumbsUpReaction(thndrId,userId);
                case type === 'thumbsdown':
                    return await this.reactionRepo.removeThumbsDownReaction(thndrId,userId);
                case type === 'pray':
                    return await this.reactionRepo.removePrayReaction(thndrId,userId);
                case type === 'raised_hands':
                    return await this.reactionRepo.removeRaisedHandsReaction(thndrId,userId);
                default: 
                    throw new BasicError();
            }
        } catch (error) {
            return error as BasicError; 
        }
    }
   
    deleteThndr = async (thndrId: string): Promise<ISuccess | BasicError>  => {
        try { 
            const thndr = await this.statusRepo.getThndr(thndrId);  
            if (thndr instanceof BasicError) throw (thndr);
            const { fileKeys } = thndr; 
            if (fileKeys && fileKeys !== undefined && fileKeys.length > 0) {
                const deleteRes = this.deleteThndrFiles(fileKeys); 
                if (deleteRes instanceof BasicError) throw (deleteRes); 
            }
            const deleted = await thndr.remove(); 
            if ('_id' in deleted) return {success:true}; 
            else throw (new BasicError()); 
        } catch (error) {
            return error as BasicError; 
        }
    } 

    deleteThndrFiles = (keys: string[]): ISuccess | BasicError => {
        try {
            keys.forEach((key: string) => {
               const res = this.blobRepo.deleteFile(key); 
               if (res instanceof BasicError) throw (res); 
            }); 
            return {success:true}; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    getThndrFeed = async (userId: string, cursor: string, limit: number): Promise<IThndrConnection | BasicError> => {
        try {
            const { findUser } = this.userRepo;
            const thndrFeed = await this.statusRepo.getThndrFeed(userId,cursor,limit,findUser); 
            if (thndrFeed instanceof Error) throw (thndrFeed);
            const hasNextPage = thndrFeed.length > limit;
            const edges = hasNextPage ? thndrFeed.slice(0, -1) : thndrFeed;
            return  {
                        edges,
                        pageInfo: {
                            hasNextPage,
                            endCursor: this.toCursorHash(
                                edges[edges.length - 1]?.createdAt.toString(),
                            ),
                        }
                    }; 
        } catch (error) {
            return error as BasicError; 
        } 
    }

    queryOwnerData = async (userId: string): Promise<{_id: string, name: string, username: string, avatar: string}| BasicError> => {
        try {  
            const { findUser } = this.userRepo; 
            const owner = await this.statusRepo.getThndrOwner(userId,findUser); 
            if (owner instanceof BasicError) throw (owner); 
            // const avatar = this.cloudRepo.getUrl(owner.avatar);
            const { _id, name, username, avatar } = owner; 
            return { _id, name, username, avatar }
        } catch (error) {
            return error as BasicError; 
        }
    }


    createComment = async (userId: string, input: IStatusCommentInput): Promise<IStatusComment | BasicError> => {
        try {
            const res = await this.statusRepo.createComment(userId,input); 
            if (res instanceof Error) throw (res);
            return res;  
        } catch (error) {
            return error as BasicError; 
        }
    }
    
    getStatusComments = async (statusId: string, limit: number, cursor: string | null) => {
        try {
            const res = await this.statusRepo.getComments(statusId,limit,cursor); 
            if (res instanceof Error) throw (res); 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    getAllComments = async (statusId: string): Promise<IStatusComment[] | BasicError> => {
        try { 
            const res = await this.statusRepo.getAllComments(statusId); 
            if (res instanceof Error) throw (res); 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    deleteStatusComment = async (commentId: string): Promise<ISuccess | BasicError> => {
        try { 
            const res = await this.statusRepo.deleteComment(commentId); 
            if (res instanceof Error) throw (res);
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }

}

export default StatusController; 