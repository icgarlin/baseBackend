import { ISuccess, BasicError } from './error';
import { IReactions, UpdatedDocument } from './interfaces';
import { ReactionModel } from './types';
import { Model } from 'mongoose';
import { Service } from 'typedi';

@Service()
class MongoDBReactionsRepo<T extends Model<ReactionModel>> {
    private model: T; 
    // Returns the reaction type if a reaction was added by user, 
    // if not it returns an empty string 
    hasReacted = (reactions: IReactions, userId: string): string | BasicError => {
        try {  
              for (const [type, userIds] of Object.entries(reactions)) {
                if (userIds !== undefined && (userIds as string[]).length > 0) {
                  const hasReacted = (userIds as string[]).includes(userId);
                  if (hasReacted) return type; 
                }
              }
              return ''; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    heartReaction = async (_id: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            const updatedStatus = await this.model.updateOne({ _id}, {
                                                                $push: {
                                                                    'reactions.heart': userId
                                                                }
                                                                }) as UpdatedDocument;
            if (updatedStatus.nModified !== 1) throw (new BasicError());
            else return {success:true};
        } catch (error) {
            return error as BasicError; 
        }
    }

    removeHeartReaction = async (_id: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            const updatedStatus = await this.model.updateOne({_id}, {
                                                                    $pull: {
                                                                        'reactions.heart': userId
                                                                    }
                                                                 }) as UpdatedDocument;
            if (updatedStatus.nModified !== 1) throw (new BasicError());
            else return {success:true};
        } catch (error) {
            return error as BasicError; 
        }
    }


    thumbsUpReaction = async (_id: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            const updatedStatus = await this.model.updateOne({_id}, {
                                                                            $push: {
                                                                                'reactions.thumbsup': userId
                                                                            }
                                                                        }) as UpdatedDocument;
            if (updatedStatus.nModified !== 1) throw (new BasicError());
            else return {success:true};
        } catch (error) {
            return error as BasicError; 
        }
    }

    removeThumbsUpReaction = async (_id: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            const updatedStatus = await this.model.updateOne({_id}, {
                                                                            $pull: {
                                                                                
                                                                             'reactions.thumbsup': userId 
                                                                            }
                                                                       }) as UpdatedDocument;
            if (updatedStatus.nModified !== 1) throw (new BasicError());
            else return {success:true};
        } catch (error) {
            return error as BasicError; 
        }
    }

    thumbsDownReaction = async (_id: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            const updatedStatus = await this.model.updateOne({_id}, {
                                                                    $push: {
                                                                        'reactions.thumbsdown': userId
                                                                    }
                                                                 }) as UpdatedDocument ;
            if (updatedStatus.nModified !== 1) throw (new BasicError());
            else return {success:true};
        } catch (error) {
            return error as BasicError; 
        }
    }

    removeThumbsDownReaction = async (_id: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            const updatedStatus = await this.model.updateOne({_id}, {
                                                                $pull: {
                                                                    'reactions.thumbsdown': userId
                                                                }
                                                              }) as UpdatedDocument;
            if (updatedStatus.nModified !== 1) throw (new BasicError());
            else return {success:true};
        } catch (error) {
            return error as BasicError; 
        }
    }

    prayReaction = async (_id: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            const updatedStatus = await this.model.updateOne({_id}, {
                                                                    $push: {
                                                                        'reactions.pray': userId
                                                                    }
                                                                 }) as UpdatedDocument;
            if (updatedStatus.nModified !== 1) throw (new BasicError());
            else return {success:true};
        } catch (error) {
            return error as BasicError; 
        }
    }

    removePrayReaction = async (_id: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            const updatedStatus = await this.model.updateOne({_id}, {
                                                                    $pull: {
                                                                        'reactions.pray': userId
                                                                    }
                                                                }) as UpdatedDocument;
            if (updatedStatus.nModified !== 1) throw (new BasicError());
            else return {success:true};
        } catch (error) {
            return error as BasicError; 
        }
    }


    raisedHandsReaction = async (_id: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            const updatedStatus = await this.model.updateOne({_id}, {
                                                                $push: {
                                                                    'reactions.raised_hands': userId
                                                                }
                                                             }) as UpdatedDocument;
            if (updatedStatus.nModified !== 1) throw (new BasicError());
            else return {success:true};
        } catch (error) {
            return error as BasicError; 
        }
    }

    removeRaisedHandsReaction = async (_id: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            const updatedStatus = await this.model.updateOne({_id}, {
                                                                    $pull: {
                                                                        'reactions.raised_hands': userId
                                                                    }
                                                                }) as UpdatedDocument;
            if (updatedStatus.nModified !== 1) throw (new BasicError());
            else return {success:true};
        } catch (error) {
            return error as BasicError; 
        }
    }

}

export default MongoDBReactionsRepo; 