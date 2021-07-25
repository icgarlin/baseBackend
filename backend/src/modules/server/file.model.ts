import mongoose, { Model, Document } from 'mongoose';
const Schema = mongoose.Schema;

export interface IServerFileModel extends Document {
  serverId: string; 
  channelId: string;
  key: string;  
  createdAt: string; 
}

const serverFileSchema = new Schema(
{
  serverId: {
    type: String,
    required: true,
  },
  channelId: {
    type: String,
    required: true,
  },
  key: {
    type: String,
    required: true,
  },
},
{
    timestamps: true,
  },
);

export const ServerFileModel: Model<IServerFileModel> = mongoose.model<IServerFileModel>('ServerFile', serverFileSchema, 'ServerFile')