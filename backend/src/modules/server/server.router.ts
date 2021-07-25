import MongoDBUserRepo from '../user/repo.mongo';
import { CloudFrontRepo } from '../__shared__/aws/cloudfront';
import ServerController from './controller';
import MongoDBServerRepo from './serverRepo.mongo';
import express from 'express';
import { S3Repo } from '../__shared__/aws/s3';
import MongoDBServerMessageReactionsRepo from './reactions.repo';

  
const router = express.Router();
const cloudFront = new CloudFrontRepo();
const mongoUserRepo = new MongoDBUserRepo();
const mongoServerRepo = new MongoDBServerRepo();
const blobRepo = new S3Repo(); 
const mongoServerMsgReactionsRepo = new MongoDBServerMessageReactionsRepo()
const serverControl = new ServerController(mongoServerRepo,mongoUserRepo,mongoServerMsgReactionsRepo,cloudFront,blobRepo);


router.get(`/get-user-server-list`, serverControl.getUserServerList); 
// router.get(`/channel-msgs`, serverControl.loadChannelMsgs);
router.get(`/activeusers`, serverControl.getActiveUsers);
router.get(`/saved`, serverControl.getSavedMsgs); 
router.get(`/unactiveusers`, serverControl.getUnactiveUsers);
router.post(`/promote`, serverControl.promoteUserToAdmin);
router.post(`/demote`, serverControl.demoteUserFromAdmin);
router.post(`/change`, serverControl.changeServerOwner);
router.post(`/create-channel`, serverControl.createChannel);
router.post(`/rename-server`, serverControl.renameServer);
router.post(`/insert-message`, serverControl.insertMessage); 
router.post(`/msg/pick-reaction`, serverControl.pickMsgReaction);
router.post(`/msg/remove-reaction`, serverControl.removeMsgReaction);


export default router; 