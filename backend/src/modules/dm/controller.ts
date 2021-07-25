/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Request, Response } from 'express';
import { Service } from 'typedi';
import { IUser, IUserRepo } from '../user/interfaces';
import { BasicError, ISuccess } from '../__shared__/error';
import { ICloudServiceRepo } from '../__shared__/interfaces';
import { IConversation, IDirectMessage, IDirectMessageRepo, IDMConnection, IDMUserGroupList, IIncomingPrivateMessage } from './interfaces';


@Service()
class DirectMessageController {

    public dmRepo: IDirectMessageRepo;
    public userRepo: IUserRepo; 
    public cloudService: ICloudServiceRepo;

    constructor (dm?: IDirectMessageRepo, user?: IUserRepo, cloud?: ICloudServiceRepo) {
       this.dmRepo = dm; 
       this.userRepo = user; 
       this.cloudService = cloud; 
    }

    dmGroupExists = async (fromId: string, toIds: string[]): Promise<boolean | BasicError> => {
        try {
            const resp = await this.dmRepo.dmGroupExists(fromId,toIds);
            if (resp instanceof Error) throw (resp);
            return resp; 
        } catch (error) {
            console.log('dm pair eists error ', error);
            return error as BasicError; 
        }
    }

    getDMUsers = async (userId: string): Promise<IDMUserGroupList | BasicError> => {
        try {
            const { findUser } = this.userRepo; 
            const resp = await this.dmRepo.getDMUsers(userId,findUser);
            if ('code' in resp || resp instanceof Error) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    getConversation = async (fromId: string, toIds: string[], start: number, end: number, limit: number): Promise<IDMConnection | BasicError> => {
        try {
            const res = await this.dmRepo.getConversation(fromId,toIds,start,end,limit);
            if ('code' in res || res instanceof Error) throw (res);
            return res;
        } catch (error) {
            console.log('the error in controller ', error);
            return error as BasicError; 
        }
    }

    loadConversation= async (req: Request, res: Response): Promise<IDirectMessage[] | BasicError> => {
        try {
            const { from, to, limit, cursor } = req.query as {from: string, to: string, limit: string, cursor: string | null}; 
            const limitAsInt = parseInt(limit);
            const resp = await this.dmRepo.loadConversation(from,to,cursor,limitAsInt);
            if ('code' in resp || resp instanceof Error) throw (resp);
            res.status(200).json(resp);
            return resp
        } catch (error) {
            return error as BasicError; 
        }
    } 



    loadDMGroups = async (req: Request, res: Response): Promise<IDirectMessage[] | BasicError> => {
        try {
            const { userId } = req.query as {userId: string};
            const { findUser } = this.userRepo; 
            const resp: IDirectMessage[] | BasicError = await this.dmRepo.loadDMGroups(userId,findUser);
            if ('code' in resp || resp instanceof BasicError) throw (resp);
            resp.forEach((msgLog) => {
                msgLog.conversation.forEach((conversationMsg) => {
                    conversationMsg.cloudService = this.cloudService;
                })
            })
            res.status(200).json(resp);
            return resp; 
        } catch (error) {
            res.status(400).send();
            return error as BasicError; 
        }
    }

    insertDM = async (req: Request, res: Response): Promise<IConversation | BasicError>=> {
        try {   
            const { msg } = req.body as {msg: IIncomingPrivateMessage};
            const resp: IConversation | BasicError = await this.dmRepo.insertDM(msg);
            if ('code' in resp) throw (resp);
            res.status(200).json(resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    addMsg = async (msg: IIncomingPrivateMessage): Promise<IConversation | BasicError> => {
        try {
            const resp: IConversation | BasicError = await this.dmRepo.insertDM(msg);
            if ('code' in resp) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    deleteMsg = async (msgId: string, fromId: string, toId: string): Promise<ISuccess | BasicError> => {
        try {
            const res: ISuccess | BasicError = await this.dmRepo.deleteDM(msgId,fromId,toId);
            if ('code' in res || res instanceof Error) throw (res);
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    sendDMFromServer = async (fromUserId: string, toUserId: string, msg: IIncomingPrivateMessage): Promise<IConversation | BasicError> => {
        try {
            const resp = await this.dmRepo.dmGroupExists(fromUserId, [toUserId]);
            if (resp instanceof Error) throw (resp); 
            if (resp === true) {
               const resp: IConversation | BasicError = await this.dmRepo.insertDM(msg);
               if ('code' in resp || resp instanceof Error) throw (resp);
               return resp;  
            } else {
                const { addDMGroup} = this.userRepo; 
                const resp = await this.dmRepo.startDM(fromUserId,[toUserId],addDMGroup);
                if ('code' in resp || resp instanceof Error) throw (resp);
                const insertResp: IConversation | BasicError = await this.dmRepo.insertDM(msg);
                if ('code' in insertResp || insertResp instanceof Error) throw (resp);
                return insertResp;  
            }
        } catch (error) {
            return error as BasicError; 
        }
    }

    /*
    startDM = async (fromId: string, toIds: string[]): Promise<any | BasicError> => {
        try {
          const { addDMGroup } = this.userRepo; 
          const resp: unknown | BasicError = await this.dmRepo.startDM(fromId,toIds,addDMGroup);
          if (resp instanceof BasicError) throw (resp);
        } catch (error) {
            return error as BasicError; 
        }
    }
    */ 

    startNewDM = async (fromId: string, toIds: string[]): Promise<IDirectMessage | BasicError> => {
        try {
          const { addDMGroup } = this.userRepo; 
          const resp: IDirectMessage | BasicError = await this.dmRepo.startDM(fromId,toIds,addDMGroup);
          if (resp instanceof BasicError) throw (resp);
          return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }


    removeDMConvo = async (fromId: string, toIds: string[]): Promise<ISuccess | BasicError> => {
        try {
            const { deleteDMGroup } = this.userRepo; 
            const resp: ISuccess | BasicError = await this.dmRepo.removeDMConvo(fromId,toIds,deleteDMGroup)
            if ('code' in resp || resp instanceof Error) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }


    checkUsersConnected = async (fromId: string, toId: string): Promise<boolean | BasicError> => {
        try {
            const { findUser } = this.userRepo; 
            const from = await findUser(fromId); 
            if (from instanceof Error) throw (from); 
            const to = await findUser(toId); 
            if (to instanceof Error) throw (to); 
            if (from.connections.includes(toId) && to.connections.includes(fromId)) return true; 
            else return false; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    
}

export default DirectMessageController; 