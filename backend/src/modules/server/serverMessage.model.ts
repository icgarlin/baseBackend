import { IReactions } from '../__shared__/interfaces';
import mongoose, { Document, Model, Types } from 'mongoose';
const Schema = mongoose.Schema;

export interface IServerMessageModel extends Document {
  _id: Types.ObjectId; 
  serverId: string; 
  channelId: string; 
  fromId: string; 
  msg: string; 
  msgId: string; 
  isSaved: boolean;
  deleted: boolean;  
  fileKeys: string[]; 
  reactions: IServerReactionsModel; 
  createdAt: Date; 
}

interface IServerReactionsModel extends Document {
  heart: string[]; 
  thumbsup: string[]; 
  thumbsdown: string[]; 
  pray: string[]; 
  raised_hands: string[]; 
}

const ServerMessageReactionsSchema = new Schema({
  heart: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  }], 
  thumbsup: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true
  }], 
  thumbsdown: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true
  }], 
  pray: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true
  }], 
  raised_hands: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true
  }]
});

const ServerMessageSchema = new Schema({
  serverId: {
    type: String,
    required: true
  },
  channelId: {
    type: String,
    required: true
  },
  fromId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}, 
  msg: {
    type: String,
    required: false,
  },
  msgId: {
    type: String,
    required: true,
  },
  fileKeys: [{
    type: String,
    required: true
  }],
  reactions: ServerMessageReactionsSchema,
  isSaved: {
    type: Boolean,
    default: false
  },
  deleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    required: true,
  },
});

export const ServerMessageModel: Model<IServerMessageModel> = mongoose.model<IServerMessageModel>('ServerMessage', ServerMessageSchema, 'ServerMessages');
