import AWS, { S3 } from 'aws-sdk'; 
import * as dotenv from 'dotenv';
dotenv.config(); 




export const s3: S3 = new AWS.S3({ 
                                  signatureVersion: 'v4',
                                  region: process.env.AWS_BUCKET_REGION,
                                  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                                  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
                                 });

// console.log('the key ', process.env.CF_PRIVATE_KEY.replace(/\\n/g, '\n')); 
export const cfSigner = new AWS.CloudFront.Signer(process.env.CF_PUBLIC_ID, process.env.CF_PRIVATE_KEY.replace(/\\n/g, '\n'))  



                