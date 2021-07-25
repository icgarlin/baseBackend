/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Request, Response } from "express";
import { IServerJoined, IUser, IUserRepo } from "../user/interfaces";
import { BasicError, ISuccess } from "../__shared__/error";
import { ICloudServiceRepo, IFileRepo, IReactionsRepo } from "../__shared__/interfaces";
import { IChannel, IChannelData, IIncomingServerMessage, IServerData, IServerFileConnection, IServerMessage, IServerMessageConnection, IServerRepo } from "./interfaces";
import { SERVERTIER } from "./types";

class ServerController {
    
    private serverRepo: IServerRepo;
    private reactionRepo: IReactionsRepo;
    public userRepo: IUserRepo;  
    public cloudRepo: ICloudServiceRepo; 
    public blobRepo: IFileRepo;  
    constructor (server: IServerRepo, user: IUserRepo, reaction: IReactionsRepo, cloud: ICloudServiceRepo, blob: IFileRepo) {
       // database management system 
       this.serverRepo = server;
       this.reactionRepo = reaction; 
       this.userRepo = user; 
       this.blobRepo = blob; 
       // Cloudfront 
       this.cloudRepo = cloud;
    }

    // FIXME 
    insertMessage = async (req: Request, res: Response): Promise<IServerMessage | BasicError> => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const { msg } = req.body; 
            const { sizeOfFile } = this.blobRepo; 
            const resp = await this.serverRepo.insertMessage(msg,sizeOfFile); 
            if ('code' in resp) throw (resp); 
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    getServerMembers = async (serverId: string): Promise<{ids: string[]} | BasicError> => {
        try {
            const { getServerMembers } = this.userRepo
            const res = await getServerMembers(serverId); 
            if (res instanceof Error) throw (res); 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    getUserServerList = async (req: Request, res: Response): Promise<IServerData[] | BasicError> => {
        try {
            const { userId } = req.query as {userId: string}; 
            const { getUserServers } = this.userRepo;
            const resp: IServerData[] | BasicError = await this.serverRepo.getUserServerList(userId,getUserServers);
            if (resp instanceof BasicError) throw (BasicError);
            res.status(200).send(resp); 
            return resp; 
        } catch (error) {  
            return error as BasicError; 
        }
    }

    queryUserServerList = async (userId: string): Promise<IServerData[] | BasicError> => {
        try {
            // const { userId } = req.query as {userId: string}; 
            const { getUserServers } = this.userRepo;
            const resp: IServerData[] | BasicError = await this.serverRepo.getUserServerList(userId,getUserServers);
            if (resp instanceof BasicError) throw (BasicError);
            return resp; 
        } catch (error) {  
            return error as BasicError; 
        }
    }

    loadChannelMsgs = async (serverId: string, channelId: string, cursor: string | null, limit: number): Promise<IServerMessageConnection | BasicError> => {
        try {
       
            const data: IServerMessageConnection | BasicError = await this.serverRepo.loadChannelMsgs(serverId,
                                                                                                      channelId,
                                                                                                      cursor,
                                                                                                      limit);
                                                                            
            if ('code' in data || data instanceof Error) throw (data);  
            return data; 
        } catch (error) {
            console.log('did an errro', error); 
            return error as BasicError; 
        }
    }


    loadServerMsgs = async (req: Request, res: Response): Promise<IChannelData[] | BasicError> => {
        try {
            const { serverId } = req.query as { serverId: string }; 
            const { limit } = req.body as {limit: number};
            const resp: IChannelData[] | BasicError = await this.serverRepo.loadServerMsgs(serverId,limit);
            if (resp instanceof Error) throw (resp);
            res.status(200).send(resp);
            return resp; 
        } catch (error) {
            res.status(400).send();
            return error as BasicError; 
        }
    }

    createNewServer = async (serverName: string, channelName: string, ownerId: string): Promise<IServerData | BasicError> => {
        try {
            const newServer: IServerData | BasicError = await this.serverRepo.createServer(serverName,channelName,ownerId);
            if (newServer instanceof Error) throw (newServer);
            return newServer; 
        } catch (error) {
            return error as BasicError;  
        }
    }

    joinServer = async (serverId: string, userId: string, inviteCode: string): Promise<IServerData | BasicError> => {
        try {
            const response = await this.serverRepo.joinServer(serverId,userId,inviteCode);
            if ('code' in response || response instanceof Error) throw (response); 
            return response; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    removeUserFromServer = async (serverId: string, userId: string, removeId: string): Promise<ISuccess | BasicError> => {
        try {
            const res = await this.isUserAdmin(serverId,userId); 
            if (res instanceof Error) throw (res); 
            const { removeServerId } = this.userRepo; 
            const response = await this.serverRepo.leaveServer(serverId,removeId,removeServerId);
            if (response instanceof Error) throw (response);
            return response; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    isServerOwner = async (serverId: string, userId: string): Promise<boolean | BasicError> => {
        try {
            const response = await this.serverRepo.userIsOwner(serverId,userId);
            if (response instanceof Error) throw (response);
            return response; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    isUserAdmin = async (serverId: string, userId: string): Promise<boolean | BasicError> => {
        try {
             const isAdmin = await this.serverRepo.isUserAdmin(serverId,userId);    
             if (isAdmin instanceof Error) throw (isAdmin);        
             return isAdmin; 
        } catch (error) {
            return error as BasicError; 
        }
    }
 
    promoteUserToAdmin = async (req: Request, res: Response): Promise<ISuccess | BasicError> => {
        try {
            const { serverId, userId } = req.body as {serverId: string, userId: string};
            if (!userId || !serverId) {
              res.status(201).send("Invalid parameters entered");
            } else {
               const isAdmin = await this.serverRepo.isUserAdmin(serverId,userId);
              if (isAdmin) {
                res.status(201).send(`${userId} is already an admin`)
              } else {
                const resp = await this.serverRepo.addAdmin(serverId, userId);
                if (resp instanceof BasicError) throw (resp);
                res.status(200).send(`${userId} promoted to admin`);
                return resp; 
              }
            }
        } catch (error) {
            return error as BasicError; 
        }
    }

    demoteUserFromAdmin = async (req: Request, res: Response): Promise<ISuccess | BasicError> => {
        try {
            const { userId, serverId } = req.body as {userId: string, serverId: string};
            if (!userId || !serverId) {
               res.status(201).send("Invalid parameters entered");
            } else {
               const resp = await this.serverRepo.removeAdmin(serverId, userId);
               if (resp instanceof BasicError) throw (resp);
               res.status(200).send(`${userId} is no longer an admin`);
               return resp; 
            }
        } catch (error) {
            return error as BasicError; 
        }
    }

    changeServerOwner = async (req: Request, res: Response): Promise<void | BasicError>  => {
        try {
            const { serverId, userId } = req.body as {serverId: string, userId: string};
            if (!serverId || !userId) {
                  res.status(201).send("Invalid parameters entered");
              } else {
                  const response = await this.serverRepo.changeOwner(serverId,userId);
                  if (response instanceof BasicError) throw (response);
                  res.status(200);
                  return response; 
              }  
        } catch (error) {
            return error as BasicError; 
        }
    }

    updateActive = async (req: Request, res: Response): Promise<ISuccess | BasicError> => {
        try {
            const { serverId, userId } = req.body as {serverId: string, userId: string};
            const response = await this.serverRepo.updateActive(userId,serverId);
            if ('code' in response) throw (response);
            res.status(200).json(response); 
        } catch (error) {
            return error as BasicError; 
        }
    }

    getActiveUsers = async (req: Request, res: Response): Promise<IUser[] | BasicError>=> {
        try {
            const { serverId } = req.body as {serverId: string};
            if (!serverId) {
                  res.status(201).send("Invalid parameters entered");
              } else {
                  const response = await this.serverRepo.getActiveUsers(serverId);
                  if (response instanceof BasicError) throw (response);
                  res.status(200).json(response);
                  return response; 
              } 
        } catch (error) {
            return error as BasicError; 
        }
    }

    getUnactiveUsers = async (req: Request, res: Response): Promise<IUser[] | BasicError> => {
        try {
            const { serverId } = req.body as {serverId: string};
            if (!serverId) {
                res.status(201).send("Invalid parameters entered");
              } else {
                const response = await this.serverRepo.getUnactiveUsers(serverId);
                if (response instanceof BasicError) throw (response);
                res.status(200).json(response);
                return response; 
            } 
        } catch (error) {
            return error as BasicError; 
        }
    }

    saveMsg = async (serverId: string, msgId: string): Promise<ISuccess | BasicError> => {
        try {
             const response = await this.serverRepo.saveMessage(serverId, msgId);
             if ('code' in response || response instanceof Error) throw (response);
             return response; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    unsaveMsg = async (serverId: string, msgId: string): Promise<ISuccess | BasicError> => {
        try {
            const response = await this.serverRepo.unsaveMessage(serverId, msgId);
            if ('code' in response || response instanceof Error) throw (response);
            return response; 
        } catch (error) {
            return error as BasicError; 
        }
    }
   
    getSavedMsgs = async (req: Request, res: Response): Promise<IServerMessageConnection | BasicError> => {
        try {
            const { serverId, limit, cursor } = req.query as {serverId: string, limit: string, cursor: string | null}; 
            const limitAsInteger = parseInt(limit);
            if (!serverId) {
                res.status(201).send("Invalid parameters entered");
              } else {
                const response = await this.serverRepo.savedMessages(serverId,limitAsInteger,cursor);
                if (response instanceof BasicError) throw (response);
                res.status(200).json(response);
                return response; 
            } 
        } catch (error) {
            return error as BasicError; 
        }
    }

    pickMsgReaction = async (req: Request, res: Response): Promise<ISuccess | BasicError> => {
        try {
            const { serverId, userId, type } = req.body as {serverId: string, userId: string, type: string};
            switch (true) {
                case type === 'heart':
                    const heartReact =  await this.reactionRepo.heartReaction(serverId,userId);
                    if (heartReact instanceof BasicError) throw (heartReact);
                    res.status(200).send(heartReact);
                    return heartReact; 
                case type === 'thumbsup':
                    const thumbsUpReact = await this.reactionRepo.thumbsUpReaction(serverId,userId);
                    if (thumbsUpReact instanceof BasicError) throw (thumbsUpReact);
                    res.status(200).send(thumbsUpReact);
                    return thumbsUpReact;
                case type === 'thumbsdown':
                    const thumbsDownReact = await this.reactionRepo.thumbsDownReaction(serverId,userId);
                    if (thumbsDownReact instanceof BasicError) throw (thumbsDownReact);
                    res.status(200).send(thumbsDownReact);
                    return thumbsDownReact;
                case type === 'pray':
                    const prayReact = await this.reactionRepo.prayReaction(serverId,userId);
                    if (prayReact instanceof BasicError) throw (prayReact);
                    res.status(200).send(prayReact);
                    return prayReact; 
                case type === 'raised_hands':
                    const raisedHandsReact = await this.reactionRepo.raisedHandsReaction(serverId,userId);
                    if (raisedHandsReact instanceof BasicError) throw (raisedHandsReact);
                    res.status(200).send(raisedHandsReact);
                    return raisedHandsReact; 
                default: 
                    throw new BasicError();
            }
        } catch (error) {
            return error as BasicError; 
        }
    }

    removeMsgReaction = async (req: Request, res: Response): Promise<ISuccess | BasicError> => {
        try {
            const { serverId, userId, type } = req.body as {serverId: string, userId: string, type: string};
            switch (true) {
                case type === 'heart':
                    const heartReact =  await this.reactionRepo.removeHeartReaction(serverId,userId);
                    if (heartReact instanceof BasicError) throw (heartReact);
                    res.status(200).send(heartReact);
                    return heartReact; 
                case type === 'thumbsup':
                    const thumbsUpReact = await this.reactionRepo.removeThumbsUpReaction(serverId,userId);
                    if (thumbsUpReact instanceof BasicError) throw (thumbsUpReact);
                    res.status(200).send(thumbsUpReact);
                    return thumbsUpReact;
               case type === 'thumbsdown':
                    const thumbsDownReact = await this.reactionRepo.removeThumbsDownReaction(serverId,userId);
                    if (thumbsDownReact instanceof BasicError) throw (thumbsDownReact);
                    res.status(200).send(thumbsDownReact);
                    return thumbsDownReact;
               case type === 'pray':
                    const prayReact = await this.reactionRepo.removePrayReaction(serverId,userId);
                    if (prayReact instanceof BasicError) throw (prayReact);
                    res.status(200).send(prayReact);
                    return prayReact; 
               case type === 'raised_hands':
                    const raisedHandsReact = await this.reactionRepo.removeRaisedHandsReaction(serverId,userId);
                    if (raisedHandsReact instanceof BasicError) throw (raisedHandsReact);
                    res.status(200).send(raisedHandsReact);
                    return raisedHandsReact; 
               default: 
                    throw new BasicError();
            }
        } catch (error) {
            return error as BasicError; 
        }
    }

    createChannel = async (req: Request, res: Response): Promise<IChannel | BasicError> => {
        try {
            const { serverId, channelName } = req.body as {serverId: string, channelName: string};
            if (channelName === '') throw (new BasicError());
            const response = await this.serverRepo.createChannel(serverId,channelName);
            if (response instanceof BasicError) throw (response);
            res.status(200).send(response);
            return response; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    renameChannel = async (serverId: string, channelId: string, name: string): Promise<ISuccess | BasicError> => {
        try {
            const response = await this.serverRepo.renameChannel(serverId,channelId,name);
            if (response instanceof BasicError) throw (response);
            return response; 
        } catch (error) {
            return error as BasicError; 
        }
    } 

    renameServer = async (req: Request, res: Response): Promise<ISuccess | BasicError> => {
        try {
            const { serverId, name } = req.body as {serverId: string, channelId: string, name: string};
            const response = await this.serverRepo.renameServer(serverId,name);
            if (response instanceof BasicError) throw (response);
            res.status(200).send(response);
            return response; 
        } catch (error) {
            return error as BasicError; 

        }
    }

    deleteServer = async (serverId: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            const response = await this.serverRepo.deleteServer(serverId,userId);
            if (response instanceof BasicError) throw (response);
            return response; 
        } catch (error) {
            return error as BasicError; 
        }
    }
 

    addMsg = async (msg: IIncomingServerMessage) => {
        try {
            const { sizeOfFile } = this.blobRepo; 
            const resp = await this.serverRepo.insertMessage(msg,sizeOfFile);
            return resp; 
        } catch (error) {   
            return error as BasicError; 
        }
    }

    deleteMsg = async (serverId: string, channelId: string, msgId: string) => {
        try {
            const { sizeOfFile } = this.blobRepo; 
            const resp = await this.serverRepo.deleteMsg(serverId,channelId,msgId,sizeOfFile); 
            if ('code' in resp || resp instanceof Error) throw (resp);
            console.log('delet msgs res ', resp);
            return resp; 
        } catch (error) {
            console.log('delete msg errror ', error);
            return error as BasicError; 

        }
    }

    getServerList = async (userId: string): Promise<IServerJoined[] | BasicError> => {
        try {
            const { getUserServers } = this.userRepo
            const resp = await getUserServers(userId);
            if ('code' in resp || resp instanceof Error) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    updateServerActive = async (userId: string, serverId: string) => {
        try {
            const resp = await this.serverRepo.updateActive(userId,serverId);
            if ('code' in resp || resp instanceof Error) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    createNewChannel = async (serverId: string, name: string): Promise<IChannel | BasicError> => {
        try {
            const resp = await this.serverRepo.createChannel(serverId,name); 
            if ('code' in resp || resp instanceof Error) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }


    deleteChannel = async (serverId: string, name: string): Promise<ISuccess | BasicError> => {
        try {
            const resp = await this.serverRepo.deleteChannel(serverId,name); 
            if ('code' in resp || resp instanceof Error) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }


    promoteToAdmin = async (serverId: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            const resp = await this.serverRepo.addAdmin(serverId,userId); 
            if ('code' in resp || resp instanceof Error) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }


    demoteAdmin = async (serverId: string, userId: string): Promise<ISuccess | BasicError>  => {
        try {
            const resp = await this.serverRepo.removeAdmin(serverId,userId); 
            if ('code' in resp || resp instanceof Error) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    changeServerTier = async (serverId: string, tier: SERVERTIER): Promise<ISuccess | BasicError> => {
        try {
            const res = await this.serverRepo.changeServerTier(serverId,tier); 
            if (res instanceof Error) throw (res); 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    connectToServerMembers = async (userId: string, serverId: string): Promise<ISuccess | BasicError> => {
        try {
            const res = await this.userRepo.getServerMembers(serverId); 
            if (res instanceof Error) throw (res); 
            const connections = res.ids.length ? res.ids.map(async (id) => {
              const isConnected = await this.userRepo.isConnection(userId,id); 
              if (isConnected instanceof Error) throw (isConnected); 
              if (!isConnected) {
                const newUser = await this.userRepo.addToConnected(userId,id); 
                if (newUser instanceof Error) return; 
                const user = await this.userRepo.addToConnected(id,userId); 
                if (user instanceof Error) return; 
                return {success:true};
              } 
            }) : []; 
            const result = await Promise.all(connections); 
            return {success:true}; 
        } catch (error) {
            return error as BasicError; 
        }
    }


    getServerSavedFiles = async (serverId: string, channelId: string, limit: number, cursor: string | null): Promise<IServerFileConnection | BasicError> => {
        try {
            const res = await this.serverRepo.getServerSavedFiles(serverId,channelId,limit,cursor); 
            if (res instanceof Error) throw (res); 
            return res; 
        } catch (error) {
            return error; 
        }
    }

    addFileToServerSaved = async (key: string, serverId: string, channelId: string): Promise<ISuccess | BasicError> => {
        try {
            const res = await this.serverRepo.addFileToServerSaved(key,serverId,channelId); 
            if (res instanceof Error) throw (res); 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }
}


export default ServerController; 