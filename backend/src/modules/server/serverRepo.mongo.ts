/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
import { Condition } from 'mongodb';
import { Service } from 'typedi';
import { IServerJoined, IUser } from '../user/interfaces';
import { UserModel } from '../user/user.model';
import BaseRepo from '../__shared__/baseRepo';
import { BasicError, ErrorCode, ISuccess } from '../__shared__/error';
import { UpdatedDocument } from '../__shared__/interfaces';
import { ChannelModel } from './channel.model';
import { IChannel,
         IServerMessage, 
         MessageSize, 
         IServerRepo, 
         IServerMessageConnection, 
         IIncomingServerMessage, 
         IChannelData, 
         IServerData, 
         IServerFileConnection,
         IServerFile} from './interfaces';
import { IServerModel, ServerModel } from './server.model';
import { IServerMessageModel, ServerMessageModel } from './serverMessage.model';
import { SERVERTIER } from './types';
import mongoose from 'mongoose'; 
import { ServerFileModel } from './file.model';

@Service()
export class MongoDBServerRepo extends BaseRepo implements IServerRepo { 

    generateId = (): string => {
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        return (`` + 1e7 + -1e3 + -4e3 + -8e3 + -1e11).replace(/1|0/g, function () {
          return (0 | (Math.random() * 16)).toString(16);
        });
    };
    
