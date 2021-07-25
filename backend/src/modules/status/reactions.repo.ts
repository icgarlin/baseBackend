import { Service } from 'typedi';
import { BasicError, ISuccess } from '../__shared__/error';
import { IReactions } from '../__shared__/interfaces';
import { StatusModel } from './status.model';

@Service()
class MongoDBStatusReactionsRepo {

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
            const updatedStatus = await StatusModel.updateOne({ _id}, {
                                                                $push: {
                                                                    'reactions.heart': userId
                                                                }
                                                                }) ;
            if (updatedStatus.nModified !== 1) throw (new BasicError());
            else return {success:true};
        } catch (error) {
            return error as BasicError; 
        }
    }

    removeHeartReaction = async (_id: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            const updatedStatus = await StatusModel.updateOne({_id}, {
                                                                    $pull: {
                                                                       'reactions.heart': userId 
                                                                    }
                                                                 }) ;
            if (updatedStatus.nModified !== 1) throw (new BasicError());
            else return {success:true};
        } catch (error) {
            return error as BasicError; 
        }
    }


    thumbsUpReaction = async (_id: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            const updatedStatus = await StatusModel.updateOne({_id}, {
                                                                            $push: {
                                                                                'reactions.thumbsup': userId
                                                                            }
                                                                        }) ;
            if (updatedStatus.nModified !== 1) throw (new BasicError());
            else return {success:true};
        } catch (error) {
            return error as BasicError; 
        }
    }

    removeThumbsUpReaction = async (_id: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            const updatedStatus = await StatusModel.updateOne({_id}, {
                                                                      $pull: {
                                                                        'reactions.thumbsup': userId
                                                                      }
                                                                    });
            if (updatedStatus.nModified !== 1) throw (new BasicError());
            else return {success:true};
        } catch (error) {
            return error as BasicError; 
        }
    }

    thumbsDownReaction = async (_id: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            const updatedStatus = await StatusModel.updateOne({_id}, {
                                                                    $push: {
                                                                        'reactions.thumbsdown': userId
                                                                    }
                                                                 })  ;
            if (updatedStatus.nModified !== 1) throw (new BasicError());
            else return {success:true};
        } catch (error) {
            return error as BasicError; 
        }
    }

    removeThumbsDownReaction = async (_id: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            const updatedStatus = await StatusModel.updateOne({_id}, {
                                                                $pull: {
                                                                    'reactions.thumbsdown': userId
                                                                }
                                                              }) ;
            if (updatedStatus.nModified !== 1) throw (new BasicError());
            else return {success:true};
        } catch (error) {
            return error as BasicError; 
        }
    }

    prayReaction = async (_id: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            const updatedStatus = await StatusModel.updateOne({_id}, {
                                                                    $push: {
                                                                        'reactions.pray': userId
                                                                    }
                                                                 }) ;
            if (updatedStatus.nModified !== 1) throw (new BasicError());
            else return {success:true};
        } catch (error) {
            return error as BasicError; 
        }
    }

    removePrayReaction = async (_id: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            const updatedStatus = await StatusModel.updateOne({_id}, {
                                                                    $pull: {
                                                                        'reactions.pray': userId
                                                                    }
                                                                }) ;
            if (updatedStatus.nModified !== 1) throw (new BasicError());
            else return {success:true};
        } catch (error) {
            return error as BasicError; 
        }
    }


    raisedHandsReaction = async (_id: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            const updatedStatus = await StatusModel.updateOne({_id}, {
                                                                $push: {
                                                                    'reactions.raised_hands': userId
                                                                }
                                                             }) ;
            if (updatedStatus.nModified !== 1) throw (new BasicError());
            else return {success:true};
        } catch (error) {
            return error as BasicError; 
        }
    }

    removeRaisedHandsReaction = async (_id: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            const updatedStatus = await StatusModel.updateOne({_id}, {
                                                                    $pull: {
                                                                        'reactions.raised_hands': userId
                                                                    }
                                                                }) ;
            if (updatedStatus.nModified !== 1) throw (new BasicError());
            else return {success:true};
        } catch (error) {
            return error as BasicError; 
        }
    }

}

export default MongoDBStatusReactionsRepo; 