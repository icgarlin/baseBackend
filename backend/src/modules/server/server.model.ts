import { SERVERTIER } from './types';
import mongoose, { Model, Document } from 'mongoose';
import { IServerInviteCode } from '../__shared__/interfaces';
const Schema = mongoose.Schema;

export interface IServerModel extends Document {
  serverId: string; 
  serverName: string; 
  ownerId: string; 
  size: number; 
  tier: SERVERTIER;
  inviteCodes: IServerInviteCode[]; 
  admins: string[];
}

const InvitationCodeSchema = new Schema({
  code: {
    type: String, 
    required: true
  },
  expiration: {
    type: Date,
    required: true
  }
})

const ServerModelSchema = new Schema({
  serverId: {
    type: String,
    required: true,
  },
  serverName: {
    type: String,
    required: true,
  },
  ownerId: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    default: 0,
    required: true
  },
  tier: {
    type: Number,
    enum: SERVERTIER,
    required: true
  },
  inviteCodes: [InvitationCodeSchema],
  admins: [{type: mongoose.Types.ObjectId, ref: 'User', required: true}]
});

export const ServerModel: Model<IServerModel> = mongoose.model<IServerModel>('ServerModel', ServerModelSchema, 'Servers');

