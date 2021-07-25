import 'reflect-metadata'; 
import { registerEnumType } from 'type-graphql';

export enum SERVERTIER {
  BASIC = 0,
  PUBLIC = 1,
  ENTERPRISE = 2
}

registerEnumType(SERVERTIER, {
   name: 'SERVERTIER', // this one is mandatory
   description: 'Server Tier', // this one is optional
});
   