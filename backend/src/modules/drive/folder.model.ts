import mongoose, { Document, Model } from 'mongoose';
import { Folder } from './folder.schema';
import { FileConnectionOrErrorUnion } from './types.resolver';


export interface IFolderModel extends Document {
    _id: string; 
    name: string; 
    deleted: boolean; 
    starred: boolean; 
    childrenIds: string[]; 
    parentId: string; 
    ownerId: string; 
    isPersonal: boolean;
    createdAt: Date; 
    updatedAt: Date;
    getChildren: (folder: Folder) => Promise<typeof FileConnectionOrErrorUnion>;  
}

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'The filename is required'],
  },
  childrenIds: [
    { type: mongoose.Schema.Types.ObjectId },
  ],
  parentId: {
    type: String,
    required: false,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'the ownerId is required'], 
  },
  starred: {
    type: Boolean,
    required: true,
  },
  deleted: {
    type: Boolean,
    required: true
  },
  isPersonal: {
    type: Boolean,
    required: true
  }
}, {timestamps: true});



export const FolderModel: Model<IFolderModel> = mongoose.model<IFolderModel>('FolderModel', folderSchema, 'folders');
