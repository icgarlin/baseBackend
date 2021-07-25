import mongoose, { Model, Document } from "mongoose";
const Schema = mongoose.Schema;

export interface IChannelModel extends Document {
  serverId: string; 
  channelId: string; 
  channelName: string; 
}

const ChannelSchema = new Schema({
  serverId: {
    type: String,
    required: true,
  },
  channelId: {
    type: String,
    required: true,
  },
  channelName: {
    type: String,
    required: true,
  },
});

export const ChannelModel: Model<IChannelModel> = mongoose.model<IChannelModel>('Channel', ChannelSchema, 'Channels');

