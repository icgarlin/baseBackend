import isEmail from 'validator/lib/isEmail';
import { IServerJoined } from './interfaces';
import mongoose, { Document,
                   Model,
                   Schema } from 'mongoose';

export interface IUserModel extends Document {
  _id: string;
  username: string;
  name: string;
  email: string;
  password: string;
  avatar: string;
  cover: string;
  connections: string[]; 
  roles: string[];
  refreshToken: string;
  serversJoined: IServerJoined[];
  directMessages: IDMGroupModel[];
  bio?: string;
  birth?: Date;
  lastLogin?: Date; 
  stripeCustomerId?: string; 
}

export interface IDMGroupModel extends Document {
  users: string[]; 
}

const dmGroupSchema = new Schema({
  users: [ 
    {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
  ], 
})

const userSchema = new Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  email: {
    type: String,
    unique: true, 
    required: false,
    validate: [isEmail, 'No valid email address provided.'],
  },
  password: {
    type: String,
    required: true,
    minlength: 7,
    maxlength: 60,
    validate(value: string): boolean {
      if (value.length < 7) {
          return false; 
      }
    },
  },
  roles: [{
    type: String,
    enum: ['ADMIN', 'PUBLIC']
  }],
  name: {
    type: String,
  },
  bio: {
    type: String,
    maxlength: 150,
  },
  birth: {
    type: Date,
  },
  avatar: { type: String },
  cover: { type: String },
  connections: [
    {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
  ],
  refreshToken: {
    type: String,
  },
  serversJoined: [{
    serverId: {
      type: String,
      required: true
    },
    lastActive: {
      type: Date,
      required: true
    },
    subscriptionId: {
      type: String, 
      required: false
    },
    productId: {
      type: String, 
      required: false
    },
    currentPeriodEnd: {
      type: Number,
      required: false
    },
    status: {
      type: String, 
      required: false
    }
  }],
  directMessages: [dmGroupSchema], 
  lastLogin: {
    type: Date,
    required: false
  },
  stripeCustomerId: {
    type: String,
    required: false
  }
});

export const DMGroupModel: Model<IDMGroupModel> = mongoose.model<IDMGroupModel>('DMGroupModel', dmGroupSchema, 'dmGroup');
export const UserModel: Model<IUserModel> = mongoose.model<IUserModel>('UserModel', userSchema, 'users');

