import { IAdminRepo } from '../__shared__/admin/interface';
import { BasicError, ErrorCode, ISuccess } from '../__shared__/error';
import { ICloudServiceRepo } from '../__shared__/interfaces';
import { INotificationRepo } from '../__shared__/notification/interface';
import { IEditProfileInfo, 
         IAccountHelper, 
         ILogin, 
         IProfileData, 
         IUser, 
         IUserRepo, 
         IRegistration } from './interfaces';


export class UserController {
    private userRepo: IUserRepo; 
    private cloudService: ICloudServiceRepo;
    private accountHelper: IAccountHelper;
    private admin: IAdminRepo;  
    public notification: INotificationRepo; 
    constructor (repo: IUserRepo, cloud: ICloudServiceRepo, helper: IAccountHelper, adminRepo?: IAdminRepo, notifRepo?: INotificationRepo) {
        // database management system 
         this.userRepo = repo;
        // cloud service 
        this.cloudService = cloud; 
        // token library 
        this.accountHelper = helper; 
        if (adminRepo !== undefined) {
          this.admin = adminRepo; 
        }

        if (notifRepo !== undefined) this.notification = notifRepo; 
    }

    login = async (username: string, password: string): Promise<ILogin | BasicError>  => {
        try {
            const { comparePassword, createAccessToken, createRefreshToken } = this.accountHelper; 
            const resp = await this.userRepo.login(username,password,false,
                                                    comparePassword,createAccessToken,
                                                    createRefreshToken);
            if (resp instanceof BasicError) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    register = async (info: IRegistration): Promise<ILogin | BasicError>  => {
        try {
            const { comparePassword, createAccessToken, createRefreshToken } = this.accountHelper; 
            const { createCustomer } = this.admin; 
            const resp = await this.userRepo.register(info,
                                                      comparePassword,
                                                      createAccessToken,
                                                      createRefreshToken,
                                                      createCustomer);
            if (resp instanceof Error) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }
    
    getUser = async (userId: string): Promise<IUser | BasicError>  => {
        try {   
            const resp = await this.userRepo.findUser(userId); 
            if (resp instanceof BasicError) throw (resp);
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    getInfo = async (username: string): Promise<IProfileData | BasicError> => {
        try {
            const resp = await this.userRepo.getProfileInfo(username);
            if (resp instanceof BasicError) throw (resp);
          
            return resp; 
        } catch (error) {
            return error as BasicError; 
        }
    }
    
    editUserInfo = async (userId: string, info: IEditProfileInfo): Promise<true | BasicError> => {
        try {
            const { avatar, cover, email, name, password } = info; 
            if (avatar) {
                const res = await this.userRepo.updateAvatar(userId,avatar); 
                if (res instanceof BasicError) throw (res); 
            } 
            if (cover) {
                const res = await this.userRepo.updateCover(userId,cover); 
                if (res instanceof BasicError) throw (res); 
            }
            if (password) {
                const res = await this.userRepo.updatePassword(userId,password); 
                if (res instanceof BasicError) throw (res); 
            }
            if (name) {
               const res = await this.userRepo.updateDisplayName(userId,name); 
               if (res instanceof BasicError) throw (res); 
            }
            if (email) {
               const res = await this.userRepo.updateEmail(userId,email); 
               if (res instanceof BasicError) throw (res); 
            }
            return true; 
        } catch (error) {
            return error as BasicError; 
        }
    }
   

    acceptConnectRequest = async (userId: string, connectId: string): Promise<ISuccess | BasicError> => {
        try {
            const res = await this.userRepo.addToConnected(userId,connectId);
            console.log('first res ', res);  
            if (res instanceof Error) throw (res); 
            const connectRes = await this.userRepo.addToConnected(connectId,userId); 
            console.log('second res ', connectRes); 
            if (connectRes instanceof Error) throw (connectRes); 
            return {success:true};  
        } catch (error) {
            return error as BasicError; 
        }
    }

    getConnections = async (userId: string): Promise<IUser[] | BasicError> => {
        try {       
            const res = await this.userRepo.getConnections(userId); 
            if (res instanceof Error) throw (res); 
            return res; 
        } catch (error) {
            return error as BasicError; 
        }
    }
 
    
}