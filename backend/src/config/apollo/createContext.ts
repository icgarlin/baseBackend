import { Context, DecodedInfo } from '../../modules/__shared__/interfaces';
import { UserController } from '../../modules/user/controller';
import jwt from 'jsonwebtoken';
import AccountHelper from '../../modules/user/account.helper';
import MongoDBUserRepo from '../../modules/user/repo.mongo';
import { CloudFrontRepo } from '../../modules/__shared__/aws/cloudfront';

const mongoUserRepo = new MongoDBUserRepo();
const cloudService = new CloudFrontRepo();
const helper = new AccountHelper()
const userControl = new UserController(mongoUserRepo,cloudService,helper);



export const createContext = async (token: string): Promise<Context> => { 
    if (!token) {
      return {
        user: null 
      };
    }
    const authorization = token.split(' ')[1];
  
    try {
      const decoded: DecodedInfo = jwt.verify(authorization,process.env.JWT_SECRET) as DecodedInfo;
      const { userId } = decoded; 
      if (userId) {
          const res = await userControl.getUser(userId);  
          if ('code' in res) throw (res);
          return {user:res};  
      } else return {user:null}; 
    } catch (err) {
        console.log('the error ', err);
        if ('expiredAt' in err) {
          return {user:null}; 
        }
    }
  }