/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Service } from 'typedi';
import { IUser } from '../user/interfaces';
import BaseRepo from '../__shared__/baseRepo';
import { BasicError, 
         ErrorCode, 
         ISuccess } from '../__shared__/error';
import { UpdatedDocument } from '../__shared__/interfaces';
import { DirectMessageModel } from './directMessage.model';
import { IConversation, 
         IDirectMessage, 
         IDirectMessageRepo, 
         IDMConnection, 
         IDMUser, 
         IDMUserGroupList, 
         IIncomingPrivateMessage } from './interfaces';


@Service()
class MongoDBDirectMessageRepo extends BaseRepo implements IDirectMessageRepo {

    dmGroupExists = async (fromId: string, toIds: string[]): Promise<boolean | BasicError>  => {
        try {
            const dm = await DirectMessageModel
                        .findOne({ users: { $all: [fromId, ...toIds] } });
            if (dm) return true; 
            else return false; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    insertDM = async (msg: IIncomingPrivateMessage): Promise<IConversation | BasicError> => {
      try {
        const msgId = this.generateId();
        const message = {
          from: msg.fromId,
          userTo: msg.userToId,
          msgId: msgId,
          msg: msg.msg,
          fileKeys: msg.fileKeys,
          createdAt: msg.createdAt
        };
        /* Must Test With the _id */ 
        await DirectMessageModel
          .updateOne(
            { users: { $all: [message.from, message.userTo] } },
            { $push: { conversation: 
                {
                  from: message.from,
                  userTo: message.userTo,
                  msgId: msgId,
                  fileKeys: msg.fileKeys,
                  msg: msg.msg,
                  createdAt: msg.createdAt
                } 
              } 
            },
          )
          return message; 
      } catch (error) {
          return error as BasicError; 
      }
    }

    startDM = async (fromId: string, toIds: string[], createDMGroup: (fromId: string, toIds: string[]) => Promise<ISuccess | BasicError>): Promise<IDirectMessage | BasicError> => {
        try {
            // console.log('the here ',toIds); 
            const pairExists = await this.dmGroupExists(fromId,toIds);
            if (pairExists instanceof Error) throw (pairExists);
            if (pairExists) {
              
              return;
            } else {
                const newDM = new DirectMessageModel({
                  users: [fromId, ...toIds],
                  conversation: []
                });
                await newDM.save();
                const newPair = await createDMGroup(fromId,toIds); 
                if ('success' in newPair) return (newDM as IDirectMessage);
                else throw (newPair);
              }
           } catch (error) {
            return error as BasicError; 
           }
    }

    getDM = async (fromId: string, toIds: string[]): Promise<IDirectMessage | BasicError> => {
        try {   
          const dm = await DirectMessageModel
                     .findOne({ users: { $all: [fromId, ...toIds] } },
                     { conversation: 1, _id: 0 })
          
          if (!dm) throw (new BasicError(ErrorCode.NotFound, `DM group does not exist`)); 
          const convo = [];
          for(let m = 0; m < dm.conversation.length; m++) {
            convo.push({
              from: dm.conversation[m].from,
              userTo: dm.conversation[m].userTo,
              msgId: dm.conversation[m].msgId,
              msg: dm.conversation[m].msg,
              fileKeys:  dm.conversation[m].fileKeys,
              createdAt: dm.conversation[m].createdAt
            });
          }
          return {
                  users: [fromId, ...toIds],
                  conversation: convo,
                 }
        } catch (error) {
            console.log('the error ', error);
            return error as BasicError;
        }
    }

    getConversation = async (fromId: string, toIds: string[], start: number, end: number, limit: number): Promise<IDMConnection | BasicError> => {
      try {

        const dm = await DirectMessageModel.findOne({users: [fromId,...toIds]});
        if (dm === null) throw (new BasicError(ErrorCode.NotFound,
                              `Could not find conversation`));
        
        const dmObject = dm.toObject() as IDirectMessage; 
        const convo = dmObject.conversation.reverse(); 
        const msgs: IConversation[] = convo.splice(start,end+1);
        const hasNextPage = msgs.length > limit; 
        const edges: IConversation[] = hasNextPage ? msgs.slice(0, -1) : msgs
        return {
          edges, 
          pageInfo: {
            hasNextPage, 
            start: start + 5, 
            end: end + 5, 
          }
        }
      } catch (error) {
          console.log('error getting our conversation ', error);
          return error as BasicError; 
      }
    }

    loadConversation = async (from: string, to: string, cursor: string, limit: number): Promise<IDirectMessage[] | BasicError> => {
      try {
        const cursorTime: Date = cursor ? new Date(this.fromCursorHash(cursor)) : null;

        const match = {
                $and:[
                       {
                          'users': [from, to],
                           
                      },
                      {

                    }
                       
                ],
        };

        const dmFeed = await DirectMessageModel.aggregate([
                                                    { $match: match },
                                                      {$unwind: '$conversation'},
                                                        { 
                                                          $sort: { 
                                                            'conversation.createdAt': -1,
                                                          }
                                                        },
                                                       
                                                    ]).exec();

        return dmFeed; 
      } catch (error) {
          return error as BasicError; 
      }
    } 

    getDMUsers = async (userId: string, findUser: (userId: string) => Promise<IUser | BasicError>): Promise<IDMUserGroupList | BasicError> => {
      try {
          const user = await findUser(userId); 
          if ('code' in user || user instanceof Error) throw (new BasicError(ErrorCode.NotFound,`Could not find user with id ${userId}`));
          const dmUserPromises: Promise<IDMUser>[] = (user.directMessages.length) ? user.directMessages.map(async (dmUser) => {
            const { users } = dmUser; 
            const userListPromise = users.map(async (user) => {
                                                const res = await findUser(user);
                                                if (res instanceof Error) return; 
                                                return res; 
                                              }).filter((val) => val === undefined); 
            const userList = await Promise.all(userListPromise); 
            if (userList.length) {
              return { users: userList }
            } 
            return; 
          }).filter((val) => val === undefined) : []; 
          const res = (await Promise.all(dmUserPromises)).filter((val) => val === undefined); 
          if (res.length) {
           
           return {groups: res}; 
          } 
          return {groups: []}
      } catch (error) {
          if ('code' in error && error.code === 404) {
            const { code } = error as BasicError; 
            return { 
              name: `UserNotFoundError`,
              code,
              message: `Could not find user`
            } as BasicError; 
          }
          return error as BasicError; 
      }
    }

    loadDMGroups = async (userId: string, findUser: (userId: string) => Promise<IUser | BasicError>): Promise<IDirectMessage[] | BasicError> => {
        try {
            const user = await findUser(userId);
            if ('code' in user) throw (new BasicError());
            if (user instanceof BasicError) throw (user);
            const conversations: IDirectMessage[] = []; 
            for (let i = 0; i < user.directMessages.length; i++) {
              const conversation: IDirectMessage | BasicError = await this.getDM(userId,user.directMessages[i].users);
              if (conversation instanceof BasicError) throw (conversation);
              conversations.push(conversation);
            }
            console.log('the conversations here ', conversations);
            return conversations; 
        } catch (error) {
            console.log('the error fam ', error);
            return error as BasicError; 
        }
    }

    deleteDM = async (msgId: string, fromUserId: string, toUserId: string): Promise<ISuccess | BasicError>=> {
      try {
            const updated = await DirectMessageModel
                                  .updateOne(
                                    { users: { $all: [fromUserId, toUserId] } },
                                    { $pull: { conversation: { msgId: msgId } } }
                                  ) as UpdatedDocument;
            if (updated.nModified === 1) return {success:true};
            else throw (new BasicError());
      } catch (error) {
          return error as BasicError; 
      }
    }

    removeDMConvo = async (fromId: string, toIds: string[], deleteDMGroup: (fromId: string, toIds: string[]) => Promise<ISuccess | BasicError>): Promise<ISuccess | BasicError> => {
      try {
        const updated = await deleteDMGroup(fromId,toIds);
        if (updated instanceof Error) throw (updated);
        const deleted = await DirectMessageModel
                                  .deleteOne(
                                    { users: { $all: [fromId, ...toIds] } })
        if (deleted.deletedCount === 1) return {success:true};
        else throw (new BasicError());
      } catch (error) {
          return error as BasicError; 
      }
    }

}

export default MongoDBDirectMessageRepo;