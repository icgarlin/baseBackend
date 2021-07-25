import { NOTIFICATIONS } from './interface';
import mongoose, { Document, 
                   Model, 
                   Schema } from 'mongoose';

export interface INotificationModel extends Document { 
  _id: string; 
  from: string; 
  usersTo: string[]; 
  type: NOTIFICATIONS; 
  seen: boolean; 
  complete: boolean; 
  createdAt: Date; 
}



const notificationSchema = new Schema({
    from: {
      type: String, 
      required: true
    },
    usersTo: [{
      type: String, 
      required: true
    }],
    type: {
      type: NOTIFICATIONS, 
      required: true
    },
    seen: {
      type: Boolean, 
      required: true
    },
    complete: {
      type: Boolean,
      required: true
    },
    createdAt: {
      type: Date, 
      required: true
    }
})



export const NotificationModel: Model<INotificationModel> = mongoose.model<INotificationModel>('NotificationModel', notificationSchema, 'notifications');