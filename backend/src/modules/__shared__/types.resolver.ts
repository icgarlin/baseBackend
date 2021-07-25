
import { Bool, 
         FileUrl, 
         FileUrlList, 
         GenericError, 
         IDList, 
         PaymentIntentSecret, 
         PreSignedInfo, 
         ServerSubscriptionInfo, 
         Success } from './schema';
import { User, 
         UserList } from '../user/schema';
import { createUnionType } from 'type-graphql';
import { Notification, NotificationConnection, NotificationInfo } from '../__shared__/notification/schema'; 


export const SuccessOrErrorUnion = createUnionType({
    name: "SuccessOrError", // the name of the GraphQL union
    types: () => [Success, GenericError] as const, // function that returns tuple of object types classes
    resolveType: value => {
      if ("success" in value) {
        return Success; 
      } 
      return GenericError;
    },
  });
  
  
export const PreSignedInfoOrErrorUnion = createUnionType({
    name: "PreSignedInfoOrError", // the name of the GraphQL union
    types: () => [PreSignedInfo, GenericError] as const, // function that returns tuple of object types classes
    resolveType: value => {
      if ('urls' in value && 'keys' in value) {
        return PreSignedInfo; 
      } 
      return GenericError;
    },
  });
  
export const BoolOrErrorUnion = createUnionType({
    name: "BoolOrError", // the name of the GraphQL union
    types: () => [Bool, GenericError] as const, // function that returns tuple of object types classes
    resolveType: value => {
      if ('code' in value) {
        return GenericError; 
      }
      return Bool;
    },
});
  
export const UserOrErrorUnion = createUnionType({
    name: "UserOrError", 
    types: () => [User, GenericError] as const, 
    resolveType: value => {
      if ('code' in value) {
        return GenericError; 
      } 
      return User;
    },
})

export const UserListOrErrorUnion = createUnionType({
  name: 'UserListOrError', 
  types: () => [UserList, GenericError] as const, 
  resolveType: value => {
    if ('code' in value) {
      return GenericError; 
    } 
    return UserList;
  },
})

export const FileUrlOrErrorUnion = createUnionType({
    name: "FileUrlOrError",
    types: () => [FileUrl, FileUrlList, GenericError] as const,
    resolveType: (value) => {
       if ('code' in value) {
          return GenericError;
       } else if ('urls' in value) {
          return FileUrlList; 
       }
       return FileUrl;
    },
});

 export const FileUrlListOrErrorUnion = createUnionType({
  name: 'FileListUrlOrError',
  types: () => [FileUrlList, GenericError] as const,
  resolveType: (value) => {
     if ('code' in value) {
        return GenericError;
     } 
     return FileUrlList;
  },
});


export const IDListOrErrorUnion = createUnionType({
  name: 'IDListOrError',
  types: () => [IDList, GenericError] as const,
  resolveType: (value) => {
     if ('code' in value) {
        return GenericError;
     } 
     return IDList;
  },
});


export const PaymentIntentSecretOrErrorUnion = createUnionType({
  name: 'PaymentIntentSecretOrError',
  types: () => [PaymentIntentSecret, GenericError] as const,
  resolveType: (value) => {
     if ('code' in value) {
        return GenericError;
     } 
     return PaymentIntentSecret;
  },
});

export const ServerSubscriptionInfoOrErrorUnion = createUnionType({
  name: 'ServerSubscriptionInfoOrErrorUnion',
  types: () => [ServerSubscriptionInfo, GenericError] as const,
  resolveType: (value) => {
     if ('code' in value) {
        return GenericError;
     } 
     return ServerSubscriptionInfo;
  },
});



export const NotificationOrErrorUnion = createUnionType({
  name: 'NotificationOrError', 
  types: () => [Notification, GenericError] as const,
  resolveType: (value) => {
    if ('code' in value) {
       return GenericError;
    } 
    return Notification;
 }, 
})



export const NotificationConnectionOrErrorUnion = createUnionType({
  name: 'NotificationConnectionOrError', 
  types: () => [NotificationConnection, GenericError] as const,
  resolveType: (value) => {
    if ('code' in value) {
       return GenericError;
    } 
    return NotificationConnection;
 }, 
})


export const NotificationInfoOrErrorUnion = createUnionType({
  name: 'NotificationInfoOrError', 
  types: () => [NotificationInfo, GenericError] as const,
  resolveType: (value) => {
    if ('code' in value) {
       return GenericError;
    } 
    return NotificationInfo;
 }, 
})
 
 