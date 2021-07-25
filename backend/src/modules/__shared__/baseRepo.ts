/* eslint-disable @typescript-eslint/restrict-plus-operands */
import { BasicError } from "./error";



class BaseRepo {
    fromCursorHash = (cursor: string): string => Buffer.from(cursor, 'base64').toString('ascii');
    toCursorHash = (cursor: string): string => cursor ? Buffer.from(cursor).toString('base64') : '';

    generateId = (): string => {
        return ('' + 1e7 + -1e3 + -4e3 + -8e3 + -1e11).replace(/1|0/g, function () {
          return (0 | (Math.random() * 16)).toString(16);
        });
      };
      
    getUniqueId = (): string | BasicError => {
        try {

        } catch (error) {
            return error as BasicError; 
        }
    }
} 

export default BaseRepo; 