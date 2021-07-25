import { Registration } from "../../schema/utils";
import { createServer } from "../../utils/serverUtils";
import { gCall } from "./gCall"
import { registerMutation } from "./mutation"

// export const createFirstThndrCloud = (firstCloudUsers: Registration[]) => {
//    firstCloudUsers.forEach(async (cloudUser) => {
//         const registeredUser = await gCall({
//             source: registerMutation,
//             contextValue: null, 
//             variableValues: {
//                username: cloudUser.username,
//                name: cloudUser.name,
//                email: cloudUser.email,
//                password: cloudUser.password
//             }
//         });
//         console.log('the registed user: ', registeredUser); 
//     });
// } 



export const registerAdmin = async (admin: Registration, serverName: string) => {
    const adminRes = await gCall({
        source: registerMutation,
        contextValue: null, 
        variableValues: {
           registration: admin
        } 
    });
    console.log('the adminRes: ', adminRes);  
    const adminUsername = adminRes.data.register.user.username; 
    const newServer: any = await createServer(adminUsername,serverName); 
    console.log('this is the newServerId ', newServer.serverId); 
    return {server: newServer, admin: adminUsername}; 
}
