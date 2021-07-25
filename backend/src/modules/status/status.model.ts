import mongoose, { Document,
                   Model, 
                   Schema } from 'mongoose';

export type IStatusModel = IThndrModel; 

export interface IThndrModel extends Document {
  _id: string;
  userId: string;
  createdAt: Date; 
  updatedAt: Date; 
  fileKeys: string[];
  likeIds: string[];
  text: string;
  reactions: IStatusReactionsModel;  
  commentIds: string[]; 
}


interface IStatusReactionsModel extends Document {
  heart: string[]; 
  thumbsup: string[]; 
  thumbsdown: string[]; 
  pray: string[]; 
  raised_hands: string[]; 
}

const StatusReactionsSchema = new Schema({
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

const StatusSchema = new Schema(
  {
    text: {
      type: String,
      required: false,
    },
    fileKeys: [{
      type: String,
      required: true, 
    }],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    likeIds: [{
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User'
    }],
    reactions: { 
      type: StatusReactionsSchema, default: () => ({}),
    },
    commentIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    }],
  },
  {
    timestamps: true,
  },
);

export const StatusModel: Model<IStatusModel> = mongoose.model<IStatusModel>('StatusModel', StatusSchema, 'status');

