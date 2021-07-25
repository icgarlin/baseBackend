//import fs from 'fs';
import mongoose from 'mongoose';
import { graphql } from 'graphql';
import { gCall } from './utils/gCall';
import { Context, GIUpload } from '../interfaces';
import { GraphQlRegistration, Login } from '../schema';
import { deleteThndrMutation, registerMutation, followMutation, unfollowMutation, deleteReverbMutation, preSignedUrlQuery, driveMutation, editUserInfoMutation, createFolderMutation, createContext, rootFolderQuery } from './utils';
import { GenericError, Success, SuccessOrErrorUnion } from '../schema/error';
//import { getCloudFrontUrl, Registration } from '../schema/utils';
import { registerAdmin } from './utils/tools';
// eslint-disable-next-line @typescript-eslint/no-var-requires
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
// import { createFirstThndrCloud } from './utils/tools';

// user 'gman' objectID ==> 5ed80c5fd81fcc57dc2af2e3
// user 'waterman' objectID ==> 5ed80c06464ee176e43a031c
const context: Context = {
    user: {
        _id: '5ed80c06464ee176e43a031c',
        username: 'waterman'
    }
}

const password = 'password123'; 

// const cloudUsers = [
//     {
//       username: ,
//       name: ,
//       email: ,
//       password: ,
//     },
    
// ]


