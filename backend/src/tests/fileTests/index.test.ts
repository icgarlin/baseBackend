import { changeFileNameMutation, context, gCall, userFilesQuery } from "../utils";
import mongoose from 'mongoose'; 



describe('File Actions', () => {
    // It's just so easy to connect to the MongoDB Memory Server
    // By using mongoose.connect
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URI,
                                { useFindAndModify: false, useNewUrlParser: true, useUnifiedTopology: true }, (err: any) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }
        });
    });

    it('Queries files from drive based on sections', async () => {
      Promise.resolve().then(() => jest.useFakeTimers())
      const filesQueryRes = await gCall({
        source: userFilesQuery,
        contextValue: context,
        variableValues: {

        }
      })
      console.log('query all files res ', filesQueryRes); 
      setTimeout(() => console.log('timer'), 100);
      jest.runAllTimers();
    });



    // it('Changes a file name', async () => {
    //   Promise.resolve().then(() => jest.useFakeTimers())
    //   const changeFileNameRes = await gCall({
    //     source: changeFileNameMutation,
    //     contextValue: context,
    //     variableValues: {
    //       fileId: '5fd542e136d73b1132ee4860', 
    //       name: 'isaiahG'
    //     }
    //   })
    //   console.log('res ', changeFileNameRes); 
    //   setTimeout(() => console.log('timer'), 100);
    //   jest.runAllTimers();
    // });


    // afterAll(async () => {
    //   mongoose.disconnect();
    // });
});

