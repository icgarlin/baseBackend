import mongoose, { Model } from 'mongoose';
import { IFileModel } from './interfaces';
import mongoose_fuzzy_searching, { MongooseFuzzyModel } from 'mongoose-fuzzy-searching'; 

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'The filename is required'],
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    required: false
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
    required: [true, 'the owner username is required'], 
  },
  server: {
    serverId: {type: mongoose.Schema.Types.ObjectId, ref: 'ServerModel'}, 
    channelId: {type: mongoose.Schema.Types.ObjectId, ref: 'ThndrChannel'},
    required: false, 
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
}, {timestamps: true});


fileSchema.plugin(mongoose_fuzzy_searching, {fields: ['name']})

export const FileModel = mongoose.model<IFileModel>('FileModel', fileSchema, 'files') as MongooseFuzzyModel<IFileModel>;

