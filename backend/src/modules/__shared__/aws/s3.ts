import { BasicError, ISuccess } from '../error';
import { s3 } from '../../../config/aws/';
import { IFileRepo } from '../interfaces';
import FileHelper from '../file.helper';
import { Service } from 'typedi';
import { S3 } from 'aws-sdk';
import cryptoRandomString from 'crypto-random-string';
import { promises as fsp } from 'fs'; 


@Service()
export class S3Repo extends FileHelper implements IFileRepo {


    downloadFile = async (key: string, bucket: string): Promise<ISuccess | BasicError> => {
        try {
          const { Body } = await s3.getObject({Key: key, Bucket: bucket}).promise(); 
          // await fsp.writeFile(``, Body); 
          return {success:true}; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    sizeOfFile = async (key: string, bucket: string): Promise<number | BasicError> => {
        try {
            return s3.headObject({Key: key, Bucket: bucket})
            .promise()
            .then(res => {
              return res.ContentLength; 
             });
        } catch (error) {
            console.log('the error sie of file ', error);
            return error as BasicError 
        }
    }

    getS3SignedUrl = async (bucketName: string, key: string, expires: number, type: string, acl: string): Promise<string | BasicError> => {
        try {
            const url = await s3.getSignedUrlPromise('putObject', {
                Bucket: bucketName,
                Key: key,
                Expires: expires,
                ContentType: type,
                ACL: acl
            });  
            return url; 
        } catch (error) {
            return error as BasicError; 
        }
    }

    removeSpacesFromName = (name: string): string => {
        return name.replace(/\s/g, '_');  
    }

    createUserFileKey = (userId: string, fname: string, ftype: string): string => {
        const hash = cryptoRandomString({length: 5});
        const ext = this.findExtension(ftype); 
        const mimeFolder = this.checkImageAudioVideo(ext); 
        if (fname.indexOf(' ') >= 0) {
           const name = this.removeSpacesFromName(fname);
           return `users/${userId}/${mimeFolder}/${hash}-${name}`
        } else {
           return `users/${userId}/${mimeFolder}/${hash}-${fname}` 
        }
    }

    createServerFileKey = (serverId: string, fname: string, ftype: string): string => {
        const hash = cryptoRandomString({length: 5});
        const ext = this.findExtension(ftype); 
        const mimeFolder = this.checkImageAudioVideo(ext); 
        if (fname.indexOf(' ') >= 0) {
           const name = this.removeSpacesFromName(fname);
           return `server/${serverId}/${mimeFolder}/${hash}-${name}`
        } else {
           return `users/${serverId}/${mimeFolder}/${hash}-${fname}` 
        } 
    }

    deleteFile = (key: string): ISuccess | BasicError => {
        try {
            const params = {
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: key
            }
            let deleteData: S3.DeleteObjectOutput; 
            s3.deleteObject(params, (err, data) => {
                if (err) {
                    console.log('error ', err);
                    throw (err);  
                }
                if (data) deleteData = data;
            });
            if (deleteData === null || deleteData === undefined) return {success:true}; 
            else throw (new BasicError()); 
        } catch (error) {
            console.log('errr ', error); 
            return error as BasicError; 
        }
    }

    handleGetPreSignedUrl = async (fName: string, fType: string, userId: string, serverId?: string): Promise<{url: string, key: string} | BasicError> => {
        try { 
        const signedUrlExpireSeconds = 60 * 5;
        if (serverId !== undefined) { 
            const key = this.createServerFileKey(userId,fName,fType);
            const url = await this.getS3SignedUrl(process.env.AWS_BUCKET_NAME,key,signedUrlExpireSeconds,fType,'public-read'); 
            if (url instanceof Error) throw (url);   
            return {url, key}; 
        } else {
            const key = this.createUserFileKey(userId,fName,fType);
            const url = await this.getS3SignedUrl(process.env.AWS_BUCKET_NAME,key,signedUrlExpireSeconds,fType,'public-read'); 
            if (url instanceof Error) throw (url);   
            return {url, key}; 
        }
        } catch (error) {
            return error as BasicError; 
        }
    }
}