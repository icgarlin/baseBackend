import { AuthChecker } from 'type-graphql';
import { Context } from './interfaces';



export const customAuthChecker: AuthChecker<Context> = (
    { root, context },
    roles,
  ) => {

    const { user } = context; 
    if (!user) return false; 
    const { _id } = user; 
    if (roles.includes('SERVEROWNER')) {
        
    }
    // here we can read the user from context
    // and check his permission in the db against the `roles` argument
    // that comes from the `@Authorized` decorator, eg. ["ADMIN", "MODERATOR"]
  
    return true; // or false if access is denied
  };