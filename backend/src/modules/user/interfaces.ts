import { ISubscriptionInfo } from '../__shared__/admin/interface';
import { BasicError,
         ISuccess } from '../__shared__/error';
import { ICloudServiceRepo, 
         UpdatedDocument } from '../__shared__/interfaces';
import { IUserModel } from './user.model';


export interface IUserRepo extends IProfileEditRepo {
  findUserByUsername: (username: string) => Promise<IUser | BasicError>;
  findUser: (userId: string) => Promise<IUser | BasicError>;
  getAvatarUrl: (userId: string) => Promise<string | BasicError>;  
  updateRefreshToken: (userId: string, token: string) => Promise<UpdatedDocument | BasicError>;
  createAndUpdateRefreshToken: (userId: string, createRefreshToken: (userId: string) => string | BasicError) => Promise<string | BasicError> 
  getProfileInfo: (userId: string) => Promise<IProfileData | BasicError>; 
  login: (username: string, password: string, registration: boolean, comparePassword: (password: string, hashedPassword: string) => Promise<boolean | BasicError>, createAccessToken: (userId: string) => string | BasicError, createRefreshToken: (userId: string) => string | BasicError) => Promise<ILogin | BasicError>; 
  checkLoginCredentialsValid: (username: string, password: string, comparePassword: (password: string, hashedPassword: string) => Promise<boolean | BasicError>) => Promise<{isMatch: boolean, user: IUser} | BasicError>; 
  register: (info: IRegistration, comparePassword: (password: string, hashedPassword: string) => Promise<boolean | BasicError>, createAccessToken: (userId: string) => string | BasicError, createRefreshToken: (userId: string) => string | BasicError, createCustomer: (name: string, email: string) => Promise<string | BasicError>) => Promise<ILogin | BasicError>;
  addDMGroup:  (fromId: string, toIds: string[]) => Promise<ISuccess | BasicError>;
  deleteDMGroup: (fromId: string, toIds: string[]) => Promise<ISuccess | BasicError>;
  removeServerId: (serverId: string, userId: string) => Promise<ISuccess | BasicError>;
  getUserServers: (userId: string) => Promise<IServerJoined[] | BasicError>; 
  getServerMembers: (serverId: string) => Promise<{ids: string[]} | BasicError>;
  addSubscriptionInfo: (userId: string, serverId: string, info: ISubscriptionInfo) => Promise<ISuccess | BasicError>;  
  updateSubscriptionProductId: (userId: string, serverId: string, productId: string) => Promise<ISuccess | BasicError>; 
  updateSubscriptionId: (userId: string, serverId: string, subscriptionId: string) => Promise<ISuccess | BasicError>; 
  updateSubscriptionCurrentPeriodEnd: (userId: string, serverId: string, currentPeriodEnd: number) => Promise<ISuccess | BasicError>; 
  updateSubscriptionStatusByProductId: (customerId: string, productId: string, status: string) => Promise<ISuccess | BasicError>; 
  removeSubscriptionInfo: (customerId: string, productId: string) => Promise<ISuccess | BasicError>; 
  getSubscriptionIdFromOwner: (userId: string, serverId: string) => Promise<string | BasicError>; 
  // addToFollowing: (userId: string, followingUserId: string) => Promise<ISuccess | BasicError>;
  // removeFromFollowing: (userId: string, followingUserId: string) => Promise<ISuccess | BasicError>;
  // addToFollowers: (userId: string, followerUserId: string) => Promise<ISuccess | BasicError>;
  // removeFromFollowers: (userId: string, followerUserId: string) => Promise<ISuccess | BasicError>;  
  addToConnected: (userId: string, connectId: string) => Promise<ISuccess | BasicError>;
  getConnections: (userId: string) => Promise<IUser[] | BasicError>; 
  isConnection: (userId: string, connectId: string) => Promise<boolean | BasicError>
}

export interface IAccountHelper {
  comparePassword: (password: string, hashedPassword: string) => Promise<boolean | BasicError> 
  createAccessToken: (userId: string) => string | BasicError;
  createRefreshToken: (userId: string) => string | BasicError;
}

interface IProfileEditRepo {
  updateAvatar: (userId: string, avatar: string) => Promise<UpdatedDocument | BasicError>; 
  updateCover: (userId: string, cover: string) => Promise<UpdatedDocument | BasicError>; 
  updateDisplayName: (userId: string, name: string) => Promise<UpdatedDocument | BasicError>; 
  updateEmail: (userId: string, email: string) => Promise<UpdatedDocument |  BasicError>;
  updatePassword: (userId: string, email: string) => Promise<UpdatedDocument | BasicError>; 
}

export interface IUser {
  _id: IUserModel['_id'];
  username: IUserModel['username'];
  name: IUserModel['name'];
  email: IUserModel['email'];
  password: IUserModel['password'];
  avatar: IUserModel['avatar'];
  cover: IUserModel['cover'];
  connections: IUserModel['connections']; 
  roles: IUserModel['roles'];
  refreshToken: IUserModel['refreshToken'];
  serversJoined: IUserModel['serversJoined'];
  directMessages: IUserModel['directMessages'];
  bio?: IUserModel['bio'];
  stripeCustomerId?: IUserModel['stripeCustomerId'];
  birth?: IUserModel['birth'];
  lastLogin?: IUserModel['lastLogin'];
  cloudService?: ICloudServiceRepo; 
}

export interface IEditProfileInfo {
  avatar?: IUserModel['avatar'];
  cover?: IUserModel['cover']; 
  email?: IUserModel['email']; 
  name?: IUserModel['name']; 
  password?: IUserModel['password']; 
}

export interface IDOptions {
  userId?: IUser['_id']; 
  username?: IUser['username']; 
}

export interface IProfileData {
  _id: IUser['_id']; 
  username: IUser['username']; 
  name: IUser['name'];
  email: IUser['email']; 
  avatar: IUser['avatar']; 
}

export interface IServerJoined {
  _id: string; 
  serverId: string; 
  lastActive: Date;
  subscriptionId?: string;
  productId?: string;  
  currentPeriodEnd?: number;  
}

export interface ILogin {
  user: IUser; 
  accessToken: string; 
}

export interface IRegistration {
  username: string;
  name: string; 
  email: string;
  password: string;
}

export interface ILoginCredentials {
  user: IUser; 
  lastLogin?: Date | null; 
  isMatch: boolean; 
}
