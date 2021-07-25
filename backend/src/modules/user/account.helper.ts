import { BasicError } from "../__shared__/error";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Service } from "typedi";


@Service()
class AccountHelper {

    comparePassword = async (password: string, hashedPassword: string): Promise<boolean | BasicError> => {
        try {
            const isMatch = await bcrypt.compare(password, hashedPassword); 
            return isMatch; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    createAccessToken = (userId: string): string | BasicError => {
        try {
            return jwt.sign({ userId }, process.env.JWT_SECRET, {
                expiresIn: '24h'
            });
        } catch (error) {
            return error as BasicError; 
        }
    }

    createRefreshToken = (userId: string): string | BasicError => {
        try {
            return jwt.sign({type: 'refresh', date: Date.now(), userId},
            process.env.JWT_SECRET, {expiresIn: '24h'});
        } catch (error) {
            return error as BasicError; 
        }
    }
}

export default AccountHelper; 