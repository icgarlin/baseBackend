import { Service } from 'typedi';
import { BasicError, 
         ErrorCode, 
         ISuccess } from '../error';
import { UpdatedDocument } from '../interfaces';
import { INotification, 
         INotificationConnection, 
         INotificationRepo, 
         NOTIFICATIONS } from './interface';
import { INotificationModel, 
         NotificationModel } from './notification.model';




@Service()
class MongoDBNotificationRepo implements INotificationRepo {
    private fromCursorHash = (cursor: string): string => Buffer.from(cursor, 'base64').toString('ascii');
    toCursorHash = (cursor: string): string => cursor ? Buffer.from(cursor).toString('base64') : ''
    createNotification = async (from: string, usersTo: string[], type: NOTIFICATIONS): Promise<INotification | BasicError> => {
        try {

    
                const res = await NotificationModel.create({
                                                            from,
                                                            usersTo, 
                                                            seen: false,
                                                            type, 
                                                            createdAt: new Date()
                                                          }); 
                                    
                const notification = res.toObject();
                delete notification.__v;  
                return notification as INotification; 
        
        } catch (error) {
            return error as BasicError; 
        }
    }

    getNotifications = async (to: string, limit: number, cursor: string | null): Promise<INotificationConnection | BasicError> => {
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
                             'usersTo': {
                                $in: [to.toString()]
                             }
                            },
                        ],
            };

            const notifications = await NotificationModel.aggregate([
                                                { $match: match },
                                                {
                                                    $sort: {
                                                    createdAt: -1,
                                                    },
                                                },
                                                {
                                                    $limit: limit + 1,
                                                },
                                                ]).exec() as INotificationModel[];
                                            
            // console.log('huh ', notifModels); 
            // const notifications = notifModels.map((model) =>{ return model.toObject() as INotification}); 
            const hasNextPage = notifications.length > limit;
            const edges = hasNextPage ? notifications.slice(0, -1) : notifications;
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

    markAsSeen = async (notificationId: string): Promise<ISuccess | BasicError> => {
        try { 
            const res = await NotificationModel.updateOne({_id: notificationId}, {
                                                                                'seen': true
                                                                             }) as UpdatedDocument; 
            if (res.nModified === 1) {
              return {success:true};
            } else throw (new BasicError(ErrorCode.BadRequest,`Could not mark notification as seen`))
        } catch (error) {
            return error as BasicError; 
        }
    }


    removeNotification = async (id: string): Promise<ISuccess | BasicError> => {
        try {
            const res = await NotificationModel.deleteOne({_id: id});
            if (res.deletedCount === 1) return {success:true};
            else throw (res);
        } catch (error) {
            return error as BasicError; 
        }
    }

    markNotifComplete = async (id: string): Promise<ISuccess | BasicError> => {
        try {
            const res = await NotificationModel.updateOne({_id: id}, {
                                                            'complete': true
                                                        }) as UpdatedDocument; 
            if (res.nModified === 1) {
            return {success:true};
            } else throw (new BasicError(ErrorCode.BadRequest,`Could not mark notification as seen`))
        } catch (error) {
            return error as BasicError; 
        }
    }   
}


export default MongoDBNotificationRepo; 