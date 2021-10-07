/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// require('@babel/register'); 
import { Client } from 'typesense'; 


let filesSchema = {
    'name': 'files',
    'fields': [
        {'name': 'id', 'type': 'string'},
        {'name': 'ownerId', 'type': 'string'},
        {'name': 'name', 'type': 'string'},
        {'name': 'size', 'type': 'int64'}, 
        {'name': 'createdAt', 'type': 'string'},
        {'name': 'type', 'type': 'string'}
    ],
    'default_sorting_field': 'name'
}

let foldersSchema = {
    'name': 'folders',
    'fields': [
        {'name': 'id', 'type': 'string'},
        {'name': 'ownerId', 'type': 'string'},
        {'name': 'name', 'type': 'string'}, 
        {'name': 'createdAt', 'type': 'string'},
        {'name': 'type', 'type': 'string'}
    ],
    'default_sorting_field': 'name'
}


export const typesenseClient = new Client({
    'nodes': [{
        'host': 'localhost', // For Typesense Cloud use xxx.a1.typesense.net
        'port': '8108',      // For Typesense Cloud use 443
        'protocol': 'http'   // For Typesense Cloud use https
      }],
      'apiKey': '<API_KEY>',
      'connectionTimeoutSeconds': ''
});



typesenseClient.collections().create(filesSchema)
  .then(function (data) {
    console.log(data)
});

typesenseClient.collections().create(foldersSchema)
  .then(function (data) {
    console.log(data)
});
