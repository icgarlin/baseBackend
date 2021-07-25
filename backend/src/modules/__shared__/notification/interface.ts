import { BasicError, 
         ISuccess } from '../error';
import { IPageInfo } from '../interfaces';
import { INotificationModel } from './notification.model';

export interface INotificationRepo {
 createNotification: (from: string, usersTo: string[], type: NOTIFICATIONS) => Promise<INotification | BasicError>; 
 getNotifications: (to: string, limit: number, cursor: string | null) => Promise<INotificationConnection | BasicError>; 
 markAsSeen: (notificationId: string) => Promise<ISuccess | BasicError>;
 removeNotification: (id: string) => Promise<ISuccess | BasicError>; 
 markNotifComplete: (id: string) => Promise<ISuccess | BasicError>; 
}

export interface INotification {
 _id: INotificationModel['_id']; 
 from: INotificationModel['from']; 
 usersTo: INotificationModel['usersTo']; 
 type: INotificationModel['type']; 
 seen: INotificationModel['seen'];
 complete: INotificationModel['complete'];  
 createdAt: INotificationModel['createdAt']; 
}

export interface INotificationConnection {
  edges: INotification[]; 
  pageInfo: IPageInfo; 
}

export enum NOTIFICATIONS {
  FOLLOW = 'FOLLOW', 
  CONNECTION_REQUEST = 'CONNECTION_REQUEST', 
  CONNECTION_ACCEPT = 'CONNECTION_ACCEPT',
  STATUS_COMMENT = 'STATUS_COMMENT'
}