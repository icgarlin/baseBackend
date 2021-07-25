import { AuthChecker, ResolverData } from 'type-graphql';
import { Context } from '../../modules/__shared__/interfaces';


/* Authentication */ 
export const authChecker: AuthChecker<Context> = (
  { context, args }: ResolverData<Context>,
  roles,
): boolean => {
  const { user } = context; 
  if (roles.length === 0) {
    // if `@Authorized()`, check only if user exists
    return user !== undefined;
  }
  if (!user || !user._id) return false;  
  if (roles.length > 0 && typeof roles[0] === 'string') {
    roles.forEach((role: string) => {
        if (role === 'ACCOUNTOWNER') {
          const { userId } = args;
          if (typeof userId === 'string') { 
          if (user._id !== userId) return false; 
          } 
        }
        if (!(user.roles.includes(role))) return false; 
     }); 
  } 
  return true; 
};
