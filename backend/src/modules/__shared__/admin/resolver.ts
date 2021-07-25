/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import 'reflect-metadata'; 
import { Resolver, 
         Mutation, 
         Arg, 
         ID, 
         Ctx } from 'type-graphql';
import { Service } from 'typedi';
import MongoDBUserRepo from '../../user/repo.mongo';
import { Context, INodeMailerConfig } from '../interfaces';
import { GenericError, SubscriptionInput } from '../schema';
import { ServerSubscriptionInfoOrErrorUnion, SuccessOrErrorUnion } from '../types.resolver';
import AdminRepo from './admin.repo';
import { AdminController } from './controller';


@Service()
@Resolver()
export class AdminResolver {


    private mailConfig: INodeMailerConfig = {
        host: 'smtp.office365.com',
        secureConnection: true,
        port: 587,
        auth:
         {
            user : 'team@thndr.tv',
            pass : process.env.GODADDY_PASSWORD 
        },
    }
    private adminControl: AdminController; 
    constructor () {
      this.adminControl = new AdminController(new AdminRepo(this.mailConfig), new MongoDBUserRepo())
    }

    @Mutation(() => SuccessOrErrorUnion)
    async sendServerInvitationCode(
      @Arg('emails', () => [String], {nullable: false}) emails: string[], 
      @Arg('serverName', () => String, {nullable: false}) serverName: string, 
      @Arg('serverId', () => String, {nullable: false}) serverId: string, 
      @Arg('adminId', () => ID, {nullable: false}) adminId: string
    ): Promise<typeof SuccessOrErrorUnion> {
        try {
            const res = await this.adminControl.buildServerInviteCodeAndNodeMailerSend(emails,serverName,serverId,adminId); 
            if ('code' in res || res instanceof Error) throw (res);
            return res; 
        } catch (error) {
            return error as GenericError; 
        }
    }

    @Mutation(() => ServerSubscriptionInfoOrErrorUnion) 
    async createSubscription(
        @Arg('subInput', () => SubscriptionInput, {nullable: false}) subInput: SubscriptionInput, 
        @Ctx() context: Context
    ): Promise<typeof ServerSubscriptionInfoOrErrorUnion> {
        try {
            const { user } = context; 
            const { _id } = user; 
            const res = await this.adminControl.createSubscription(_id,subInput); 
            if ('code' in res || res instanceof Error) throw (res); 
            return res; 
        } catch (error) {
            return error as GenericError; 
        }
    }

    @Mutation(() => SuccessOrErrorUnion)
    async cancelSubscription(
      @Arg('serverId', () => String, {nullable: false}) serverId: string,
      @Ctx() context: Context
    ): Promise<typeof SuccessOrErrorUnion> {
        try {
            const { user } = context; 
            const { _id } = user; 
            const res = await this.adminControl.cancelSubsription(_id,serverId); 
            if (res instanceof Error) throw (res);
            return res; 
        } catch (error) {
            if ('statusCode' in error) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              return { code: error.statusCode,
                       message: error.raw.message, 
                       path: 'cancelSubscription' } as GenericError; 
            } 
            return error as GenericError; 
        }
    }

    @Mutation(() => ServerSubscriptionInfoOrErrorUnion)
    async updateSubscriptionPaymentMethod(
      @Arg('serverId', () => String, {nullable: false}) serverId: string, 
      @Arg('paymentMethodId', () => String, {nullable: false}) paymentMethodId: string,
      @Ctx() context: Context
    ): Promise<typeof ServerSubscriptionInfoOrErrorUnion> {
        try {
            const { user } = context; 
            const { _id } = user; 
            const res = await this.adminControl.updateSubscriptionPaymentMethod(_id,serverId,paymentMethodId); 
            if (res instanceof Error) throw (res);
            return res; 
        } catch (error) {
            if ('statusCode' in error) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              return { code: error.statusCode,
                       message: error.raw.message, 
                       path: 'updateSubscriptionPaymentMethod' } as GenericError; 
            } 
            return error as GenericError; 
        }
    }

    
    /*
    @Query(() => PaymentIntentSecretOrErrorUnion)
    async getPaymentIntentSecret(
        @Arg('amount', () => Float, {nullable: false}) amount: number
    ): Promise<typeof PaymentIntentSecretOrErrorUnion> {
        try { 
            if (amount === 0) throw (new BasicError(ErrorCode.UserInputError, `Cannot create payment for free plan`))
            const res = await this.adminControl.getPaymentIntentSecret(amount); 
            if (res instanceof Error) throw (res); 
            return {
              intentSecret: res
            }; 
        } catch (error) {
            console.log('our err ', error); 
            return error as GenericError; 
        }
    }
    */ 
}