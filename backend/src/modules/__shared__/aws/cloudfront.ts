import { cfSigner } from "../../../config/aws";
import { ICloudServiceRepo } from "../interfaces";
import { Service } from "typedi";

@Service()
export class CloudFrontRepo implements ICloudServiceRepo {
    getUrl = (key: string): string => {
        const twoDays = 2*24*60*60*1000; 
        const signedUrl = cfSigner.getSignedUrl({
        url: `${process.env.CF_DOMAIN}/${key}`, 
        expires: Math.floor((Date.now() + twoDays)/1000), // Unix UTC timestamp for now + 2 days
        })
        return signedUrl; 
    }

    getUrls = (keys: string[]): string[] => {
        const urls: string[] = [];
        for (let i=0;i<keys.length;i++) {
           const url = this.getUrl(keys[i]); 
           urls.push(url); 
        }
        return urls; 
    }
}



