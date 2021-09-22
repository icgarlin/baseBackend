
import { createUnionType,
         registerEnumType } from 'type-graphql';
import { TFile, 
         FileConnection, 
         FileList } from './file/file.schema';
import { FileUrl, 
         GenericError } from '../__shared__/schema';
import { Folder, 
         FolderConnection, 
         FolderList } from './folder/folder.schema';
import { FolderType } from './folder/folder.model';
import { FileAndFolderList, 
         FileOrFolderConnection } from './schema';


export const FileOrErrorUnion = createUnionType({
    name: 'FileOrError',
    types: () => [TFile, GenericError] as const,
    resolveType: value => {
        if ('code' in value) {
            return GenericError;
        }
        return TFile;
    },
});

export const FileListOrErrorUnion = createUnionType({
  name: 'FileListOrError',
  types: () => [FileList, GenericError] as const,
  resolveType: value => {
      if ('code' in value) {
          return GenericError;
      }
      return FileList;
  },
});

export const FileConnectionOrErrorUnion = createUnionType({
    name: 'FileConnectionOrError',
    types: () => [FileConnection, GenericError] as const,
    resolveType: (value) => {
        if ('code' in value) {
            return GenericError;
        }
        return FileConnection;
    },
});
   
export const FileUrlOrErrorUnion = createUnionType({
   name: 'FileUrlOrError',
   types: () => [FileUrl, GenericError] as const,
   resolveType: (value) => {
      if ('code' in value) {
         return GenericError;
      }
      return FileUrl;
   },
});


export const FolderConnectionOrErrorUnion = createUnionType({
    name: 'FolderConnectionOrError', // the name of the GraphQL union
    types: () => [FolderConnection, GenericError] as const, // function that returns tuple of object types classes
    resolveType: value => {
       if ('code' in value) return GenericError; 
       else return FolderConnection; 
    },
});


export const FolderOrErrorUnion = createUnionType({
   name: 'FolderOrError', // the name of the GraphQL union
   types: () => [Folder, GenericError] as const, // function that returns tuple of object types classes
   resolveType: value => {
      if ('code' in value) return GenericError; 
      else return Folder; 
   },
});
  
export const FolderListOrErrorUnion = createUnionType({
   name: 'FolderListOrError', // the name of the GraphQL union
   types: () => [FolderList, GenericError] as const, // function that returns tuple of object types classes
   resolveType: value => {
        if ('code' in value) return GenericError; 
        else return FolderList; 
   }, 
})


export const FileOrFolderUnion = createUnionType({
    name: 'FileOrFolder', // the name of the GraphQL union
    types: () => [TFile, Folder] as const, // function that returns tuple of object types classes
    resolveType: value => {
       if ('key' in value) return TFile; 
       else return Folder; 
    },
 });

export const FileAndFolderListOrErrorUnion = createUnionType({
    name: 'FileAndFolderListOrError', // the name of the GraphQL union
    types: () => [FileAndFolderList, GenericError] as const, // function that returns tuple of object types classes
    resolveType: value => {
       if ('code' in value) return GenericError; 
       else return FileAndFolderList; 
    },
 });

 export const FileOrFolderConnectionOrErrorUnion = createUnionType({
     name: 'FileOrFolderConnectionOrError', // the name of the GraphQL union
     types: () => [FileOrFolderConnection, GenericError] as const, // function that returns tuple of object types classes
     resolveType: value => {
        if ('code' in value) return GenericError; 
        else return FileOrFolderConnection; 
     },
 });

 registerEnumType(FolderType, {
    name: 'FolderType', // this one is mandatory
    description: 'The types of folder objects', // this one is optional
 });
  
  
  