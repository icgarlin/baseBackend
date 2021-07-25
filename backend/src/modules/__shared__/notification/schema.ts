import { ObjectType, 
         Field, 
         Root,
         registerEnumType, 
         InputType} from 'type-graphql';
import { IUserRepo } from '../../user/interfaces';
import { User, UserList } from '../../user/schema';
import { ICloudServiceRepo } from '../interfaces';
import { GenericError, PageInfo } from '../schema';
import { NotificationInfoOrErrorUnion } from '../types.resolver';
import { NOTIFICATIONS } from './interface';
import { INotificationModel } from './notification.model';




@ObjectType()
export class Notification {
 userControl?: IUserRepo
 cloudService?: ICloudServiceRepo; 
 constructor (userRepo?: IUserRepo, cloudRepo?: ICloudServiceRepo) {
   if (userRepo !== undefined) {
     this.userControl = userRepo; 
   }
   if (cloudRepo !== undefined) {
     this.cloudService = cloudRepo; 
   }
 }
 @Field(() => String, {nullable: false})
 _id: INotificationModel['_id']; 
 @Field(() => String, {nullable: false})
 from: INotificationModel['from']; 
 @Field(() => [String], {nullable: false})
 usersTo: INotificationModel['usersTo']; 
 @Field(() => NOTIFICATIONS, {nullable: false})
 type: INotificationModel['type']; 
 @Field(() => Boolean, {nullable: false})
 seen: INotificationModel['seen'];
 @Field(() => Boolean, {nullable: false})
 complete: INotificationModel['complete'];  
 @Field(() => Date, {nullable: false}) 
 createdAt: INotificationModel['createdAt'];
 @Field(() => NotificationInfoOrErrorUnion, {nullable: false})
 async info?(
   @Root() notif: Notification
 ): Promise<typeof NotificationInfoOrErrorUnion> {
   try {    
        const { usersTo, from, type } = notif; 
        if (this.userControl !== undefined) {
            const { findUser } = this.userControl; 
            const fromUser = await findUser(from); 
            if (fromUser instanceof Error) throw (fromUser); 

            const usersPromise = usersTo.map(async (id) => {
              return await findUser(id); 
            })

            const userList = await Promise.all(usersPromise);  
            const users = userList.map((user) => {
              if ('code' in user) return undefined; 
              const { _id, username, avatar } = user; 
              return {
                _id,
                username,
                avatar,
                cloudService: this.cloudService
              } as User
            })
            
            const { username, avatar } = fromUser; 
            return {
              usersTo: {
                users
              }, 
              from: {
                _id: from,
                username,
                avatar,
                cloudService: this.cloudService
              },
              type, 
            }
        } 
   } catch (error) {
       return error as GenericError; 
   }
 }


}

@ObjectType()
export class NotificationConnection {
  @Field(() => [Notification])
  edges: Notification[]; 
  @Field(() => PageInfo)
  pageInfo: PageInfo; 
}

registerEnumType(NOTIFICATIONS, {
    name: 'Notifications',
}); 



@ObjectType()
export class NotificationInfo { 
  @Field(() => UserList, {nullable: false})
  usersTo: UserList; 
  @Field(() => User, {nullable: false})
  from: User; 
  @Field(() => NOTIFICATIONS, {nullable: false})
  type: NOTIFICATIONS; 
}

@InputType()
export class NotificationInput { 
 @Field(() => String, {nullable: false})
 from: INotificationModel['from']; 
 @Field(() => [String], {nullable: false})
 usersTo: INotificationModel['usersTo']; 
 @Field(() => NOTIFICATIONS, {nullable: false})
 type: INotificationModel['type']; 
 @Field(() => Boolean, {nullable: false})
 seen: INotificationModel['seen']; 
 @Field(() => Date, {nullable: false}) 
 createdAt: INotificationModel['createdAt']; 
}



