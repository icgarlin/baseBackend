import { createUnionType } from 'type-graphql';
import { GenericError } from '../__shared__/schema';
import { Channel, ChannelData, ChannelDataList, ServerData, ServerDataList, ServerFileConnection, ServerList, ServerMessageConnection } from './schema';

export const ServerMessageConnectionOrErrorUnion = createUnionType({
    name: 'ServerMessageConnectionOrError',
    types: () => [ServerMessageConnection, GenericError] as const,
    resolveType: value => {
        if ('code' in value) {
            return GenericError;
        }
        return ServerMessageConnection;
    }, 
})


export const ServerDataOrErrorUnion = createUnionType({
    name: 'ServerDataOrError',
    types: () => [ServerData, GenericError] as const,
    resolveType: value => {
        if ('code' in value) {
            return GenericError;
        }
        return ServerData;
    },
});


export const ServerDataListOrErrorUnion = createUnionType({
    name: 'ServerDataListOrError',
    types: () => [ServerDataList, GenericError] as const,
    resolveType: value => {
        if ('code' in value) {
            return GenericError;
        }
        return ServerDataList;
    },
});


export const ChannelOrErrorUnion = createUnionType({
    name: 'ChannelOrError',
    types: () => [Channel, GenericError] as const,
    resolveType: value => {
        if ('code' in value) {
            return GenericError;
        }
        return Channel;
    },
});

export const ChannelDataOrErrorUnion = createUnionType({
    name: 'ChannelDataOrError',
    types: () => [ChannelData, GenericError] as const,
    resolveType: value => {
        if ('code' in value) {
            return GenericError;
        }
        return ChannelData;
    },
});

export const ChannelDataListOrErrorUnion = createUnionType({
    name: 'ChannelDataListOrError',
    types: () => [ChannelDataList, GenericError] as const,
    resolveType: value => {
        if ('code' in value) {
          return GenericError;
        }
        return ChannelDataList;
    },
});

export const ServerListOrErrorUnion = createUnionType({
    name: 'ServerListOrError',
    types: () => [ServerList, GenericError] as const,
    resolveType: value => {
        if ('code' in value) {
            return GenericError;
        }
        return ServerList;
    },
});


export const ServerFileConnectionOrErrorUnion = createUnionType({
    name: 'ServerFileConnectionOrError',
    types: () => [ServerFileConnection, GenericError] as const,
    resolveType: value => {
        if ('code' in value) {
            return GenericError;
        }
        return ServerFileConnection;
    },
});
 