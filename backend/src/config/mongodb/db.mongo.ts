import mongoose from 'mongoose';

export const mongooseConnect = (): void => {

    mongoose.connect(process.env.NODE_ENV === 'development' ? process.env.MONGO_URI_DEV : process.env.MONGO_URI_PROD,  {
        useNewUrlParser: true,
        keepAlive: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
        useCreateIndex: true
    }).then(() => {
        console.log('🚀 MongoDB has connected successfully.');
     }).catch((err) => {
        if (err) {
            console.log('Error ', err)
            console.log('❌ MongoDB failed to connect');

        }
    })
}
