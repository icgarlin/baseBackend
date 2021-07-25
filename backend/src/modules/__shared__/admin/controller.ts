import { Service } from 'typedi';
import { IServerRepo } from '../../server/interfaces';
import { SERVERTIER } from '../../server/types';
import { IUserRepo } from '../../user/interfaces';
import { BasicError, 
         ErrorCode, 
         ISuccess } from '../error';
import { IAdminRepo, 
         ISubscriptionInfo, 
         ISubscriptionInput } from './interface';


@Service()
export class AdminController {
    private admin: IAdminRepo; 
    user: IUserRepo; 
    server: IServerRepo; 
    constructor (adminRepo: IAdminRepo, userRepo: IUserRepo, serverRepo?: IServerRepo) {
       this.admin = adminRepo; 
       this.user = userRepo; 
       if (serverRepo !== undefined) {
          this.server = serverRepo; 
       }
    }

    buildServerInviteCodeAndNodeMailerSend = async (emails: string[], serverName: string, serverId: string, adminId: string): Promise<ISuccess | BasicError> => {
        try {
            const codeInfo = this.admin.createServerInvitationCode(); 
            if (codeInfo instanceof Error) throw (codeInfo); 
            const addCodeToServerRes = await this.admin.addCodeToServer(serverId,adminId,codeInfo); 
            if (addCodeToServerRes instanceof Error) throw (addCodeToServerRes); 
            emails.map(async (email) => {
               const res = await this.admin.sendServerInvitationCodeToEmail(email,serverName,serverId,codeInfo.code); 
               if (res instanceof Error) throw (res);
            })
            return {success: true}; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    createSubscription = async (userId: string, input: ISubscriptionInput): Promise<ISubscriptionInfo | BasicError> => {
        try {
            const { serverId } = input; 
            const res = await this.admin.createSubscription(input);
            if (res instanceof Error) throw (res);
            console.log('the res man subs', res);
            const addRes = await this.user.addSubscriptionInfo(userId,serverId,res); 
            if (addRes instanceof Error) throw (addRes); 
            return res; 
        } catch (error) {
            console.log('error creating subscription ', error); 
            return error as BasicError; 
        }
    }
    
    cancelSubsription = async (ownerId: string, serverId: string): Promise<ISuccess | BasicError> => {
        try {
            const subId = await this.user.getSubscriptionIdFromOwner(ownerId,serverId); 
            if (subId instanceof Error) throw (subId); 
            const res = await this.admin.cancelSubscription(subId); 
            if (res instanceof Error) throw (res);
            const tierRes = await this.server.changeServerTier(serverId,SERVERTIER.BASIC); 
            if (tierRes instanceof Error) throw (tierRes); 
            return tierRes; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    updateSubscription = async (userId: string, serverId: string, subscriptionId: string, newPriceId: string, quantity: number): Promise<ISubscriptionInfo | BasicError> => {
        try {
           const res = await this.admin.updateSubscription(subscriptionId,newPriceId,quantity); 
           if (res instanceof Error) throw (res); 
           const subscriptionIdRes = await this.user.updateSubscriptionId(userId,serverId,res.id); 
           const currentPeriodEndRes = await this.user.updateSubscriptionCurrentPeriodEnd(userId,serverId,res.currentPeriodEnd); 
           const productIdRes = await this.user.updateSubscriptionProductId(userId,serverId,res.productId)
           if ('success' in subscriptionIdRes 
                      && 'success' in currentPeriodEndRes
                                 && 'success' in productIdRes) {
             return res; 
           } else throw (new BasicError(ErrorCode.MongoDBError, `Could not update user server subscription info`))
        } catch (error) {
            return error as BasicError; 
        }
    }

    updateSubscriptionStatusByProductId = async (customerId: string, productId: string, status: string): Promise<ISuccess | BasicError> => {
        try {
            const res = await this.user.updateSubscriptionStatusByProductId(customerId,productId,status); 
            if (res instanceof Error) throw (res); 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    getPaymentIntentSecret = async (amount: number): Promise<{clientSecret: string} | BasicError> => {
        try {
            const res = await this.admin.getPaymentIntentSecret(amount); 
            if (res instanceof Error) throw (res); 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    removeSubscriptionInfo = async (customerId: string, productId: string): Promise<ISuccess | BasicError> => {
        try {
            const res = this.user.removeSubscriptionInfo(customerId,productId); 
            if (res instanceof Error) throw (res); 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    addSeatToSubscription = async (ownerId: string, serverId: string): Promise<ISubscriptionInfo | BasicError> => {
        try {
            const memberIds = await this.user.getServerMembers(serverId);
            if (memberIds instanceof Error) throw (memberIds); 
            const subscriptionId = await this.user.getSubscriptionIdFromOwner(ownerId,serverId);
            if (subscriptionId instanceof Error) throw (subscriptionId); 
            const priceId = process.env.PUBLIC_STRIPE_PRICE_ID;  
            const quantity = memberIds.ids.length;
            const res = await this.updateSubscription(ownerId,serverId,subscriptionId,priceId,quantity); 
            if (res instanceof Error) throw (res); 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }


    updateSubscriptionPaymentMethod = async (userId: string, serverId: string, paymentMethodId: string): Promise<ISubscriptionInfo | BasicError> => {
        try {
            const subId = await this.user.getSubscriptionIdFromOwner(userId,serverId); 
            if (subId instanceof Error) throw (subId);
            const res = await this.admin.updateSubscriptionPaymentMethod(subId,paymentMethodId); 
            if (res instanceof Error) throw (res); 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }
}