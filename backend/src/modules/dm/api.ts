/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { RESTDataSource } from "apollo-datasource-rest";
import { IUser } from "../user/interfaces";
import { BasicError, ISuccess } from "../__shared__/error";
import { IDirectMessage, IDMLog, IIncomingPrivateMessage } from "./interfaces";

class DirectMessageAPI extends RESTDataSource {

    constructor() {
        super();
        this.baseURL = process.env.NODE_ENV === 'production' ? `https://www.thndr.tv/dm` : `http://localhost:4000/dm`; 
    }

    getDMUsers = async (userId: string): Promise<IUser[] | BasicError> => {
        try {
            const resp = await this.get<IUser[] | BasicError>(`/dm-users`, { userId }); 
            return resp;
        } catch (error) {
            return error as BasicError; 
        }
    }

    loadConversation = async (from: string, to: string, limit: number, cursor: string | null): Promise<IDirectMessage[] | BasicError> => {
        try {
            const resp = await this.get<IDirectMessage[] | BasicError>(`/convo`, { to,
                                                                                   from,
                                                                                   limit,
                                                                                   cursor }); 
            if ('code' in resp || resp instanceof Error) throw (resp);
            return resp;
        } catch (error) {
            return error as BasicError; 
        }
    } 

    loadDM = async (fromUserId: string, toUserId: string, cursor: string, limit: number): Promise<IDirectMessage | BasicError> => {
        try {
            const resp = await this.get<IDirectMessage | BasicError>(`/load-dm/${limit}`, { fromUserId,
                                                                                            toUserId,
                                                                                            cursor  });
            if (resp instanceof Error) throw (resp); 
            return resp;
        } catch (error) {
            return error as BasicError; 
        }
    }

    loadDMs = async (userId: string): Promise<IDMLog | BasicError> => {
        try {
            const resp = await this.get<IDirectMessage[] | BasicError>(`/pms`, {userId});
            if (resp instanceof BasicError) throw (resp);
            return {chatMsgs:resp};
        } catch (error) {
            return error as BasicError; 
        }
    }

    startDM = async (fromUserId: string, toUserId: string): Promise<IDirectMessage| BasicError> => {
        try {
            const resp = await this.post<IDirectMessage | BasicError>(`/start-dm`, {from: fromUserId, to: toUserId})
            if ('code' in resp) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    dmExists = async (fromUserId: string, toUserId: string): Promise<boolean | BasicError> => {
        try {
            const resp = await this.post<boolean | BasicError>(`/dm-exists`, {from: fromUserId, to: toUserId})
            if (resp instanceof Error) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    insertMessage = async (msg: IIncomingPrivateMessage): Promise<IDirectMessage | BasicError> => {
        try {
            const resp = await this.post<IDirectMessage | BasicError>(`/insert-dm`, msg)
            if ('code' in resp) throw (resp);
            return resp;  
        } catch (error) {
            return error as BasicError; 
        }
    }

    deleteMessage = async (msgId: string, fromUserId: string, toUserId: string): Promise<ISuccess | BasicError> => {
        try {
            const resp = await this.post<ISuccess | BasicError>(`/delete-dm`, {msgId,fromUserId,toUserId})
            if ('code' in resp) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }
}
export default DirectMessageAPI ; 