import 'reflect-metadata';
import { IUserModel } from './user.model';
import { ObjectType, Field, ID, Root, InputType } from 'type-graphql';
import { FileUrlOrErrorUnion } from '../__shared__/types.resolver';
import { GenericError } from '../__shared__/schema';
import { ICloudServiceRepo } from '../__shared__/interfaces';



@ObjectType()
export class User {
  constructor(public cloudService?: ICloudServiceRepo) {}
  @Field(() => ID, {nullable: false})
  _id: IUserModel['_id'];
  @Field(() => String, {nullable: false})
  username?: IUserModel['username'];
  @Field(() => String, {nullable: false})
  password?: IUserModel['password'];
  @Field(() => String, {nullable: false})
  email?: IUserModel['email'];
  @Field(() => String)
  name?: IUserModel['name'];
  @Field(() => [String], {nullable: false})
  roles?: IUserModel['roles'];
  @Field(() => String, {nullable: false})
  bio?: IUserModel['bio'];
  @Field(() => String, {nullable: false})
  birth?: IUserModel['birth'];
  @Field(() => String, {nullable: false})
  avatar?: IUserModel['avatar'];
  @Field(() => FileUrlOrErrorUnion, {nullable: false})
  avatarUrl?(
    @Root() user: User
  ): typeof FileUrlOrErrorUnion {
    try {
      const { avatar } = user;
      if (avatar !== '') { 
        const url = this.cloudService.getUrl(avatar);
        return {url}; 
      } else {
        return {url: ''}; 
      }
    } catch (error) {
        return error as GenericError; 
    }
  }

  @Field(() => String, {nullable: false})
  cover?: IUserModel['cover'];
  @Field(() => [ID], {nullable: false})
  followerIds?: IUserModel['followerIds'];
  @Field(() => [ID], {nullable: false})
  followingIds?: IUserModel['followingIds'];
  @Field(() => [ID], {nullable: false})
  connections?: string[]; 
  @Field(() => String, {nullable: false})
  stripeCustomerId?: IUserModel['stripeCustomerId']; 
  @Field(() => Date)
  lastLogin?: IUserModel['lastLogin'];
  @Field(() => String, {nullable: false})
  refreshToken?: IUserModel['refreshToken'];
}

@ObjectType()
export class UserList {
  @Field(() => [User])
  users: User[];
}

@ObjectType()
export class Login {
  @Field(() => User)
  user: User;
  @Field(() => String)
  accessToken: string;
}


@ObjectType() 
export class ProfileInfo {
  @Field(() => ID, {nullable: false})
  _id: IUserModel['_id']; 
  @Field(() => String, {nullable: false})
  username: IUserModel['username']; 
  @Field(() => String, {nullable: false})
  name: IUserModel['name'];
  @Field(() => String, {nullable: false})
  email: IUserModel['email'];  
  @Field(() => [ID], {nullable: false})
  followerIds: IUserModel['followerIds'];
  @Field(() => [ID], {nullable: false})
  followingIds: IUserModel['followingIds'];
}

@InputType()
export class FollowInput {
  @Field(() => String, {nullable: false})
  followerId: string; 
  @Field(() => String, {nullable: false})
  followedId: string;
}


@InputType()
export class UnFollowInput {
  @Field(() => String, {nullable: false})
  unfollower: string; 
  @Field(() => String, {nullable: false})
  unfollowedId: string;
}

