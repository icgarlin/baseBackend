import express from 'express';
import MongoDBUserRepo from '../user/repo.mongo';
import { CloudFrontRepo } from '../__shared__/aws/cloudfront';
import DirectMessageController from './controller';
import MongoDBDirectMessageRepo from './repo.mongo';
const router = express.Router();


const mongoDMRepo = new MongoDBDirectMessageRepo()
const mongoUserRepo = new MongoDBUserRepo(); 
const awsCloudRepo = new CloudFrontRepo();
const dmControl = new DirectMessageController(mongoDMRepo,mongoUserRepo,awsCloudRepo);


router.get(`/dm-users`, dmControl.getDMUsers);
router.get(`/convo`, dmControl.loadConversation);


export default router; 




