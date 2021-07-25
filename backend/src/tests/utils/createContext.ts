import { UserModel } from "../../models";
import { Context } from "../../interfaces";



export const createContext = async (username: string): Promise<Context | null> => {
    if (!username) return null; 
    const user = await UserModel.findOne({username});
    console.log('our user ', user);  
    if (user) return {user}; 
    return null; 
}
// export const context = createContext("waterman"); 