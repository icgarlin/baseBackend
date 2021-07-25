import { BasicError,
         ISuccess } from '../error';
import { IServerInviteCode } from '../interfaces';

export interface IAdminRepo {
  createServerInvitationCode: () => IServerInviteCode | BasicError;
  createCustomer: (email: string, name: string) => Promise<string | BasicError>;
  cancelSubscription: (subscriptionId: string) => Promise<ISuccess | BasicError>; 
  createSubscription: (input: ISubscriptionInput) => Promise<ISubscriptionInfo | BasicError>; 
  sendServerInvitationCodeToEmail: (emailTo: string, serverName: string, serverId: string, code: string) => Promise<ISuccess | BasicError>; 
  addCodeToServer: (serverId: string, adminId: string, codeInfo: IServerInviteCode) => Promise<ISuccess | BasicError>; 
  getPaymentIntentSecret: (amount: number) => Promise<{clientSecret: string} | BasicError>; 
  updateSubscription: (subscriptionId: string, newPriceId: string, quantity: number) => Promise<ISubscriptionInfo | BasicError>; 
  updateSubscriptionPaymentMethod: (subscriptionId: string, paymentMethodId: string) => Promise<ISubscriptionInfo | BasicError>; 
}

export interface INodeMailerSendResponse {
  accepted: string[]; 
  rejected: string[]; 
  envelopeTime: number; 
  messageTime: number; 
  messageSize: number; 
  response: string; 
  envelope: {
    from: string; 
    to: string; 
  }; 
  messageId: string; 
}

export interface ISubscriptionInfo {
  id: string; 
  currentPeriodEnd: number; 
  customerId: string; 
  status: string;
  productId: string;  
}

interface Item {
  id?: string; 
  quantity?: number; 
  deleted?: boolean; 
  price?: string;
}

export interface Params {
  customer: string; 
  subscription: string; 
  subscription_items: Item[]; 
}

export interface ISubscriptionInput {
  serverId: string; 
  paymentMethodId: string; 
  email: string; 
  name: string; 
  priceId: string; 
  quantity: number; 
  customerId: string; 
}