import { BasicError, ISuccess } from "../__shared__/error";
import { IReactionsRepo, IReactions } from "../__shared__/interfaces";
import MongoDBReactionsRepo from "../__shared__/reactions.repo";
import { StatusModel } from './status.model';

class StatusHelper {

    private statusReactions: IReactionsRepo; 
    constructor (private readonly mongoReactionRepo?: MongoDBReactionsRepo<typeof StatusModel>) {
        if (mongoReactionRepo !== undefined) this.statusReactions = mongoReactionRepo; 
    }

    hasReacted = (reactions: IReactions, userId: string): string | BasicError => {
        try {
            return this.statusReactions.hasReacted(reactions,userId);
        } catch (error) {
            return error as BasicError; 
        }
    }

    heartReaction = async (thndrId: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            return await this.statusReactions.heartReaction(thndrId,userId);
        } catch (error) {
            return error as BasicError; 
        }
    }
    
    removeHeartReaction = async (thndrId: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            return await this.statusReactions.removeHeartReaction(thndrId,userId);
        } catch (error) {
            return error as BasicError; 
        }
    }
    
    thumbsUpReaction = async (thndrId: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            return await this.statusReactions.thumbsUpReaction(thndrId,userId);
        } catch (error) {
            return error as BasicError; 
        }
    }
    
    removeThumbsUpReaction = async (thndrId: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            return await this.statusReactions.removeThumbsUpReaction(thndrId,userId);
        } catch (error) {
            return error as BasicError; 
        }
    }

    thumbsDownReaction = async (thndrId: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            return await this.statusReactions.thumbsDownReaction(thndrId,userId);
        } catch (error) {
            return error as BasicError; 
        }
    }

    removeThumbsDownReaction = async (thndrId: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            return await this.statusReactions.removeThumbsDownReaction(thndrId,userId);
        } catch (error) {
            return error as BasicError; 
        }
    }

    prayReaction = async (thndrId: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            return await this.statusReactions.prayReaction(thndrId,userId);
        } catch (error) {
            return error as BasicError; 
        }
    }

    removePrayReaction = async (thndrId: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            return await this.statusReactions.removePrayReaction(thndrId,userId);
        } catch (error) {
            return error as BasicError; 
        }
    }

    raisedHandsReaction = async (thndrId: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            return await this.statusReactions.raisedHandsReaction(thndrId,userId);
        } catch (error) {
            return error as BasicError; 
        }
    }

    removeRaisedHandsReaction = async (thndrId: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            return await this.statusReactions.removeRaisedHandsReaction(thndrId,userId);
        } catch (error) {
            return error as BasicError; 
        }
    }

}   

export default StatusHelper; 