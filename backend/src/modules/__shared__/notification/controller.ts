import { Service } from 'typedi';
import { BasicError, ISuccess } from '../error';
import { INotificationConnection,
         INotificationRepo } from './interface';




@Service()
class NotificationController {

    notifControl: INotificationRepo; 
    constructor (notif: INotificationRepo) {
      this.notifControl = notif; 
    }

    markNotificationComplete = async (id: string): Promise<ISuccess | BasicError> => {
        try {
            const res = await this.notifControl.markNotifComplete(id); 
            if (res instanceof Error) throw (res); 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    getNotifications = async (userId: string, limit: number, cursor: string | null): Promise<INotificationConnection | BasicError> => {
        try {
            const notifConnection = await this.notifControl.getNotifications(userId,limit,cursor); 
            if (notifConnection instanceof Error) throw (notifConnection); 
            return notifConnection;  
        } catch (error) {
            return error as BasicError; 
        }
    }

    removeNotification = async (id: string): Promise<ISuccess | BasicError> => {
        try {
            const res = await this.notifControl.removeNotification(id); 
            if (res instanceof Error) throw (res); 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }
}


export default NotificationController; 