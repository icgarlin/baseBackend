import mongoose, { Document,
                   Model, 
                   Schema } from 'mongoose';


export interface IStatusCommentModel extends Document {
  _id: string; 
  userId: string; 
  statusId: string; 
  text?: string; 
  fileKeys?: string[]; 
  createdAt: Date; 
}

const statusCommentSchema = new Schema({
    userId: {
     type: String, 
     required: true
    },
    statusId: { 
     type: String, 
     required: true
    },
    text: {
      type: String
    }, 
    fileKeys: [{
      type: String
    }], 
    createdAt: { type: Date, required: true }
})


export const StatusCommentModel: Model<IStatusCommentModel> = mongoose.model<IStatusCommentModel>('StatusCommentModel', statusCommentSchema, 'statusComment');