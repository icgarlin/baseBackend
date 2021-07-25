import { BasicError, ISuccess } from '../__shared__/error';
import { IChannel, IChannelData, IIncomingServerMessage, IServerData, IServerMessage, IServerMessageConnection } from './interfaces';
import { IUser } from '../user/interfaces';
import { RESTDataSource, RequestOptions } from 'apollo-datasource-rest';
import { DataSourceConfig } from 'apollo-datasource';


class ServerAPI extends RESTDataSource {

    constructor() {
       super();
       this.baseURL = process.env.NODE_ENV === 'production' ? `https://www.thndr.tv/server` : `http://localhost:4000/server`; 
       this.initialize({} as DataSourceConfig<any>);
    //    this.memoizedResults.delete 
    }

    willSendRequest = (request: RequestOptions): void => {
        if (request.method === 'POST') {
        //    console.log('the body ', request.body); 
        //    request.params.set('userId', (this.context as Context).user._id); 
        }
    }

    loadChannelMsgs = async (serverId: string, channelId: string, cursor: string | null, limit: number): Promise<IServerMessageConnection | BasicError> => {
        try {
            const resp = await this.get<IServerMessageConnection | BasicError>(`/channel-msgs`, {
                                                                                      serverId,
                                                                                      channelId,
                                                                                      limit,
                                                                                      cursor
                                                                                    }, { cacheOptions: { ttl: 0 } });
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    loadServerMsgs = async (serverId: string, limit: number): Promise<IChannelData[] | BasicError> => {
        try {
            const resp = await this.get<IChannelData[] | BasicError>(`/server-msgs/${limit}`, {serverId, limit}); 
            if ('code' in resp || resp instanceof Error) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }


    deleteMessage = async (msgId: string, serverId: string, channelId: string): Promise<ISuccess | BasicError>  => {
        try {
            const resp = await this.post<ISuccess | BasicError>(`/delete-msg`, {msgId,serverId,channelId})
            if ('code' in resp) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    insertMessage = async (msg: IIncomingServerMessage): Promise<IServerMessage | BasicError> => {
        try {
            const { serverId, channelId } = msg; 
            const resp = await this.post<IServerMessage | BasicError>(`/insert-msg?serverId=${serverId}&action=edit`, {msg: JSON.stringify(msg)}, {
                                                                                                                headers: {
                                                                                                                'Content-Type': 'application/json',
                                                                                                               }}); 
            if ('code' in resp) throw (resp);
            return resp;  
        } catch (error) {
            return error as BasicError; 
        }
    }

    updateActive = async (userId: string, serverId: string): Promise<ISuccess | BasicError>=> {
        try {
            const resp = await this.post<ISuccess | BasicError>(`/update-active`, { userId, serverId })
            if ('code' in resp) throw (resp);
            return resp;  
        } catch (error) {
            return error as BasicError;
        }
    }

    getUserServerList = async (userId: string): Promise<IServerData[] | BasicError> => {
        try {
            const resp = await this.get<IServerData[] | BasicError>(`/get-user-server-list`, {userId});
            if (resp instanceof BasicError) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    createServer = async (serverName: string, userId: string): Promise<{serverId: string, channelId: string} | BasicError> => {
        try {   
          const resp = await this.post<{serverId: string, channelId: string}>(`/create`, {serverName,userId}); 
          if (resp instanceof BasicError) throw (resp);
          return resp; 
        } catch (error) {
          return error as BasicError; 
        }
    }

    joinServer = async (serverId: string, userId: string): Promise<ISuccess | BasicError> => {
        try {   
          const resp = await this.post<ISuccess | BasicError>(`/join`, {serverId,userId}); 
          if (resp instanceof BasicError) throw (resp);
          return resp; 
        } catch (error) {
          return error as BasicError; 
        }
    }

    createChannel = async (serverId: string, channelName: string): Promise<IChannel| BasicError> => {
        try {
            const resp = await this.put<IChannel | BasicError>(`/create-channel`,
                                                                {serverId, channelName}); 
            if (resp instanceof BasicError) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError;
        }
    }

    getActiveUsers = async (serverId: string): Promise<IUser[] | BasicError> => {
        try {
            const resp = await this.get<IUser[] | BasicError>(`/activeusers`,serverId); 
            if (resp instanceof Error) throw (resp);
            return resp
        } catch (error) {
            return error as BasicError; 
        }
    }

    getUnactiveUsers = async (serverId: string): Promise<IUser[] | BasicError> => {
        try {
            const resp = await this.get<IUser[] | BasicError>(`/unactiveusers`,serverId); 
            if (resp instanceof Error) throw (resp);
            return resp
        } catch (error) {
            return error as BasicError; 
        }
    }

    saveMessage = async (serverId: string, msgId: string): Promise<ISuccess | BasicError> => {
        try {
            const resp = await this.post<ISuccess | BasicError>(`/msg/save`,
                                                                {serverId, msgId}); 
            if (resp instanceof BasicError) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    unsaveMessage = async (serverId: string, msgId: string): Promise<ISuccess | BasicError> => {
        try {
            const resp = await this.post<ISuccess | BasicError>(`/msg/unsave`,
                                                                {serverId, msgId}); 
            if (resp instanceof BasicError) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    savedMessages = async (serverId: string, limit: number, cursor: string | null): Promise<IServerMessageConnection | BasicError> => {
        try {
            const resp = await this.get<IServerMessageConnection | BasicError>(`/saved`, {serverId, limit, cursor});
            if (resp instanceof BasicError) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    updateServerSize = async (serverId: string, sizeOfMsg: number): Promise<ISuccess | BasicError> => {
        try {
            const resp = await this.post<ISuccess | BasicError>(`/update-server-size`, {serverId,sizeOfMsg}); 
            if (resp instanceof BasicError) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    sizeOfServerMessages = async (serverId: string): Promise<number | BasicError> => {
        try {
           const resp = await this.get<number | BasicError>(`/msg/size-all`, serverId)
           if (resp instanceof BasicError) throw (resp);
           return resp;  
        } catch (error) {
           return error as BasicError; 
        }
    }

    pickReaction = async (serverId: string, msgId: string, type: string, userId: string): Promise<ISuccess | BasicError> => {
        try {
            const resp = await this.post<ISuccess | BasicError>(`/msg/pick-reaction`, {serverId,
                                                                                       msgId,
                                                                                       type,
                                                                                       userId}); 
            if (resp instanceof BasicError) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    removeReaction = async (serverId: string, msgId: string, type: string, userId: string): Promise<ISuccess | BasicError> => {
       try {
            const resp = await this.post<ISuccess | BasicError>(`/msg/remove-reaction`, {serverId,
                                                                                         msgId,
                                                                                         type,
                                                                                         userId}); 
            if (resp instanceof BasicError) throw (resp);
            return resp; 
       } catch (error) {
            return error as BasicError; 
       }
    }

    rename = async (type: string, serverId: string, name: string, channelId?: string): Promise<ISuccess | BasicError>  => {
        try {
            if (type === 'server') {
                const resp = await this.post<ISuccess | BasicError>(`/rename-server`, {
                                                                                        serverId,
                                                                                        name,
                                                                                      }); 
                if (resp instanceof BasicError) throw (resp);
                return resp; 
            } else if (type === 'channel') {
                const resp = await this.post<ISuccess | BasicError>(`/rename-channel`, {
                                                                                       serverId,
                                                                                       channelId,
                                                                                       name,
                                                                                      });
                if (resp instanceof BasicError) throw (resp);
                return resp; 
            } 
        } catch (error) {
            return error as BasicError; 
        }
    }
   
    deleteServer = async (serverId: string): Promise<ISuccess | BasicError> => {
        try {
            const resp = await this.post<ISuccess | BasicError>(`/delete-server`, {
                                                                                    serverId,
                                                                                  });
            if (resp instanceof BasicError) throw (resp);
            return resp;  
        } catch (error) {
            return error as BasicError; 
        }
    }

    deleteChannel = async (serverId: string, channelId: string): Promise<ISuccess | BasicError> => {
        try {
            const resp = await this.post<ISuccess | BasicError>(`/delete-channel`, {
                                                                                    serverId,
                                                                                    channelId
                                                                                  });
            if (resp instanceof BasicError) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }


    userIsAdmin = async (serverId: string, userId: string): Promise<boolean | BasicError> => {
        try {
            const resp = await this.post<boolean | BasicError>(`/admin`, {
                                                                           userId,
                                                                           serverId
                                                                         });
            if (resp instanceof BasicError) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    userIsOwner = async (serverId: string, userId: string): Promise<boolean | BasicError> => {
        try {
            const resp = await this.post<boolean | BasicError>(`/owner`, {
                                                                           userId,
                                                                           serverId
                                                                         });
            if (resp instanceof BasicError) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }
}


export default ServerAPI; 