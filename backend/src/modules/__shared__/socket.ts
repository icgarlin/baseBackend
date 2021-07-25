/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { Server } from 'socket.io';
import DirectMessageController from '../dm/controller';
import { IIncomingPrivateMessage, 
         INewDMInput } from '../dm/interfaces';
import ServerController from '../server/controller';
import { IIncomingServerMessage, 
         IOutgoingServerMessage, 
         IRemoveUserInfo, 
         SocketAction, 
         SocketClient } from '../server/interfaces';
import { BasicError, 
         ErrorCode } from './error';
import { IDeleteServerMessageData } from './interfaces';

export const buildSocket = (io: Server, serverControl: ServerController, dmControl: DirectMessageController): void | BasicError => {
  try {
    const clients: SocketClient[] = [];
    // Create socket Server listener
    io.on('connection', (socket: SocketIO.Socket) => {
  
      let sessionUserId = '';
      let action: SocketAction;
  
      // When user signs in they send over their userId
      socket.on('send-id', async (userId: string) => {
        sessionUserId = userId;
        clients.push({ userId: sessionUserId, id: socket.id })
        const servers = await serverControl.getServerList(sessionUserId);
        if ('code' in servers || servers instanceof Error) throw (servers);
        for(let i = 0;i < servers.length; i++) {
          const obj: any = servers[i];
          await serverControl.updateServerActive(sessionUserId, obj.serverId);
        }
      });
  
      // Listens for subscribing to servers (socket io rooms)
      socket.on('subscribe', (serverId: string) => {
        socket.join(serverId);
      })


      socket.on('create-new-dm', async (info: INewDMInput) => {
        const { fromId, toIds } = info; 
        const res = await dmControl.startNewDM(fromId,toIds); 
        if (res instanceof Error) throw (res); 
       
        const { users } = res; 
        const userListPromise = users.map(async (user) => {
            const res = await dmControl.userRepo.findUser(user); 
            if (res instanceof Error) return; 
            else {
              const { _id, username, name } = res; 
              return {
                _id, 
                username,
                name
              }
            }
        }).filter((res) => !(res instanceof Error)); 
        const userList = await Promise.all(userListPromise); 
        const dm = {
         users: userList,
        }
        const action = { type: 'create-new-dm', payload: dm };

        // Find which socket to send to for user receiving message
        clients.find(client => {
          if (toIds.includes(client.userId)) {
            io.to(client.id).emit('update', action);
          }
        });
    
        // Find which socket to send to for user sending message
        clients.find(client => {
          if(client.userId === fromId) {
            io.to(client.id).emit('update', action);
          }
        });

      })
 
      /* 
      // On ping update active status of current user (Client sends every 5 minutes)
      socket.on('update-active', async () => {
        const servers: any = await (serverAPI ).getUserServerList(sessionUserId);
        if (servers) {
          for(let i = 0;i < servers.length;i++) {
            await (serverAPI ).updateActive(sessionUserId, servers[i].serverId);
          }
        } 
      })
      */ 

      // Listens for new messages
      socket.on('server-message', async (msg: IIncomingServerMessage) => {
        try { 
        const serverId = msg.serverId
        if (msg.fileKeys.length === 0 && !msg.msg) throw (new BasicError()); 
        const message = await serverControl.addMsg({
                                                    serverId,
                                                    channelId: msg.channelId,
                                                    fromId: msg.fromId,
                                                    msg: msg.msg,
                                                    fileKeys: msg.fileKeys,
                                                    createdAt: msg.createdAt
                                                  });
        // Format our action for client to parse
        if ('code' in message || message instanceof Error) throw (new BasicError());
        const { cloudRepo  } = serverControl;
        let urls: string[]; 
        // console.log('our fileKeys ', message.fileKeys);
        if (message.fileKeys.length > 0) {
          urls = cloudRepo.getUrls(message.fileKeys);
        }
        // console.log('the urls ', urls);
        const outgoing: IOutgoingServerMessage = {
                                                  serverId: message.serverId,
                                                  channelId: message.channelId,
                                                  fromId: message.fromId,
                                                  fromUser: {
                                                   username: msg.from,
                                                  },
                                                  msg: message.msg,
                                                  fileUrls: (urls !== undefined && urls.length > 0) ? {urls} : {urls:[]},
                                                  createdAt: (typeof message.createdAt === 'string') ? new Date(message.createdAt) : message.createdAt
                                                 }
        const action = { type: 'server-message', payload: outgoing };
        // Emit the message to everyone that joined that server
        io.to(serverId).emit('update', action);
        } catch (error) {
            console.log('the errror here', error); 
        }
      });
  
      // Listens for private messages
      socket.on('private-message', async (msg: IIncomingPrivateMessage) => {
        try {
          const connected = await dmControl.checkUsersConnected(msg.fromId,msg.userToId);
          if (connected instanceof Error) throw (connected);  
          const dmPairExists = await dmControl.dmGroupExists(msg.fromId,[msg.userToId]);
          if (dmPairExists instanceof Error) throw (dmPairExists);
          const { cloudService } = dmControl; 
          if (dmPairExists && connected) {
              const message = await dmControl.addMsg({
                                                      from: msg.from,
                                                      fromId: msg.fromId,
                                                      userTo: msg.userTo,
                                                      userToId: msg.userToId,
                                                      msg: msg.msg,
                                                      fileKeys: msg.fileKeys,
                                                      createdAt: new Date()
                                                      });
              if ('code' in message || message instanceof Error) throw (message);
              let urls: string[]; 
              if (message.fileKeys.length > 0) {
                urls = cloudService.getUrls(message.fileKeys);
              }
              const msgPayload = {  msg: message.msg, 
                                    msgId: message.msgId,
                                    userTo: msg.userTo,
                                    userToId: msg.userToId,
                                    from: msg.from,
                                    fromId: msg.fromId,
                                    getUsers: {users: [{_id: msg.fromId,
                                                       username:msg.from},
                                                       {_id: msg.userToId,
                                                       username: msg.userTo}]},
                                    fileUrls: (urls !== undefined && urls.length > 0) ? {urls} : {urls: []},
                                    createdAt: message.createdAt }; 
            // Format our action for client to parsem
            action = { type: 'private-message', payload: msgPayload };
            const notification = {type: 'private-message-notif', payload: {message: `You received a message from ${msg.from}`}}; 
            // Find which socket to send to for user receiving message
            clients.find(client => {
                if (client.userId === msg.userToId) {
                  io.to(client.id).emit('update', notification); 
                  io.to(client.id).emit('update', action);
                }
            });
    
            // Find which socket to send to for user sending message
            clients.find(client => {
              if(client.userId === msg.fromId) {
                io.to(client.id).emit('update', action);
              }
            });
          } else if (connected) {
            const newDM = await dmControl.startNewDM(msg.fromId, [msg.userToId]);
            if ('code' in newDM || newDM instanceof Error) throw (newDM);
            const message = await dmControl.addMsg({
                                                    from: msg.from,
                                                    fromId: msg.fromId,
                                                    userTo: msg.userTo,
                                                    userToId: msg.userToId,
                                                    msg: msg.msg,
                                                    fileKeys: msg.fileKeys,
                                                    createdAt: new Date()
                                                    });
            if ('code' in message || message instanceof Error) throw (message);
            let urls: string[]; 
            if (message.fileKeys.length > 0) {
              urls = cloudService.getUrls(message.fileKeys);
            }
            const msgPayload = {  msg: message.msg, 
                                  msgId: message.msgId,
                                  userTo: msg.userTo,
                                  userToId: msg.userToId,
                                  from: msg.from,
                                  fromId: msg.fromId,
                                  getUsers: {users: [{_id: msg.fromId,
                                                      username:msg.from},
                                                      {_id: msg.userToId,
                                                      username: msg.userTo}]},
                                  fileUrls: (urls !== undefined && urls.length > 0) ? {urls} : {urls:[]},
                                  createdAt: message.createdAt }; 
                                                                                  
            // Format our action for client to parse
            console.log('the msgload ', msgPayload); 
            action = { type: 'private-message', payload: msgPayload };
    
            // Find which socket to send to for user receiving message
            clients.find(client => {
              if(client.userId === msg.userToId) {
                io.to(client.id).emit('update', action);
              }
            });
    
            // Find which socket to send to for user sending message
            clients.find(client => {
              if(client.userId === msg.fromId) {
                io.to(client.id).emit('update', action);
              }
            });
          }
        } catch (error) {
            console.log('our error after private message ', error);
        }
      });

      // Deleting private messages 
      socket.on('dlt-pm', async (data: any) => {
        try {
          const { msgId, sessionUserId, userMessaged } = data; 
          const deleteRes = await dmControl.deleteMsg(msgId,sessionUserId,userMessaged);
          if ('code' in deleteRes || deleteRes instanceof Error) throw (deleteRes);
          
          // Format our action for client to parse
          action = { type: 'dlt-pm', payload: data };
    
          // Find which socket to send to for user receiving message
          clients.find(client => {
            if (client.userId === data.userTo) {
              io.to(client.id).emit('update', action);
            }
          });

          // Find which socket to send to for user sending message
          clients.find(client => {
            if (client.userId === sessionUserId) {
              io.to(client.id).emit('update', action);
            }
          });
        } catch (error) {
            console.log('our error is such ', error);
        }
      });

      // Deleting server messages
      socket.on('dlt-message', async (data: IDeleteServerMessageData) => {
        const { msgId, serverId, channelId } = data; 
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const deleteRes = await serverControl.deleteMsg(serverId,channelId,msgId);
        console.log('our delete msg res in socket ', deleteRes)
        if ('code' in deleteRes || deleteRes instanceof Error) throw (deleteRes); 
        // Format our action for client to parse
        
        action = { type: 'dlt-message', payload: msgId };
  
        //Emit the message to everyone that joined that server
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        io.to(serverId).emit('update', action);
      });

      // Deleting server
      socket.on('dlt-server', async (data: any) => {
        try {
          const { serverId } = data; 
          const isOwner = await serverControl.isServerOwner(serverId,sessionUserId);
          if (isOwner instanceof Error) throw (isOwner);
          if (isOwner) {
            const deletedRes = await serverControl.deleteServer(serverId,sessionUserId);
            console.log('deleted server res ', deletedRes);
            if ('code' in deletedRes || deletedRes instanceof BasicError) throw (deletedRes);
            // Format our action for client to parse
            action = { type: 'dlt-server', payload: data };
      
            //Emit the message to everyone that joined that server
            io.to(serverId).emit('update', action);
          } 
        } catch (error) {
            console.log('the delete response of server ', error);
        }
      });

      // Deleting channel
      socket.on('dlt-channel', async (data: any) => {
        try {
          const { serverId } = data; 
          const isAdmin = await serverControl.isUserAdmin(serverId, sessionUserId);  
          // const isOwner = await (serverAPI ).userIsOwner(data.server.split('/', 2)[0], sessionUserId);
          if (isAdmin instanceof Error) throw (new BasicError());
          if (isAdmin) {
            const deletedRes = await serverControl.deleteChannel(serverId,data.channelId);
            if ('code' in deletedRes || deletedRes instanceof Error) throw (deletedRes);
            // Format our action for client to parse
            action = { type: 'dlt-channel', payload: data };
            //Emit the message to everyone that joined that server
            io.to(serverId).emit('update', action);
          }
        } catch (error) {
            console.log('delete channel error ', error);
        }
      });


      // Add channel
      socket.on('add-channel', async (data: any) => {
        try {
          const { serverId, channelName } = data; 
          const isOwner = await serverControl.isServerOwner(serverId,sessionUserId);
          const isAdmin = await serverControl.isUserAdmin(serverId, sessionUserId); 
          if (isAdmin instanceof Error || isOwner instanceof Error) throw (new BasicError(ErrorCode.Unauthorized,`Must be admin or owner`));
          if (isAdmin || isOwner) {
              const channel = await serverControl.createNewChannel(serverId,channelName);
              if ('code' in channel || channel instanceof Error) throw (channel);
              // Format our action for client to parse
              action = { type: 'add-channel', payload: { serverId: serverId, channelId: channel.channelId, channelName: channel.channelName}};
              //Emit the message to everyone that joined that server
              io.to(serverId).emit('update', action);
            }
        } catch (error) {
            
            console.log('the error is ', error);
            return error as BasicError; 
        } 
    
      });


      // Rename server
      socket.on('rename-server', async (data: any) => {
        const { serverId, name } = data; 
        const isOwner = await serverControl.isServerOwner(serverId,sessionUserId);
        if (isOwner instanceof Error) throw (new BasicError());
        if (isOwner) {
          const renameServerRes = await serverControl.renameServer(serverId,name);
          if ('code' in renameServerRes || renameServerRes instanceof BasicError) throw (renameServerRes);
          // Format our action for client to parse
          action = { type: 'rename-server', payload: data };
  
          //Emit the message to everyone that joined that server
          io.to(serverId).emit('update', action);
        } 
      });

      // Rename channel
      socket.on('rename-channel', async (data: any) => {
          const { serverId, channelId, name } = data;
          const isOwner = await serverControl.isServerOwner(serverId,sessionUserId);
          const isAdmin = await serverControl.isUserAdmin(serverId, sessionUserId); 
          if (isAdmin instanceof Error || isOwner instanceof Error) throw (new BasicError());
          if (isAdmin || isOwner) {
            const renameRes = await serverControl.renameChannel(serverId,channelId,name);
            if ('code' in renameRes || renameRes instanceof Error) throw (renameRes);
            // Format our action for client to parse
            action = { type: 'rename-channel', payload: data };
            //Emit the message to everyone that joined that server
            io.to(data.server.split('/', 2)[0]).emit('update', action);
          }
      });

      socket.on('remove-server-user', async (info: IRemoveUserInfo) => {
        try {
          const { serverId, userId, removeId } = info; 
          const res = await serverControl.removeUserFromServer(serverId,userId,removeId);
          if (res instanceof Error) throw (res); 
          const action = { type: 'remove-server-user', payload: serverId }; 
          
          // Double Check 
          clients.find(client => {
            if(client.userId === removeId) {
              io.to(client.id).emit('update', action);
            }
          });

        } catch (error) {
            return error as BasicError; 
        }
      })

  
      // On disconnect remove from client list
      socket.on('disconnect', () => {
        clients.find((client, i) => {
          if (client.userId === sessionUserId) {
  
            // Emit to all connected users that this user left
            // const action = { type: 'user-leave-voice', payload: { username: client.username } };
            // socket.emit('update', action);
  
            // Remove from gloval socket client list
            return clients.splice(i, 1);
          }
        })
      });
    });
  } catch (error) {
      return error as BasicError; 
  }
};