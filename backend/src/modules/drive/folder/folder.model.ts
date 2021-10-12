import mongoose, { Document, 
                   Model } from 'mongoose';



export interface IFolderModel extends Document {
    _id: string; 
    name: string; 
    deleted: boolean; 
    starred: boolean; 
    ownerId: string; 
    type: FolderType; 
    isPersonal: boolean;
    createdAt: Date; 
    updatedAt: Date;
    parentId?: string;  
    fileId?: string; 
}

export enum FolderType { 
  DRAFT = 'DRAFTS',
  DRAFT_FOLDER ='DRAFT_FOLDER',
  FOLDER = 'FOLDER', 
  PROJECT = 'PROJECT'
}

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'The filename is required'],
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    required: false,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner id is required'], 
  },
  type: {
    type: String,
    enum: ['PROJECT', 'FOLDER', 'DRAFT', 'DRAFT_FOLDER'], 
    required: true
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
  },
  fileId: {
    type :mongoose.Schema.Types.ObjectId,
    ref: 'File', 
    required: false
  }
}, {timestamps: true});



export const FolderModel: Model<IFolderModel> = mongoose.model<IFolderModel>('FolderModel', folderSchema, 'folders');