    getUserServerList = async (userId: string, getServers: (userId: string) => Promise<IServerJoined[] | BasicError>): Promise<IServerData[] | BasicError> => {
        try {
           const servers = await getServers(userId);
           if ('code' in servers || servers instanceof BasicError) throw (servers);
           const serverData: IServerData[] = [];
           if (servers.length > 0) {
            const serversPromiseArray = servers.map(async (server) => {
                return await ServerModel.findOne({serverId:server.serverId}, {_id: 0, serverId: 1, serverName: 1, size: 1, ownerId: 1, admins: 1, tier: 1}); 
            });
            const serversArray = await Promise.all(serversPromiseArray);
            const channelsPromiseArray = serversArray.map(async (server) => {
               const channels = await ChannelModel.find({serverId: server.serverId}, {serverId: 1, channelId: 1, channelName: 1, _id: 0});
               const newChannelsList = channels.map((channel) => {
                   return (channel.toObject() as IChannel); 
               })
               return newChannelsList; 
            })
            const channelsArray = await Promise.all(channelsPromiseArray);
            serversArray.map((server, key) => {
                // console.log('our server ', server.); 
                const servObject = server.toObject(); 
                const data: IServerData = {
                    name: servObject.serverName,
                    channels: channelsArray[key],
                    adminIds: servObject.admins,
                    ownerId: servObject.ownerId, 
                    tier: servObject.tier,
                    size: servObject.size,
                    serverId: servObject.serverId
                }
                serverData.push(data);
            })
           }
           return serverData; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    createServer = async (serverName: string, channelName: string, ownerId: string): Promise<IServerData | BasicError> => {
        try {
            const serverId = this.generateId();
            // const server = new ServerModel({
            //                                  serverId: serverId,
            //                                  serverName: serverName,
            //                                  ownerId,
            //                                  tier: 0
            //                               });
            // await server.save();

            const server = await ServerModel.create({
                                                    serverId: serverId,
                                                    serverName: serverName,
                                                    adminIds: [], 
                                                    ownerId,
                                                    tier: 0 
                                                   }); 
            if (!server) throw (new BasicError(ErrorCode.MongoDBError, `Could not create cloud ${serverName}`)); 
            const newChannel = await this.createChannel(serverId,channelName);
            if (newChannel instanceof Error) throw (newChannel);
            const joinRes = await this.joinServer(serverId,ownerId);
            console.log('the joinRes ', joinRes);
            if ('code' in joinRes || joinRes instanceof Error) throw (joinRes);
            const promotionRes = await this.addAdmin(serverId,ownerId);
            console.log('the promotionRes ', promotionRes);
            if ('code' in promotionRes || promotionRes instanceof Error) throw (promotionRes);
    
            return {
                ownerId,
                name: serverName,
                channels: [{serverId: serverId, channelName, channelId: newChannel.channelId}],
                serverId: serverId,
                adminIds: [ownerId],
                size: 0,
                tier: 0
            };
  
        } catch (error) {
            return error as BasicError; 
        }
    }
    
    joinServer = async (serverId: string, userId: string, inviteCode?: string): Promise<IServerData | BasicError> => {
        try {
             const server = await ServerModel.findOne({serverId}); 
             console.log('the server ', server);
             if (inviteCode !== undefined) {
                 const codeObject: any = {}; 
                 server.inviteCodes.forEach((inviteCodeInfo) => {
                    codeObject[inviteCodeInfo.code] = inviteCodeInfo.expiration; 
                 }); 
                 console.log('our code object ', codeObject); 
                 if (`${inviteCode}` in codeObject) {
                     if (Date.now() >= codeObject[inviteCode]) {
                         throw new BasicError(ErrorCode.Unauthorized, `Invitation code has expired`); 
                     }
                 }
             }
             if (!server || server === undefined) throw (new BasicError())
             console.log('our user errror ', userId as Condition<string>); 

             const updatedUser = await UserModel
                                        .updateOne(
                                            { _id: userId} ,
                                            {
                                                $push: {
                                                    serversJoined: {
                                                        _id: server._id, // Must check this 
                                                        serverId: serverId,
                                                        lastActive: new Date(),
                                                    },
                                                },
                                            }
                                        ) as UpdatedDocument; 
             console.log('the updatedUser ', updatedUser); 
             if (updatedUser.nModified === 1)  {
                 const channels = await ChannelModel.find({serverId}); 
                 const channelData: IChannel[] = channels.map((channel) => {
                     return channel.toObject(); 
                 })

                 return {
                    size: server.size,
                    tier: server.tier,
                    ownerId: server.ownerId,
                    serverId: server.serverId,
                    name: server.serverName,
                    channels: channelData, 
                    adminIds: server.admins
                 }
             } else {
                throw({code: ErrorCode.MongoDBError,
                        message: `Could not update user ${userId} serverJoined`,
                        path: ['joinServer']}); 
             } 
        } catch (error) {
            console.log('the error her ', error); 
            return error as BasicError; 
        }
    }

    isUserAdmin = async (serverId: string, userId: string): Promise<boolean | BasicError> => {
        try {
           const resp = await ServerModel.find({serverId},{admins: {$elemMatch: userId}}); 
           if (resp && resp.length > 0) {
               return true; 
           } else return false; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    removeAdmin = async (serverId: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
           const resp = await ServerModel.updateOne({serverId},{ $pull: {
                                                                    'admins': userId}}) as UpdatedDocument; 
           if (resp.nModified === 1) return {success: true}; 
           else throw (new BasicError());
        } catch (error) {
            return error as BasicError; 
        }
    }

    leaveServer = async (serverId: string, userId: string, pullServerFromUser: (serverId: string, userId: string) => Promise<ISuccess | BasicError>): Promise<ISuccess | BasicError> => {
        try { 
            await UserModel
            .updateOne(
              { 'serversJoined.serverId': serverId, userId: userId },
              { $pull: { serversJoined: { serverId: serverId }  } }
            ) as UpdatedDocument;
            const pullRes = await pullServerFromUser(serverId,userId); 
            if ('code' in pullRes) throw (pullRes); 
            const isAdmin = await this.isUserAdmin(serverId, userId);
            if (isAdmin instanceof BasicError) throw (isAdmin);
            if (isAdmin) {
                return await this.removeAdmin(serverId, userId);
            }
            return {success:true};
        } catch (error) {
            return error as BasicError; 
        }
    }

    getServerName = async (serverId: string): Promise<string> => {
        try {
          const server = await ServerModel
            .findOne({ serverId: serverId }, { serverName: 1, _id: 0 }); 
          return server.serverName;
        } catch (err) {
          throw err;
        }
    };

    createChannel = async (serverId: string, channelName: string): Promise<IChannel | BasicError> => {
        try {
            const channelId = this.generateId();
            const channel = await ChannelModel.create({serverId,channelId,channelName}); 
            return (channel.toObject() as IChannel); 
        } catch (error) {   
            return error as BasicError;
        }
    }

    updateActive = async (userId: string, serverId: string): Promise<ISuccess | BasicError> => {
        try {
            const updated = await UserModel
            .updateOne(
              { _id: userId, 'serversJoined.serverId': serverId },
              { $set: { 'serversJoined.$.lastActive': new Date() } }
            ) as UpdatedDocument; 
            if (updated.nModified === 1) return {success: true}; 
            else throw (new BasicError()); 
        } catch (error) {
            return error as BasicError; 
        }
    }

    getActiveUsers = async (serverId: string): Promise<IUser[] | BasicError> => {
        try {
            const now = new Date();
            now.setMinutes(now.getMinutes() - 5);
            const users = await UserModel
              .find({ 
                $and: [
                    { "serversJoined.serverId": serverId },
                    { "serversJoined.lastActive": { $gt: now } },
                  ],
              }, { _id: 0, username: 1 })
            return users; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    getUnactiveUsers = async (serverId: string): Promise<IUser[] | BasicError> => {
        try {
            const now = new Date();
            now.setMinutes(now.getMinutes() - 5);
            const users = await UserModel
              .find({
                $and: [
                    { 'serversJoined.serverId': serverId },
                    { 'serversJoined.lastActive': { $lt: now } },
                  ],
              }, { _id: 0, username: 1 })
            return users; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    getServerModel = async (serverId: string): Promise<IServerModel | BasicError> => {
        try {
            const serverRes = await ServerModel.findOne({serverId}); 
            return serverRes; 
        } catch (error) {
            return  error as BasicError; 
        }
    }

    deleteServer = async (serverId: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            const server = await this.getServerModel(serverId); 
            if (server instanceof Error) throw (server); 
            if (server.ownerId !== userId) {
                throw (new BasicError(ErrorCode.Unauthorized, `Must be owner of server to delete`)); 
            }
            await UserModel.updateMany(
              { 'serversJoined.serverId': serverId },
              { $pull: { serversJoined: { serverId: serverId }  } }
            )
          const channelInventory = await ChannelModel.find({ serverId: serverId }, { _id: 0, channelId: 1 })

          const msgDeletions = channelInventory.map(async (channel) => {
             return await ServerMessageModel.deleteMany({ serverId, channelId: channel.channelId }) 
          })
          const msgsDeleted = await Promise.all(msgDeletions); 
          console.log('msgsDeleted ', msgsDeleted); 
          await ChannelModel.deleteMany({ serverId: serverId })

        //   const deleted = await ServerModel.deleteOne({ serverId: serverId })
          const deleteRes = await server.remove(); 
          
          if (server === deleteRes) return {success: true};
          else throw (new BasicError());
        } catch (error) {
            return error as BasicError; 
        }
    }


    deleteMsg = async (serverId: string, channelId: string, msgId: string, sizeOfFile: (key: string, bucket: string) => Promise<number | BasicError> ): Promise<ISuccess | BasicError> => {
        try {
            const msg = await this.getMsg(serverId,channelId,msgId); 
            if ('code' in msg || msg instanceof Error) throw (msg);
            const msgSize = await this.getMessageSize(msg,sizeOfFile);
            if (msgSize instanceof Error) throw (msgSize);
            const updatedMsg = await ServerMessageModel.updateOne({serverId,channelId,msgId}, {
                                                                                             deleted: true
                                                                                        });  
            if (updatedMsg.nModified !== 1) throw (new BasicError());
            const deleted = await ServerMessageModel.deleteOne({serverId,channelId,msgId}); 
            console.log('the deleted ', deleted);
            if (deleted.deletedCount !== 1) throw (new BasicError()); 
            // const updatedServer = await ServerModel.updateOne({serverId}, {
            //                                                           $inc: {
            //                                                               size: -(msgSize)
            //                                                           }
            //                                                         }) as UpdatedDocument; 
            // console.log('the updated Server ', updatedServer )
            // if (updatedServer.nModified === 1) return {success: true}; 
            // else throw (new BasicError()); 
        } catch (error) {
            console.log('what is our error ', error);
            return error as BasicError; 
        }
    }

    deleteChannel = async (serverId: string, channelId: string): Promise<ISuccess | BasicError> => {
        try {
          const deletedMsgs = await ServerMessageModel.deleteMany({ channelId: channelId })
          const deletedChannel = await ChannelModel.deleteOne({ serverId: serverId, channelId: channelId })
          if (deletedChannel.deletedCount === 1) return {success: true}; 
        } catch (error) {
          throw error as BasicError;
        }
    };

    getMsg = async (serverId: string, channelId: string, msgId: string): Promise<IServerMessageModel | BasicError> => {
        try {
            const msg = await ServerMessageModel.findOne({serverId,channelId,msgId}); 
            console.log('the msg ', msg);
            if (msg !== null && msg !== undefined) return msg; 
            else throw (new BasicError(ErrorCode.NotFound, `Could not find message to delete`)); 
        } catch (error) {
            console.log('the msg ', error);
            return error as BasicError; 
        }
    }
    
    changeServerTier = async (serverId: string, tier: SERVERTIER): Promise<ISuccess | BasicError> => {
        try {
            const updated = await ServerMessageModel.updateOne({serverId}, {
                                                                          tier
                                                                     }) as UpdatedDocument; 
            if (updated.nModified === 1) return {success:true}; 
            else throw (new BasicError());                                                                    
        } catch (error) {
            return error as BasicError
        }
    }

    findMessage = async (serverId: string, msgId: string): Promise<IServerMessage | BasicError> => {
        try {
            const res = await ServerMessageModel.findOne({serverId,msgId}); 
            return (res.toObject() as IServerMessage); 
        } catch (error) {
            return error as BasicError; 
        }
    }

    getServerMessageFileUrls = (msg: IServerMessage, getUrl: (key: string) => string): string[] | BasicError => {
        try {
            const urls: string[] = [];
            msg.fileKeys.forEach((key: string) => {
              const url = getUrl(key);
              urls.push(url);
            })
            return urls;  
        } catch (error) {
            return error as BasicError; 
        }
    }

    savedMessages = async (serverId: string, limit: number, cursor: string | null): Promise<IServerMessageConnection | BasicError> => {
        try {
            const cursorTime = (cursor !== null && cursor !== 'null') ? new Date(this.fromCursorHash(cursor)) : null;

            const match = {
                            // no cursor is needed for the first query
                        ...(cursorTime && {
                            timestamp: {
                            $lt: cursorTime, //MORA NEW DATE(), sa toISOString ne radi
                            },
                        }),
                        $and:[
                                {
                                  isSaved: true
                                },
                                {
                                   serverId: serverId
                                },
                            
                            ],
                       };
            const savedMessages = await ServerMessageModel.aggregate([
                                                { $match: match },
                                                {
                                                    $sort: {
                                                      createdAt: -1,
                                                    },
                                                },
                                                {
                                                   $limit: limit + 1,
                                                }
                                                ]).exec() as IServerMessage[];
                
            const hasNextPage = savedMessages.length > limit;
            const edges = hasNextPage ? savedMessages.slice(0, -1) : savedMessages;
            return {    
                    serverId,
                    edges,
                    pageInfo: {
                        hasNextPage,
                        endCursor: this.toCursorHash(
                            edges[edges.length - 1]?.createdAt.toString(),
                        ),
                    }
            }
        } catch (error) {
            console.log('is there something ', error);
            return error as BasicError;
        }
    }

    saveMessage = async (serverId: string, msgId: string): Promise<ISuccess | BasicError>=> {
        try {
            const res = await ServerMessageModel.findOne({serverId,msgId}) 
            const resp = await ServerMessageModel.updateOne({serverId,msgId}, {
                                                                        
                                                                                 isSaved: true
                                                                               

                                                                            }) as UpdatedDocument; 
     
            if (resp instanceof BasicError) throw (resp);
            if (resp.nModified === 1) return {success:true}; 
            else throw (resp);
        } catch (error) {
            return error as BasicError; 
        }
    }

    unsaveMessage = async (serverId: string, msgId: string): Promise<ISuccess | BasicError> => {
        try {
            const resp = await ServerMessageModel.findOne({serverId,msgId}) 
            const res = await ServerMessageModel.updateOne({serverId,msgId}, {
                                                                         
                                                                                isSaved: false
                                                                        
                                                                       }) as UpdatedDocument;
            if (res instanceof BasicError) throw (res);
            if (res.nModified === 1) return {success:true}; 
            else throw (res);
        } catch (error) {
            return error as BasicError; 
        }
    }

    // UNDER REVIEW ==> determine if updateOne would be better 
    updateServerSize = async (serverId: string, sizeOfMsg: number): Promise<ISuccess | BasicError> => {
        try {   
            const res = await ServerModel.findOne({serverId});
            const newSize = res.size + sizeOfMsg; 
            res.size = newSize; 
            const updated = await res.save();
            if ('serverId' in updated) return {success:true};
            else throw (new BasicError())
        } catch (error) {   
            console.log('the error ', error);
            return error as BasicError; 
        }
    }

    sizeOfServerMessages = async (serverId: string, sizeOfFile: (key: string, bucket: string) => Promise<number | BasicError>): Promise<number | BasicError> => {
        try {
            const size: {_id: string, combined_object_size: number}[] = await ServerMessageModel.aggregate([
               {  $match: { serverId } },
                {
                    $group: {
                        '_id': '$_id',
                        'combined_object_size': { $sum: { $bsonSize: '$$ROOT' } }
                    }
                }
            ]);
            let sum = 0; 
            if (size && size !== undefined) {
                (size as MessageSize[]).forEach((object: MessageSize) => {
                    sum = sum + object.combined_object_size;
                });
            }
            const sizeFiles = await this.sizeOfServerFiles(serverId,sizeOfFile);
            if (sizeFiles instanceof BasicError) throw (sizeFiles);
        } catch (error) {
            return error as BasicError; 
        }
    }

    sizeOfServerFiles = async (serverId: string, sizeOfFile: (key: string, bucket: string) => Promise<number | BasicError>): Promise<number | BasicError> => {
        try {
            const listOfSizePromises: Promise<number | BasicError>[] = [];
            const msgsWithFiles = await ServerMessageModel.find({serverId,'fileKeys.0': {$exists:true}});
            msgsWithFiles.forEach((msg: IServerMessageModel) => {
                const keys = msg.fileKeys; 
                if (keys && keys.length === 0) return;
                const newKeyPromise = keys.map(async (key) => {
                   return await sizeOfFile(key,process.env.AWS_BUCKET_NAME);
                });
                listOfSizePromises.push(...newKeyPromise);
            })
            if (listOfSizePromises === undefined) throw (new BasicError());
            let sum = 0; 
            const listOfSizes = await Promise.all(listOfSizePromises);
            listOfSizes.forEach((size: number | BasicError) => {
                if (size instanceof BasicError) return; 
                sum = sum + size; 
            })
            return sum; 
        } catch (error) {
            return error as BasicError; 
        }
    } 

    renameChannel = async (serverId: string, channelId: string, name: string): Promise<ISuccess | BasicError> => {
        try {
            const updated = await ChannelModel.updateOne(
                { serverId: serverId, channelId: channelId },
                { $set: { channelName: name } }) as UpdatedDocument
            if (updated.nModified === 1) return {success:true};
            else throw (updated);
        } catch (error) {
            return error as BasicError; 
        }
    }

    renameServer = async (serverId: string, name: string): Promise<ISuccess | BasicError> => {
        try {
            const updated = await ServerModel.updateOne(
                { serverId: serverId },
                { $set: { serverName: name } })
            if (updated.nModified === 1) return {success:true};
            else throw (updated);
        } catch (error) {
            return error as BasicError; 
        }
    }

    changeOwner = async (serverId: string, username: string): Promise<void | BasicError> => {
        
        try {
          await ServerModel
            .updateOne(
              { serverId: serverId },
              { $set: { ownerId: username } })
          const isAdmin = await this.isUserAdmin(serverId, username); 
          if (isAdmin) {
            await this.removeAdmin(serverId, username)
          }
        } catch (error) {
            return error as BasicError; 
        }
    }

    getMessageSize = async (msg: IServerMessageModel, sizeOfFile: (key: string, bucket: string) => Promise<number | BasicError>): Promise<number | BasicError> => {
        try {
            let msgSum = 0; 
            // const sizeOfMsg = bson.calculateObjectSize(msg.toObject()); 
            // msgSum = msgSum + sizeOfMsg
            const listOfSizePromises: Promise<number | BasicError>[] = [];
            if (msg.fileKeys.length > 0) {
                const keys = msg.fileKeys; 
                if (keys && keys.length === 0) return;
                const newKeyPromise = keys.map(async (key) => {
                   return await sizeOfFile(key,process.env.AWS_BUCKET_NAME);
                });
                listOfSizePromises.push(...newKeyPromise);
                const listOfSizes = await Promise.all(listOfSizePromises);
                if (listOfSizes.length > 0 && listOfSizes[0] !== undefined) {
                    listOfSizes.forEach((size: number | BasicError) => {
                        if (size instanceof BasicError) throw (size); 
                        msgSum = msgSum + size; 
                    })
                }
            }
            return msgSum; 
        } catch (error) {
            console.log('msgs size ', error)
            return error as BasicError; 
        }
    }

    insertMessage = async (msg: IIncomingServerMessage, sizeOfFile: (key: string, bucket: string) => Promise<number | BasicError>): Promise<IServerMessage| BasicError> => {
        try {
              const msgId = this.generateId();
              const message = {
                serverId: msg.serverId,
                channelId: msg.channelId,
                fromId: msg.fromId,
                msg: msg.msg,
                msgId: msgId,
                fileKeys: msg.fileKeys,
                createdAt: msg.createdAt,
              };
              
              const serverMessage: IServerMessageModel = await ServerMessageModel.create({
                                                                                serverId: msg.serverId,
                                                                                channelId: msg.channelId,
                                                                                fromId: msg.fromId,
                                                                                msg: msg.msg,
                                                                                msgId: msgId,
                                                                                reactions: {
                                                                                  heart: [], 
                                                                                  thumbsup: [],
                                                                                  thumbsdown: [],
                                                                                  pray: [], 
                                                                                  raised_hands: []
                                                                                },
                                                                                fileKeys: msg.fileKeys,
                                                                                createdAt: msg.createdAt
                                                                            });
                 await serverMessage.save()
                 const msgSize = await this.getMessageSize(serverMessage,sizeOfFile);
                 if (msgSize instanceof Error) throw (msgSize)
                console.log('the server message ', serverMessage);
                 const { serverId } = msg; 
                 const serverUpdated = await this.updateServerSize(serverId,msgSize);
                 if ('code' in serverUpdated) throw (serverUpdated);
                 return (serverMessage.toObject() as IServerMessage);
        
        } catch (error) {
            console.log('our error after insert ', error);
            return error as BasicError; 
        }
    }

    loadChannelMsgs = async (serverId: string, channelId: string, cursor: string | null, limit: number): Promise<IServerMessageConnection | BasicError> => {
        try {
            const cursorTime = (cursor !== null && cursor !== 'null') ? new Date(this.fromCursorHash(cursor)) : null;
            console.log('cursorTue ', cursorTime); 
            const match = {  
                            // no cursor is needed for the first query
                        ...(cursorTime && {
                            createdAt: {
                              $lt: cursorTime, //MORA NEW DATE(), sa toISOString ne radi
                            },
                           }),
                            $and:[
                                {
                                'channelId': channelId
                                },
                                {
                                'serverId': serverId
                                },

                                {
                                  'deleted': false,
                                }
                            ],
                         } 
            const msgs = await ServerMessageModel.aggregate([
                                                            { $match: match },
                                                            {
                                                                $sort: {
                                                                 createdAt: -1,
                                                                },
                                                            },
                                                            {
                                                            $limit: limit + 1,
                                                            },
                                                           ]).exec() as IServerMessage[];
            const hasNextPage = msgs.length > limit;

           
            const edges = hasNextPage ? msgs.slice(0, -1) : msgs;
            console.log('edges1 ', edges[0].createdAt) 
            console.log('edgeslast ', edges[edges.length-1].createdAt)
            const endCursor =  this.toCursorHash(
                     edges[edges.length-1]?.createdAt.toString(),
            )
            console.log('the cursor ', endCursor); 
            return {
                serverId,
                channelId, 
                edges,
                pageInfo: {
                    hasNextPage,
                    endCursor: endCursor
                }
            }
        } catch (error) {
            return error as BasicError;
        }
    }

    loadServerMsgs = async (serverId: string, limit: number): Promise<IChannelData[] | BasicError> => {
        try {
            const channelList = await ChannelModel.find({serverId: serverId}, { channelId: 1, channelName: 1, _id: 0});
            const channelData: IChannelData[] = [];
            channelList.map(async (channel) => {
                const { channelId, channelName } = channel; 
                const match = {
                                $and:[
                                    {
                                    'channelId': channelId
                                    },
                                    {
                                    'serverId': serverId
                                    },
                                ],
                              };
                const msgs = await ServerMessageModel.aggregate([
                                        { $match: match },
                                        {
                                            $sort: {
                                              timestamp: -1,
                                            },
                                        },
                                        {
                                           $limit: limit + 1,
                                        },
                                        ]).exec() as IServerMessage[];
                const data = { serverId,
                               channelId,
                               channelName,
                               msgs }; 
                channelData.push(data);
            })
            return channelData; 
        } catch (error) {   
            return error as BasicError; 
        }
    }

    userIsOwner = async (serverId: string, userId: string): Promise<boolean | BasicError> => {
        try {
            const serverModel = await ServerModel.findOne({ serverId: serverId, ownerId: userId })
            return !!serverModel
        } catch (error) {
            return error as BasicError; 
        }
    }

    addAdmin = async (serverId: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            const updated = await ServerModel.updateOne({serverId}, {
                                                                    $push: {
                                                                       'admins': userId 
                                                                    }
                                                                  }) as UpdatedDocument; 
            if (updated.nModified === 1) return {success: true};
            else throw (new BasicError());
        } catch (error) {
            return error as BasicError; 
        }
    }


    getServerSavedFiles = async (serverId: string, channelId: string, limit: number, cursor: string | null): Promise<IServerFileConnection | BasicError> => {
        try {
                const cursorTime = (cursor !== null && cursor !== 'null') ? new Date(this.fromCursorHash(cursor)) : null;
                const match = {  
                                // no cursor is needed for the first query
                            ...(cursorTime && {
                                createdAt: {
                                    $lt: cursorTime, //MORA NEW DATE(), sa toISOString ne radi
                                },
                               }),
                                $and:[
                                    {
                                    'channelId': channelId
                                    },
                                    {
                                    'serverId': serverId
                                    },
                                    
                                ],
                             } 
                const msgs = await ServerFileModel.aggregate([
                                                                { $match: match },
                                                                {
                                                                    $sort: {
                                                                     createdAt: -1,
                                                                    },
                                                                },
                                                                {
                                                                $limit: limit + 1,
                                                                },
                                                               ]).exec() as IServerFile[];
                const hasNextPage = msgs.length > limit;
                const edges = hasNextPage ? msgs.slice(0, -1) : msgs;
                return {
                    edges,
                    pageInfo: {
                        hasNextPage,
                        endCursor: this.toCursorHash(
                            edges[edges.length-1]?.createdAt.toString(),
                        ),
                    }
                }
            } catch (error) {
                return error as BasicError;
            }
    }


    addFileToServerSaved = async (key: string, serverId: string, channelId: string): Promise<ISuccess | BasicError> => {
        try { 
            const res = await ServerFileModel.create({key,
                                                      serverId,
                                                      channelId})

            if (res._id) return {success:true}; 
            else throw (new BasicError(ErrorCode.BadRequest,'Could not save file to server drive')); 
        } catch (error) {
            return error as BasicError; 
        }
    }

}
 
export default MongoDBServerRepo; 


