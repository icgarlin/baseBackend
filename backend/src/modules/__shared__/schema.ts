import 'reflect-metadata'; 
import { Field, 
         ID, 
         Int, 
         ObjectType, 
         InputType,
         registerEnumType } from "type-graphql";
import { BasicError, 
         ErrorCode } from "./error";

registerEnumType(ErrorCode, {
  name: 'ErrorCode', // this one is mandatory
  description: 'The error codes'
});



@ObjectType()
export class GenericError extends BasicError {
  @Field(() => ErrorCode, {nullable: false})
  code: ErrorCode;
  @Field(() => String, {nullable: false})
  message: string;
  @Field(() => String, {nullable: false})
  path: string; 
}

@ObjectType()
export class Success {
  @Field(() => Boolean)
  success = true; 
}

@ObjectType()
export class Bool {
  @Field(() => Boolean)
  bool: boolean; 
}

@ObjectType()
export class PageInfo {
  @Field(() => Boolean, {nullable: false})
  hasNextPage: boolean;
  @Field(() => String, { nullable: false})
  endCursor: string;
}

@ObjectType()
export class FileUrl {
  @Field(() => String, {nullable: false})
  url: string; 
}

@ObjectType()
export class FileUrlList {
  @Field(() => [String], {nullable: false})
  urls: string[]; 
}

@ObjectType()
export class PreSignedInfo {
  @Field(() => [String])
  urls: string[];
  @Field(() => [String])
  keys: string[];
}


@ObjectType()
export class Reactions {
  @Field(() => [ID], {nullable: false})
  thumbsup: string[];
  @Field(() => [ID], {nullable: false})
  thumbsdown: string[];
  @Field(() => [ID], {nullable: false})
  heart: string[];
  @Field(() => [ID], {nullable: false})
  pray: string[];
  @Field(() => [ID], {nullable: false})
  raised_hands: string[];
}

@ObjectType()
export class ServerInvitationCode {
  @Field(() => String)
  inviteCode: string; 
  @Field(() => Date)
  expiration: Date; 
}

@ObjectType()
export class IDList { 
  @Field(() => [ID], {nullable: false})
  ids: string[]; 
}

@ObjectType()
export class PaymentIntentSecret {
  @Field(() => String, {nullable: false})
  intentSecret: string; 
}

@ObjectType()
export class ServerSubscriptionInfo {
  @Field(() => String, {nullable: false})
  id: string; 
  @Field(() => Int, {nullable: false})
  currentPeriodEnd: number; 
  @Field(() => String, {nullable: false})
  customerId: string; 
  @Field(() => String, {nullable: false})
  status: string; 
}

@InputType()
export class SubscriptionInput {
  @Field(() => String)
  serverId: string; 
  @Field(() => String)
  customerId: string; 
  @Field(() => String)
  paymentMethodId: string; 
  @Field(() => String)
  email: string;
  @Field(() => String)
  name: string; 
  @Field(() => Int)
  quantity: number; 
  @Field(() => String)
  priceId: string; 
}
