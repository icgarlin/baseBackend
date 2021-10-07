import 'reflect-metadata';
import MongoDBUserRepo from './repo.mongo';
import { Login, 
         User } from './schema';
import { NotificationOrErrorUnion, 
         SuccessOrErrorUnion, 
         UserListOrErrorUnion,
         UserOrErrorUnion} from '../__shared__/types.resolver';
import { EditInfoInput, 
         Registration } from './input.resolve';
import { LoginOrErrorUnion } from './types.resolve';
import { Service } from 'typedi';
import { UserController } from './controller';
import { GenericError } from '../__shared__/schema';
import { BasicError } from '../__shared__/error';
import { CloudFrontRepo } from '../__shared__/aws/cloudfront';
import AccountLoginHelper from './account.helper';
import AdminRepo from '../__shared__/admin/admin.repo';
import { Arg, 
         Resolver, 
         Mutation, 
         Query, 
         ID, 
         Ctx,
         PubSub,
         Publisher,
         Subscription,
         Root} from 'type-graphql';
import { NOTIFICATIONS } from '../__shared__/notification/interface';
import { Notification } from '../__shared__/notification/schema'; 
import { Context } from '../__shared__/interfaces';
import MongoDBNotificationRepo from '../__shared__/notification/mongo.repo';


@Service()
@Resolver(() => User)
export class UserResolver {

  private userControl: UserController; 
  constructor (private readonly mongoUserRepo: MongoDBUserRepo,
               private readonly cloudFront: CloudFrontRepo,
               private readonly helper: AccountLoginHelper, 
               private readonly admin: AdminRepo,
               private readonly notifications: MongoDBNotificationRepo) {

    this.userControl = new UserController(mongoUserRepo,
                                          cloudFront,
                                          helper,
                                          admin,
                                          notifications);
  }

  @Mutation(() => SuccessOrErrorUnion)
  async editInfo(
    @Arg('userId', () => ID, {nullable: false}) userId: string, 
    @Arg('info', () => EditInfoInput, {nullable: false}) info: EditInfoInput
  ): Promise<typeof SuccessOrErrorUnion> {
    try {
      const res = await this.userControl.editUserInfo(userId,info); 
      if (res instanceof Error) throw (res); 
      return {success: res}; 
    } catch (error) {
        if (error instanceof Error) {
          return error as GenericError; 
        } 
    }
  }

  // FIXME: fix to include getting all server info 
  // or direct message info 
  @Query(() => UserOrErrorUnion)
  async getInfo(
    @Arg('username', () => String, {nullable: false}) username: string
  ): Promise<typeof UserOrErrorUnion> {
   try {
        // Function returns error if both userId & username 
        // are undefined/null
        const res = await this.userControl.getInfo(username);
        if (res instanceof BasicError) throw (res);

        return {
          ...res,
          cloudService: this.cloudFront
        }; 
   } catch (error) {
      return error as GenericError; 
   }
  }

  @Mutation(() => LoginOrErrorUnion)
  async login(
    @Arg('username', () => String, {nullable: false}) username: string,
    @Arg('password',() => String, {nullable: false}) password: string,
    // @Root() user: User,
  ): Promise<typeof LoginOrErrorUnion> {
    try {
       const resp = await this.userControl.login(username,password);
       if (resp instanceof BasicError) throw (resp); 
       const login: Login = {
         user: {  
             // ...user,
             ...resp.user,
             cloudService: this.cloudFront
         },
         accessToken: resp.accessToken
       }

       return login; 
    } catch (error) {
        console.log('the errror ', error);
        return error as GenericError; 
    }
  }

  @Mutation(() => LoginOrErrorUnion)
  async register(
    @Arg('registration', () => Registration, {nullable: false}) registration: Registration,
    @Ctx() context: Context
  ): Promise<typeof LoginOrErrorUnion> {
    try {
      console.log('hc ', context); 
      console.log('input ', registration); 
      const registerRes = await this.userControl.register(registration);
      if ('code' in registerRes || registerRes instanceof Error) throw (registerRes);
      const { user, accessToken } = registerRes; 
      const register: Login = { 
        user: {
          ...user, 
          cloudService: this.cloudFront
        },
        accessToken
      }
      return register; 
    } catch (error) {
        console.log('the error ', error); 
        if (error instanceof BasicError) {
          const { code, message } = error as GenericError; 
          return {
            name: 'RegisterError', 
            code,
            message,
            path: 'register'
          }
        }
        return error as GenericError; 
    }
  }
  
  @Mutation(() => SuccessOrErrorUnion)
  async sendConnectRequest(
    @Arg('connectId', () => String, {nullable: false}) connectId: string, 
    @Ctx() context: Context,
    @PubSub(NOTIFICATIONS.CONNECTION_REQUEST) connectRequest: Publisher<Notification>
  ): Promise<typeof SuccessOrErrorUnion> {
      try {
        const { user } = context; 
        const { _id } = user; 
        const res = await this.userControl.notification.createNotification(_id,[connectId],NOTIFICATIONS.CONNECTION_REQUEST); 
        if (res instanceof Error) throw (res); 
        await connectRequest(res); 
        return {success:true}; 
      } catch (error) {
          return error as GenericError; 
      }
  }

  @Mutation(() => SuccessOrErrorUnion)
  async acceptConnectRequest(
    @Arg('connectId', () => String, {nullable: false}) connectId: string,
    @Ctx() context: Context
  ): Promise<typeof SuccessOrErrorUnion> {
    try {
      const { user } = context; 
      const { _id } = user; 
      const res = await this.userControl.acceptConnectRequest(_id,connectId); 
      if (res instanceof Error) throw (res); 

    } catch (error) {
        return error as GenericError; 
    }
  }

  @Subscription(() => NotificationOrErrorUnion, {
    topics: [NOTIFICATIONS.CONNECTION_REQUEST]
  })
  followAndConnectRequest( 
     @Root() input: Notification, 
     @Ctx() context: Context
   ): typeof NotificationOrErrorUnion {
     try {
       console.log('our input 1', input)
       const { user } = context; 
       const { _id } = user; 
       const { usersTo } = input; 
       if (usersTo.includes(_id)) {
         return input; 
       } else {
         return null; 
       }
     } catch (error) {  
        return error as GenericError; 
     }
  }

  @Query(() => UserListOrErrorUnion)
  async getConnections(
    @Ctx() context: Context
  ): Promise<typeof UserListOrErrorUnion> {
    try {
      const { user } = context; 
      const { _id } = user; 
      const res = await this.userControl.getConnections(_id); 
      if (res instanceof Error) throw (res); 
      return {users:res}; 
    } catch (error) {
        return error as GenericError; 
    }
  }
}

 