describe('User/Thndr Actions', () => {
    // It's just so easy to connect to the MongoDB Memory Server
    // By using mongoose.connect
    beforeAll(async () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        console.log('mongo uri ', process.env.MONGO_URI); 
        await mongoose.connect(process.env.MONGO_URI,
                                { useFindAndModify: true, useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }, (err: Error) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }
        });
    });
    
    it('Folder Create ', async () => {
      // const user = await UserModel.findOne({username: "waterman"});
      // const context = await createContext('waterman'); 
      Promise.resolve().then(() => jest.useFakeTimers())
      const res = await gCall({
        source: rootFolderQuery,
        contextValue: context,
        variableValues: {
          folderSortOptions: {
            sortByCreated: true
          },
          cursor: null, 
          limit: 3,
        }
      }); 
      console.log('res man ', res); 
      if (!res.errors) console.log('the res man ', res.data); 
      if (res.errors) console.log('thE res locations ', res.errors[0]['stack']); 
      setTimeout(() => console.log('timer'), 100);
      jest.runAllTimers();
    });


    /*
    it('Folder Create ', async () => {
      // const user = await UserModel.findOne({username: "waterman"});
      // const context = await createContext('waterman'); 
      Promise.resolve().then(() => jest.useFakeTimers())
      const res = await gCall({
        source: createFolderMutation,
        contextValue: context,
        variableValues: {
          name: 'NEWFOLDERBRO',
          parentId:  null
        }
      }); 
      console.log('res man ', res); 
      if (!res.errors) console.log('the res man ', res.data); 
      if (res.errors) console.log('thE res locations ', res.errors[0]['stack']); 
      setTimeout(() => console.log('timer'), 100);
      jest.runAllTimers();
    });
    */ 

    // it('Edit Profile Function', async () => {
    //   void Promise.resolve().then(() => jest.useFakeTimers())
    //   const res = await gCall({
    //     source: editUserInfoMutation,
    //     contextValue: context,
    //     variableValues: {
    //       userId: '5ed80c06464ee176e43a031c',
    //       info: {
    //         name: 'gyukio'
    //       }
    //     }
    //   }); 
    //   if (!res.errors) console.log('the res man ', res.data); 
    //   if (res.errors) console.log('thE res locations ', res.errors[0]['stack']); 
    //   setTimeout(() => console.log('timer'), 100);
    //   jest.runAllTimers();
    // });

    // it('Adds file to drive', async () => {
    //   Promise.resolve().then(() => jest.useFakeTimers())
    //   console.log('Adding file ', await gCall({
    //     source: driveMutation,
    //     contextValue: context,
    //     variableValues: {
    //       key: 'abcde-updatedkeyformat3.txt',
    //       size: 69
    //     }
    //   }))
    //   setTimeout(() => console.log('timer'), 100);
    //   jest.runAllTimers();
    // });

    /*
    it('Creates Thndr', async () => {
      Promise.resolve().then(() => jest.useFakeTimers())
      console.log('New Thndr Post ', await gCall({
        source: thndrMutation,
        contextValue: context,
        variableValues: {
          text: 'ANOTHER ONE!!!'
        }
      }))
      setTimeout(() => console.log('timer'), 100);
      jest.runAllTimers();
    });
    */

    
    // it('Follow user', async () => {
    //   const followGcall = await gCall({
    //     source: followMutation,
    //     contextValue: context,
    //     variableValues: {
    //       followedUsername: 'lotus',
    //     }
    //   });
    //   console.log('this is it: ', followGcall); 
    //   expect(followGcall.data.followUser).toEqual({success: true});
    // });


  
    // it('Unfollow user', async () => {
    //   Promise.resolve().then(() => jest.useFakeTimers());
    //   const unfollowGcall = await gCall({
    //     source: unfollowMutation,
    //     contextValue: context,
    //     variableValues: {
    //       unfollowedUsername: 'lotus',
    //     }
    //   });
    //   console.log('this is it: ', unfollowGcall);  
    //   expect(unfollowGcall.data.unfollowUser).toEqual({success: true});
    // }); 
  
  
    

    /*
    it('Retrieve Feed', async () => {
      Promise.resolve().then(() => jest.useFakeTimers());
      const gCallResult = await gCall({
        source: feedQuery,
        contextValue: context,
        variableValues: {
          cursor: '',
          limit: 3,
        }
      })
      console.log('a new result: ', gCallResult);
      console.log(gCallResult.data.thndrs.edges);
      console.log(gCallResult.data.thndrs.pageInfo);
      console.log(gCallResult.data.thndrs.pageInfo.hasNextPage);
      setTimeout(() => console.log('timer'), 400);
      jest.runAllTimers();
    });
    */ 

    /*
    it('Unfollow user', async () => {
      Promise.resolve().then(() => jest.useFakeTimers());
      const unfollowGcall = await gCall({
        source: unfollowMutation,
        contextValue: context,
        variableValues: {
          id: '5ed80c5fd81fcc57dc2af2e3',
        }
      });

      expect(unfollowGcall.data.unfollowUser).toBe(true);
      setTimeout(() => console.log('timer'), 400);
      jest.runAllTimers();
    }); 
    */


    // it('Register', async () => {
    //   Promise.resolve().then(() => jest.useFakeTimers());
    //   const newUser: GraphQlRegistration = {
    //                             username: 'dead',
    //                             name: 'deadD',
    //                             email: 'indeeed@gmail.com',
    //                             password: 'password123',
    //                           }
    //   const registerGcall = await gCall({
    //     source: registerMutation,
    //     contextValue: null,
    //     variableValues: {
    //       registration: newUser,
    //       serverId: 'b6a807a9-852a-461e-84e4-795ea95051b6'
    //     }
    //   });
    //   console.log('the gCall: ',registerGcall); 
    //   setTimeout(() => console.log('timer'), 600);
    //   jest.runAllTimers();
    // });


    //   it('DeleteThndr', async () => {
    //   Promise.resolve().then(() => jest.useFakeTimers());
    //       const deleteThndrGcall = await gCall({
    //         source: deleteThndrMutation,
    //         contextValue: context,
    //         variableValues: {
    //           id: "5f6936d779c24b002346c6fa",
    //         }
    //       });
    //   console.log('THE DELETE THNDRGCALL ', deleteThndrGcall.data.deleteThndrById); 
    //   // expect(deleteThndrGcall.data.register).toBe((instanceof Login));
    //   setTimeout(() => console.log('timer'), 600);
    //   jest.runAllTimers();
    // });




    //   it('DeleteThndr', async () => {
    //   Promise.resolve().then(() => jest.useFakeTimers());
    //       const deleteReverbGcall = await gCall({
    //         source: deleteReverbMutation,
    //         contextValue: context,
    //         variableValues: {
    //           id: "5f97302d494d950cde6317f9",
    //         }
    //       });
    //   console.log('THE DELETE REVERBGCALL ', deleteReverbGcall.data.deleteReverbById); 
    //   // expect(deleteThndrGcall.data.register).toBe((instanceof Login));
    //   setTimeout(() => console.log('timer'), 600);
    //   jest.runAllTimers();
    //  });

    // it('RegisterAdmin', async () => {
    //   Promise.resolve().then(() => jest.useFakeTimers());
    //   const admin: Registration = {
    //                                 username: 'arynlynn',
    //                                 email: 'aryn.davis@columbia.edu',
    //                                 password: 'cushcush$',
    //                                 name: 'arynlynn'
    //                               }
    //   const adminServerInfo: any = await registerAdmin(admin,'CUSH');
    //   console.log('the adminServerInfo ,', adminServerInfo); 
    //   setTimeout(() => console.log('timer'), 600);
    //   jest.runAllTimers();
    // });



    // it('GetPreSignedUrl', async () => {
    //   Promise.resolve().then(() => jest.useFakeTimers());
    //   const file: GIUpload = {fName: 'thegreatest', fType: 'audio/mpeg'};  
    //   const urlRes = await gCall({
    //     source: preSignedUrlQuery,
    //     contextValue: context, 
    //     variableValues: {
    //        files: [file]
    //     } 
    //   });
    //   console.log('this is the urlRes ', urlRes); 
    //   setTimeout(() => console.log('timer'), 600);
    //   jest.runAllTimers();
    // });


    
    /*
    it('GetCloudFrontUrl', async () => {
      Promise.resolve().then(() => jest.useFakeTimers());
      const fileKey = 'QoDYr-unnamed.m4a'; 
      const url = getCloudFrontUrl(fileKey); 
      setTimeout(() => console.log('timer'), 600);
      jest.runAllTimers();
    });
    */

    afterAll(async () => {
      await mongoose.disconnect();
    });
});

