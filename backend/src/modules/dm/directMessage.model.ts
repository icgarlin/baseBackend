import mongoose, { Document, 
                   Model } from 'mongoose';
import { IConversation } from './interfaces';
const Schema = mongoose.Schema;

export interface IDirectMessageModel extends Document {
  users: string[]; 
  conversation: IConversation[]; 
}

const DirectMessageSchema = new Schema({
  users: [{type: mongoose.Types.ObjectId, ref: 'User'}],
  conversation: [{
    from: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userTo: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    msgId: {
      type: String,
      unique: true,
      required: true,
    },
    msg: {
      type: String,
      required: false,
    },
    fileKeys: [{
      type: String,
    }],
    createdAt: {
      type: Date,
      required: true,
    }
  }],
});

export const DirectMessageModel: Model<IDirectMessageModel> = mongoose.model<IDirectMessageModel>('DirectMessage', DirectMessageSchema, 'DirectMessages');

