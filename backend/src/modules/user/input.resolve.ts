import { IUser } from './interfaces';
import { InputType, Field } from 'type-graphql';

@InputType()
export class Registration {
  @Field(() => String)
  username: string;
  @Field(() => String)
  name: string; 
  @Field(() => String)
  email: string;
  @Field(() => String)
  password: string;
}

@InputType()
export class EditInfoInput {
  @Field(() => String)
  avatar?: IUser['avatar']; 
  @Field(() => String)
  cover?: IUser['cover']; 
  @Field(() => String) 
  oldPassword?: IUser['password']; 
  @Field(() => String) 
  password?: IUser['password']; 
  @Field(() => String)
  name?: IUser['name']; 
  @Field(() => String) 
  email?: IUser['email']; 
}
