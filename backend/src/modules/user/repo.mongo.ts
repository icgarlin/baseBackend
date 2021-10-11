/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ICloudServiceRepo, 
         UpdatedDocument } from '../__shared__/interfaces';
import { IAccountHelper, 
         ILogin,
         ILoginCredentials, 
         IProfileData,
         IRegistration, 
         IServerJoined, 
         IUser, 
         IUserRepo } from './interfaces';
import { UserModel } from './user.model';
import { BasicError, 
         ErrorCode, 
         handleMongoError, 
         ISuccess } from '../__shared__/error';
import bcrypt from 'bcryptjs'; 
import { Service } from 'typedi';
import { ISubscriptionInfo } from '../__shared__/admin/interface';
import Stripe from 'stripe'; 
import mongoose from 'mongoose'; 


@Service()
class MongoDBUserRepo implements IUserRepo {

cloudService: ICloudServiceRepo;
accountHelper: IAccountHelper;  

private hashPassword = async (password: string): Promise<string | BasicError> => {
 try {
       const hashedPassword: string = await new Promise((resolve, reject) => {
       bcrypt.hash(password, 10, (err, hash) => {
           if (err) reject(err);
           resolve(hash)
       });
       });
       return hashedPassword;
 } catch (error) {
     return error as BasicError; 
 } 
};

checkLoginCredentialsValid = async (username: string, password: string, comparePassword: (password: string, hashedPassword: string) => Promise<boolean | BasicError>): Promise<ILoginCredentials | BasicError> => {
   try { 
       if (username === '' || password === '') throw (new BasicError(ErrorCode.UserInputError, `Incorrect login credentials`));
       const user = await this.findUserByUsername(username); 
       if ('code' in user) throw (user); 
       const isMatch = await comparePassword(password,user.password); 
       if (isMatch instanceof BasicError) throw (isMatch); 
       /* Old users do not have hashed password */ 
       if (!isMatch && password != user.password) throw (new BasicError(ErrorCode.UserInputError,`Wrong password`)); 
       /*****************************************/
       if (isMatch) return {isMatch: true, user};
       else return {isMatch: false, user: null}; 
       
   } catch (error) {
        console.log('our error in check ', error);
        if (error['name'] === 'MongoError') {
            return handleMongoError(error); 
        } else if (error instanceof BasicError) {
            return error; 
        } 
  
   }
}

createAndUpdateRefreshToken = async (userId: string, createRefreshToken: (userId: string) => string | BasicError): Promise<string | BasicError> => {
   try {
       const refreshToken = createRefreshToken(userId);
       if (refreshToken instanceof BasicError) throw (refreshToken);
       const updated = await this.updateRefreshToken(userId,refreshToken); 
       if (updated instanceof BasicError) throw (updated);
       return refreshToken; 
   } catch (error) {
        if (error['name'] === 'MongoError') {
            return handleMongoError(error); 
        } 
    
   }
}

doesUserExist = async (username: string, email: string): Promise<false | BasicError> => {
   try {
       const user = await UserModel.findOne({
                                               $or: [{
                                                   email
                                               }, {
                                                   username
                                               }]
                                           }); 
       if (!user) return false; 
       if (user.email === email) throw (new BasicError(ErrorCode.UserInputError,'A user with that email already exists'));
       else if (user.username === username) throw (new BasicError(ErrorCode.UserInputError,'A user with that username already exists'));
       else throw (new BasicError(ErrorCode.BadRequest)); 
   } catch (error) {
        if (error['name'] === 'MongoError') {
            return handleMongoError(error); 
        } 
    
   }
}

updateLastLogin = async (userId: string): Promise<Date | BasicError> => {
   try {

       const loginTime = new Date();
       const updated = await UserModel.updateOne({'_id': userId}, {
                                                               $set: {
                                                                   lastLogin: loginTime
                                                               }
                                                           }) as UpdatedDocument;

       if (updated.nModified === 1) return loginTime; 
       else throw (new BasicError()); 
   } catch (error) {
    if (error['name'] === 'MongoError') {
        return handleMongoError(error); 
    } 
  
   }
}

login = async (username: string, password: string, registration: boolean, comparePassword: (password: string, hashedPassword: string) => Promise<boolean | BasicError>, createAccessToken: (userId: string) => string | BasicError, createRefreshToken: (userId: string) => string | BasicError): Promise<ILogin | BasicError> => {
   try {
       const isValid = await this.checkLoginCredentialsValid(username,password,comparePassword);
       if (isValid instanceof BasicError) throw (isValid);
       const { isMatch, user } = isValid; 
       if (!isMatch) throw (new BasicError(ErrorCode.UserInputError, `Incorrect password`));

       const refreshToken = await this.createAndUpdateRefreshToken(user._id,createRefreshToken);
       if (refreshToken instanceof Error) throw (refreshToken); 

       let loginTime: Date; 
       if (!registration) {
         const lastLoginUpdated = await this.updateLastLogin(user._id); 
         if ('code' in lastLoginUpdated) throw (lastLoginUpdated);
         loginTime = lastLoginUpdated; 
       }

       if (typeof refreshToken === 'string') {
          const accessToken = createAccessToken(user._id);
          if (accessToken instanceof BasicError) throw (accessToken);
          if (user.refreshToken === undefined) user.refreshToken = refreshToken; 
          if (loginTime !== undefined && !registration) user.lastLogin = loginTime; 
          return {
           user,
           accessToken
          }
       }
   } catch (error) {
       console.log('login error ', error); 
        if (error['name'] === 'MongoError') {
            return handleMongoError(error); 
        } else if (error instanceof BasicError) {
            return error; 
        }
   
   }
}

register = async (info: IRegistration, comparePassword: (password: string, hashedPassword: string) => Promise<boolean | BasicError>, createAccessToken: (userId: string) => string | BasicError, createRefreshToken: (userId: string) => string | BasicError,  createCustomer: (name: string, email: string) => Promise<string | BasicError>): Promise<ILogin | BasicError> => {
   try {
       const { username, name, email, password } = info; 

       const hashPass = await this.hashPassword(password);
       const stripeCustomerId = process.env.NODE_ENV === 'production' ? 
                            await createCustomer(name,email) : 
                            ''
       if (stripeCustomerId instanceof Error) throw (stripeCustomerId); 
       const newUser = await UserModel.create({
                                                username,
                                                name, 
                                                password: hashPass,
                                                email, 
                                                avatar: ``,
                                                stripeCustomerId
                                              });
        const { username: newUsername } = newUser; 
        return await this.login(
                                newUsername,
                                password,
                                true,
                                comparePassword,
                                createAccessToken,
                                createRefreshToken);
       
   } catch (error) {
        if (error['name'] === 'MongoError') {
            return handleMongoError(error); 
        } 
      
     
   }
}

findUser = async (userId: string): Promise<IUser | BasicError> => {
   try {  
       const resp = await UserModel.findById(userId);
       if (!resp) throw (new BasicError(ErrorCode.NotFound));
       const user = (resp.toObject() as unknown); 
       return user as IUser; 
   } catch (error) {
        if (error['name'] === 'MongoError') {
            return handleMongoError(error); 
        } else if (error instanceof BasicError) {
            return error; 
        }
   }
}

findUserByUsername = async (username: string): Promise<IUser | BasicError> => {
   try {
       console.log('the username ', username); 
       const resp = await UserModel.findOne({username}); 
       if (!resp) throw (new BasicError(ErrorCode.NotFound,`Could not find user`));
       const user = (resp.toObject() as unknown); 
       return user as IUser; 
   } catch (error) {
        if (error['name'] === 'MongoError') {
            return handleMongoError(error); 
        } else if (error instanceof BasicError) {
            return error; 
        }
   }
}

getProfileInfo = async (username: string): Promise<IProfileData | BasicError> => {
   try {
       const user = await UserModel.findOne({username});
       if (!user || user === undefined) throw (new BasicError(ErrorCode.NotFound));
       const { _id, name,
               email, avatar } = user; 
       return {
               _id, 
               username,
               name, 
               email, 
               avatar
              }
      
   } catch (error) {
       return error as BasicError; 
   }
}

updateAvatar = async (userId: string, avatar: string): Promise<UpdatedDocument | BasicError> => {
 try {
   const updated = await UserModel.updateOne({_id: userId}, {
                        $set: {
                            avatar,
                        }
                   }) as UpdatedDocument; 
   return updated; 
 } catch (error) {
    if (error['name'] === 'MongoError') {
        return handleMongoError(error); 
    } 
  
 }
}

updateCover = async (userId: string, cover: string): Promise<UpdatedDocument | BasicError> => {
   try {
       const updated = await UserModel.updateOne({_id: userId}, {
                           $set: {
                               cover,
                           }
                       }) as UpdatedDocument; 
       return updated; 
   } catch (error) {
        if (error['name'] === 'MongoError') {
            return handleMongoError(error); 
        } 
  
   }
}

updateDisplayName = async (userId: string, name: string): Promise<UpdatedDocument | BasicError> => {
   try {
       const updated = await UserModel.updateOne({_id: userId}, {
                                   $set: {
                                       name,
                                   }
                       }) as UpdatedDocument; 
       return updated; 
   } catch (error) {
        if (error['name'] === 'MongoError') {
            return handleMongoError(error); 
        } 
  
   }
}

updateEmail = async (userId: string, email: string): Promise<UpdatedDocument | BasicError>=> {
 try {
   const updated = await UserModel.updateOne({_id: userId}, {
                                   $set: {
                                       email,
                                   }
                         }) as UpdatedDocument; 
   return updated; 
 } catch (error) {
    if (error['name'] === 'MongoError') {
        return handleMongoError(error); 
    } 
  
 }
}

updatePassword = async (userId: string, password: string): Promise<UpdatedDocument | BasicError> => {
   try {
       const hashRes: string | unknown = this.hashPassword(password); 
       if (typeof hashRes !== 'string') throw (hashRes)
       const updated = await UserModel.updateOne({_id: userId}, {
                                   $set: {
                                       password: hashRes,
                                   }
                       }) as UpdatedDocument; 
       return updated; 
   } catch (error) {
        if (error['name'] === 'MongoError') {
            return handleMongoError(error); 
        } 
  
   }
}

updateRefreshToken = async (userId: string, token: string): Promise<UpdatedDocument | BasicError> => {
   try {
       const updated = await UserModel.updateOne({_id: userId}, {
                                                                   $set: {
                                                                       refreshToken: token,
                                                                   }
                                                               }) as UpdatedDocument; 
       return updated; 
   } catch (error) {
        if (error['name'] === 'MongoError') {
            return handleMongoError(error); 
        } 
  
   }
}  

getAvatarUrl = async (userId: string): Promise<string | BasicError> => {
   try {
       if (this.cloudService === undefined) throw (new BasicError(ErrorCode.BadRequest));
       const user = await UserModel.find({_id: userId}, { avatar: 1 });
       if (!user || user.length === 0) throw (new BasicError(ErrorCode.NotFound)); 
       if (user.length > 1) throw (new BasicError(ErrorCode.BadRequest));  
       const avatarKey = user[0].avatar; 
       const res = this.cloudService.getUrl(avatarKey);
       return res; 
   } catch (error) {
        if (error['name'] === 'MongoError') {
            return handleMongoError(error); 
        } 
       if (error instanceof BasicError) {
           if (error.code === ErrorCode.NotFound) {
               error.message = `Could not find user`;
               return error;
           } else if (error.code === ErrorCode.BadRequest) {
               error.message = `Mongo bad request`; 
               return error; 
           }
       }
       return error as BasicError; 
   }
}

addDMGroup = async (fromId: string, toIds: string[]): Promise<ISuccess | BasicError> => {
   try {
       const fromUserUpdated = await UserModel
       .updateOne(
         { _id: fromId },
         { $push: { directMessages: {users: toIds}}}
       ); 

       if (fromUserUpdated.nModified !== 1) throw (new BasicError(ErrorCode.BadRequest,`Could not modify users directMessages`)); 

       const toUsersPromise = toIds.map(async (id) => {
           const idList = toIds.filter((toId) => toId !== id); 
           return await UserModel
               .updateOne(
               { _id: id },
               { $push: { directMessages: {users: [...idList,fromId]}} }
               ) as UpdatedDocument 
       })
       const toUsers = await Promise.all(toUsersPromise); 
       return {success:true};  
   } catch (error) {
       if (error instanceof mongoose.Error) {
           console.log('a mongoose error')
       }
       return error as BasicError; 
   }
}


deleteDMPair = async (fromUserId: string, toUserId: string): Promise<true | BasicError> => {
   try {
       const firstUpdatedUser = await UserModel
       .updateOne(
         { userId: fromUserId },
         { $pull: { directMessages: toUserId } }
       ) as UpdatedDocument

       const secondUpdatedUser = await UserModel
       .updateOne(
         { userId: toUserId },
         { $pull: { directMessages: fromUserId } }
       ) as UpdatedDocument; 

       if (firstUpdatedUser.nModified === 1 && secondUpdatedUser.nModified === 1) return true; 
       throw (new BasicError()); 
   } catch (error) {
       return error as BasicError; 
   }
}

deleteDMGroup = async (fromId: string, toIds: string[]): Promise<ISuccess | BasicError> => {
   try {
       const fromUser = await UserModel
        .updateOne(
         { userId: fromId },
         { $pull: { directMessages: {user: toIds} } }
       ) as UpdatedDocument

       if (fromUser.nModified !== 1) throw (new BasicError(ErrorCode.BadRequest,`Could not remove dm group`)); 
       const toUsersPromise = toIds.map(async (id) => {
           const idList = toIds.filter((toId) => toId !== id) 
           return await UserModel.updateOne(
               {userId: id}, 
               { $pull: { directMessages: {user: [...idList,fromId]}}}) as UpdatedDocument; 
       }); 
       const toUsers = await Promise.all(toUsersPromise); 
       return {success: true};
   } catch (error) {
       if (error instanceof mongoose.Error) {
           console.log('a mongoose error')
       }
       return error as BasicError; 
   }
}

removeServerId = async (serverId: string, userId: string): Promise<ISuccess | BasicError> => {
   try {
       const updated = await UserModel
       .updateOne(
         { 'serversJoined.serverId': serverId, userId: userId },
         { $pull: { serversJoined: { serverId: serverId }  } }
       ) as UpdatedDocument;
       if (updated.nModified === 1) return {success: true};
       else throw (new BasicError());
   } catch (error) {
        if (error['name'] === 'MongoError') {
            return handleMongoError(error); 
        } 
  
   }
}

getUserServers = async (userId: string): Promise<IServerJoined[] | BasicError> => {
   try {
       if (userId === '') throw (new Error()); 
       const response = await UserModel.findById(userId);
       if (response && response.serversJoined !== undefined && response.serversJoined.length > 0) return response.toObject().serversJoined; 
       return []; 
   } catch (error) {
        if (error['name'] === 'MongoError') {
            return handleMongoError(error); 
        }
   }
}

getServerMembers = async (serverId: string): Promise<{ids: string[]} | BasicError> => {
   try {

       const match = {
         'serversJoined.serverId': serverId
       }

       const res = await UserModel.aggregate([
                                           {$match: match},
                                           { $project: {'_id': 1} }
                                        ]); 
      
       const ids = res.map((val: {_id: string}) => {
           return val._id; 
       })

       return {
         ids
       }

   } catch (error) {
        if (error['name'] === 'MongoError') {
            return handleMongoError(error); 
        } 
  
   }
}

updateStripeCustomerId = async (userId: string, customerId: string): Promise<ISuccess | BasicError> => {
   try {
       const res = await UserModel.updateOne({_id: userId}, {
                                                       stripeCustomerId: customerId
                                                   }) as UpdatedDocument; 
       if (res.nModified !== 1) throw (new BasicError()); 
       return {success:true}; 
   } catch (error) {
        if (error['name'] === 'MongoError') {
            return handleMongoError(error); 
        } 
   }
}

addSubscriptionInfo = async (userId: string, serverId: string, info: ISubscriptionInfo): Promise<ISuccess | BasicError> => {
   try {

       const { id, currentPeriodEnd, productId } = info; 
       const res = await UserModel.updateOne({_id: userId, 'serversJoined.serverId': serverId }, {
                                                           $set: {
                                                               'serversJoined.$.subscriptionId': id,
                                                               'serversJoined.$.currentPeriodEnd': currentPeriodEnd,
                                                               'serversJoined.$.productId': productId
                                                           }
                                                       }) as UpdatedDocument;

       if (res.nModified === 1) return {success:true};
       else throw (new BasicError(ErrorCode.BadRequest, `Could not update users server ${serverId} with subscrition info`)); 
   } catch (error) {
        if (error['name'] === 'MongoError') {
            return handleMongoError(error); 
        } 
    
   }
}

updateSubscriptionCurrentPeriodEnd = async (userId: string, serverId: string, currentPeriodEnd: number): Promise<ISuccess | BasicError>  => {
   try {
       const res = await UserModel.updateOne({_id: userId, 'serversJoined.serverId': serverId }, {
                                                           $set: { 
                                                               'serversJoined.$.currentPeriodEnd': currentPeriodEnd
                                                           }
                                                       }) as UpdatedDocument;
      
       if (res.nModified === 1) return {success: true};
       else throw (new BasicError(ErrorCode.BadRequest, `Could not update users server ${serverId} with subscrition info`)); 
   } catch (error) {
       return error as BasicError;  
   }
}

updateSubscriptionId = async (userId: string, serverId: string, subscriptionId: string): Promise<ISuccess | BasicError>  => {
   try {
       const res = await UserModel.updateOne({_id: userId, 'serversJoined.serverId': serverId }, {
                                                           $set: { 
                                                            'serversJoined.$.subscriptionId': subscriptionId
                                                           }
                                                       }) as UpdatedDocument;
       if (res.nModified === 1) return {success:true};
       else throw (new BasicError(ErrorCode.BadRequest, `Could not update users server ${serverId} with subscriptionId ${subscriptionId}`)); 
   } catch (error) {
        if (error['name'] === 'MongoError') {
            return handleMongoError(error); 
        } 
   }
}

updateSubscriptionProductId = async (userId: string, serverId: string, productId: string): Promise<ISuccess | BasicError> => {
   try {
       const res = await UserModel.updateOne({_id: userId, 'serversJoined.serverId': serverId }, {
                                                           $set: { 
                                                            'serversJoined.$.subscriptionId': productId
                                                           }
                                                       }) as UpdatedDocument;
       console.log('our res ', res); 
       if (res.nModified === 1) return {success:true};
       else throw (new BasicError(ErrorCode.BadRequest, `Could not update users server ${serverId} with subscriptionId ${productId}`)); 
   } catch (error) {
        if (error['name'] === 'MongoError') {
            return handleMongoError(error); 
        } 
   }
}

updateSubscriptionStatusByProductId = async (customerId: string, productId: string, status: string): Promise<ISuccess | BasicError> => {
   try {
       const res = await UserModel.updateOne({stripeCustomerId: customerId, 'serversJoined.productId': productId }, {
                                                             $set: { 
                                                               'serversJoined.$.status': status 
                                                             }
                                            }) as UpdatedDocument;
       console.log('our res ', res); 
       if (res.nModified === 1) return {success:true};
   } catch (error) {
        if (error['name'] === 'MongoError') {
            return handleMongoError(error); 
        } 
   }
} 

removeSubscriptionInfo = async (customerId: string, productId: string): Promise<ISuccess | BasicError> => {
   try {
       const res = await UserModel.updateOne({stripeCustomerId: customerId, 'serversJoined.productId': productId }, {
                                                              $unset: { 
                                                               'serversJoined.$.subscriptionId': 1, 
                                                               'serversJoined.$.productId': 1, 
                                                               'serversJoined.$.currentPeriodEnd': 1
                                                               }
                                               }) as UpdatedDocument; 
       if (res.nModified === 1) return {success: true}; 
       else throw (new BasicError(ErrorCode.MongoDBError,`Could not remove product ${productId} subscription info`)); 
   } catch (error) {
        if (error['name'] === 'MongoError') {
            return handleMongoError(error); 
        } 
   }
}

getSubscriptionIdFromOwner = async (userId: string, serverId: string): Promise<string | BasicError> => {
   try { 
       const res = await UserModel.findOne({_id: userId, 'serversJoined.serverId': serverId}); 
       if (res !== null) {
         const { serversJoined } = res; 
         const server = serversJoined.filter((val) => val.serverId === serverId)[0]; 
         if ('subscriptionId' in server) {
           const { subscriptionId } = server; 
           return subscriptionId; 
         } else throw (new BasicError(ErrorCode.BadRequest, `No subscription on this server`))
       } else throw (new BasicError(ErrorCode.NotFound,`Could not find user`)); 
   } catch (error) {
        if (error['name'] === 'MongoError') {
            return handleMongoError(error); 
        } 
   }
}


addToConnected = async (userId: string, connectId: string): Promise<ISuccess | BasicError> => {
   try {
       const res = await UserModel.updateOne({_id: userId}, {
                                                       $push: {
                                                           connections: connectId
                                                       }
                                                           }) as UpdatedDocument; 
      if (res.nModified !== 1) throw (new BasicError(ErrorCode.BadRequest,`Could not add to user connected`)); 
      return {success:true}; 
   } catch (error) {
        if (error['name'] === 'MongoError') {
            return handleMongoError(error); 
        } 
   }
}


removeFromConnected = async (userId: string, connectId: string): Promise<ISuccess | BasicError> => {
   try {
       const res = await UserModel.updateOne({_id: userId}, {
                                                       $pull: {
                                                           connections: connectId
                                                       }
                                                           }) as UpdatedDocument; 
      if (res.nModified !== 1) throw (new BasicError(ErrorCode.BadRequest,`Could not remove from user connected`)); 
      return {success:true}; 
   } catch (error) {
        if (error['name'] === 'MongoError') {
            return handleMongoError(error); 
        } 
   }
}

getConnections = async (userId: string): Promise<IUser[] | BasicError> => {
   try {
       const user = await this.findUser(userId); 
       if (user instanceof Error) throw (user); 
       const { connections } = user; 
       const users = connections.map(async (connection) => {
         const res = await UserModel.findById(connection); 
         const user = res.toObject() as unknown; 
         return user as IUser
       }); 
       return await Promise.all(users); 
   } catch (error) {
       if (error instanceof mongoose.Error.DocumentNotFoundError) {
           return new BasicError(ErrorCode.NotFound); 
       } else if (error instanceof BasicError) {
           return error; 
       }
       return error as BasicError; 
   }
} 

isConnection = async (userId: string, connectId: string): Promise<boolean | BasicError> => {
    try {
        const user = await this.findUser(userId); 
        if (user instanceof Error) throw (user); 
        return user.connections.includes(connectId); 
    } catch (error) {
        if (error['name'] === 'MongoError') {
            return handleMongoError(error); 
        } 
      
    }
}
}

export default MongoDBUserRepo; 