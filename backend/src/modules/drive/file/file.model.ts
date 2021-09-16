import mongoose, { Model } from 'mongoose';
import { IFileModel } from '../interfaces';

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'The filename is required'],
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    required: true
  },
  type: {
    type: String,
    required: [true, 'The mimetype is required'],
    },
  key: {
    type: String,
    required: [true, 'The path is required'],
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'The owner id is required'], 
  },
  size: {
    type: Number,
    required: [true, 'The file size is required'],
  },
  isPersonal: {
    type: Boolean,
    required: true
  },
  starred: {
    type: Boolean
  },
  deleted: {
    type: Boolean,
    required: true
  }, 
  position: {
    type: Number, 
    required: true
  } 
}, {timestamps: true});



export const FileModel = mongoose.model<IFileModel>('FileModel', fileSchema, 'files');

