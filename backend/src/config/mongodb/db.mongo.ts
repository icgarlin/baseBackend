import mongoose from 'mongoose';

export const mongooseConnect = (): void => {
    mongoose.connect(process.env.MONGO_URI,  {
        useNewUrlParser: true,
        keepAlive: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
        useCreateIndex: true
    }).then(() => {
        console.log('🚀 MongoDB has connected successfully.');
     }).catch((err) => {
        if (err) console.log('❌ MongoDB failed to connect');
    })
}
