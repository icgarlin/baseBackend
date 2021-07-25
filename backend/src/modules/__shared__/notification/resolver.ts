
import { GenericError } from '../schema';
import { Context } from '../interfaces';
import NotifController from '../notification/controller'; 
import { Resolver, 
         Query, 
         Arg, 
         Int,
         Ctx, 
         Mutation} from 'type-graphql';
import MongoDBNotificationRepo from './mongo.repo';
import { NotificationConnectionOrErrorUnion, SuccessOrErrorUnion } from '../types.resolver';
import { Service } from 'typedi';
import { Notification } from './schema'; 
import MongoDBUserRepo from '../../user/repo.mongo';
import { CloudFrontRepo } from '../aws/cloudfront';


@Service()
@Resolver()
export class NotificationResolver {

    private notifControl: NotifController; 
    constructor (private readonly notif: MongoDBNotificationRepo,
                 private readonly userRepo: MongoDBUserRepo,
                 private readonly cloudRepo: CloudFrontRepo) {
     this.notifControl = new NotifController(notif); 
    }

    @Mutation(() => SuccessOrErrorUnion)
    async markNotificationComplete(
        @Arg('id', () => String, {nullable: false}) id: string
    ): Promise<typeof SuccessOrErrorUnion> {
        try {
            const res = await this.notifControl.markNotificationComplete(id); 
            if (res instanceof Error) throw (res); 
            return res; 
        } catch (error) {
            return error as GenericError; 
        }
    }

    @Mutation(() => SuccessOrErrorUnion) 
    async removeNotification(
      @Arg('notificationId', () => String, {nullable: false}) notificationId: string,
    ): Promise<typeof SuccessOrErrorUnion> {
        try {
            const res = await this.notifControl.removeNotification(notificationId); 
            if (res instanceof Error) {
                throw (res); 
            } else {
                return res; 
            }
        } catch (error) {
            return error as GenericError; 
        }
    }


    @Query(() => NotificationConnectionOrErrorUnion)
    async getNotifications(
        @Arg('limit', () => Int, {nullable: false}) limit: number, 
        @Arg('cursor', () => String) cursor: string | null,
        @Ctx() context: Context
    ): Promise<typeof NotificationConnectionOrErrorUnion> {
        try {
            const { user } = context; 
            const { _id } = user; 
            const res = await this.notifControl.getNotifications(_id,limit,cursor); 
            if (res instanceof Error) throw (res);
            
            res.edges.map((edge) => {
              (edge as Notification).userControl = this.userRepo; 
              (edge as Notification).cloudService = this.cloudRepo; 
            })
            return res; 
        } catch (error) {
            return error as GenericError; 
        }
    }
}

