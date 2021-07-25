/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Request, 
         Response } from 'express';
import { BasicError } from '../../modules/__shared__/error';
import { CloudFrontRepo } from '../../modules/__shared__/aws/cloudfront';
import MongoDBUserRepo from '../../modules/user/repo.mongo';
import Stripe from 'stripe'; 
import { AdminController } from '../../modules/__shared__/admin/controller';
import AdminRepo from '../../modules/__shared__/admin/admin.repo';
import MongoDBServerRepo from '../../modules/server/serverRepo.mongo';
import ServerController from '../../modules/server/controller';
import MongoDBServerMessageReactionsRepo from '../../modules/server/reactions.repo';
import { S3Repo } from '../../modules/__shared__/aws/s3';
import { SERVERTIER } from '../../modules/server/types';

const stripeWebhook = async (req: Request, res: Response): Promise<Response<any> | BasicError> => {
    try { 
         // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2020-08-27',
       });
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature'],
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(err);
      console.log(`⚠️ Webhook signature verification failed.`);
      console.log(
        `⚠️ Check the env file and enter the correct webhook secret.`
      );
      return res.sendStatus(400);
    }
    // Extract the object from the event.
    const dataObject: any = event.data.object;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    // console.log('Event Data ', (event.data.object as any).lines); 
    const userRepo = new MongoDBUserRepo();  
    const serverRepo = new MongoDBServerRepo(); 
    const cloudRepo = new CloudFrontRepo(); 
    const msgReactionRepo = new MongoDBServerMessageReactionsRepo();  
    const blobRepo = new S3Repo(); 
    const adminRepo = new AdminRepo();  
    const adminControl = new AdminController(adminRepo,userRepo)
    const serverControl = new ServerController(serverRepo,userRepo,msgReactionRepo,cloudRepo,blobRepo); 
    const { customer, status } = dataObject as {customer:string, status:string}; 
    // Handle the event
    // Review important events for Billing webhooks
    // https://stripe.com/docs/billing/webhooks
    // Remove comment to see the various objects sent for this sample

    if ('lines' in dataObject && customer !== '') {
     const lines = dataObject.lines; 
     const productId: string = lines.data[0].price.product; 
     if (productId !== '') {
      const response = await adminControl.updateSubscriptionStatusByProductId(customer,productId,status); 
      if (response instanceof Error) throw (response); 
     } 
    }
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Used to provision services after the trial has ended.
        // The status of the invoice will show up as paid. Store the status in your
        // database to reference when a user accesses your service to avoid hitting rate limits.

        break;
      case 'invoice.payment_failed':
        // If the payment fails or the customer does not have a valid payment method,
        // an invoice.payment_failed event is sent, the subscription becomes past_due.
        // Use this webhook to notify your user that their payment has
        // failed and to retrieve new card details.
  
        break;
      case 'invoice.finalized':
        // If you want to manually send out invoices to your customers
        // or store them locally to reference to avoid hitting Stripe rate limits.
        break;
      case 'customer.subscription.deleted':
        const { metadata } = dataObject; 
        // Downgrades server to basic plan 
        if ('serverId' in metadata) {
          const serverId = dataObject.metadata.serverId; 
          const res = await serverControl.changeServerTier(serverId,SERVERTIER.BASIC); 
          if (res instanceof Error) throw (res); 
        }
        if (event.request != null) {
          // handle a subscription cancelled by your request
          // from above.
        } else {
          // handle subscription cancelled automatically based
          // upon your subscription settings.
        } 
        break;
      case 'customer.subscription.trial_will_end':
        // Send notification to your user that the trial will end
        break;
      default:
      // Unexpected event type
    }
    return res.sendStatus(200);
    } catch (error) {
        res.send(error); 
        return error as BasicError;  
    }
}


export default stripeWebhook; 