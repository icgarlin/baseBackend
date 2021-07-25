/* eslint-disable @typescript-eslint/restrict-plus-operands */
import { BasicError, 
         ErrorCode, 
         ISuccess } from '../error';
import { IServerInviteCode, 
         INodeMailerConfig, 
         UpdatedDocument } from '../interfaces';
import { createTransport } from 'nodemailer'; 
import Mail from 'nodemailer/lib/mailer';
import crypto from 'crypto';
import { ServerModel } from '../../server/server.model';
import { IAdminRepo, 
         INodeMailerSendResponse,  
         ISubscriptionInfo, 
         ISubscriptionInput, 
         Params} from './interface'; 
import Stripe from 'stripe';
import { Service } from 'typedi';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//                                                           apiVersion: '2020-08-27',
//                                                          });

@Service()
class AdminRepo implements IAdminRepo {

    public nodeMailerConfig: INodeMailerConfig; 
    public nodeMailerTransport: Mail; 
    private stripe: Stripe; 
    constructor (config?: INodeMailerConfig) {
      if (config !== undefined) {
        this.nodeMailerConfig = config; 
        this.nodeMailerTransport = createTransport(this.nodeMailerConfig); 
      }
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2020-08-27',
      }); 
    }

    createServerInvitationCode = (): IServerInviteCode | BasicError => {
      try {
        const code = crypto.randomBytes(8).toString('hex'); 
        return {code, expiration: new Date(new Date(Date.now()).getTime() + 60 * 60 * 24 * 1000)}; 
      } catch (error) {
          return error as BasicError; 
      }
    }

    sendServerInvitationCodeToEmail = async (emailTo: string, serverName: string, serverId: string, code: string): Promise<ISuccess | BasicError> => {
      try {
        // const codeInfo = this.createActivationCode(); 
        const mailDetails = {
          from: 'team@thndr.tv', 
          to: emailTo, 
          subject: `Invitation to join Thndr Cloud: ${serverName}`,
          text: `Login/Register and join cloud with id ${serverId} with the following invitation code: ${code}`
        }; 

        let res: any;
        const mailRes = await this.nodeMailerTransport.sendMail(mailDetails) as INodeMailerSendResponse; 
        console.log('the mailRes ,', mailRes); 
        if (mailRes.accepted.includes(emailTo)) {
          return {success:true}; 
        } else {
          throw new BasicError(ErrorCode.BadRequest, `Could not send invite code to email - ${emailTo}`)
        }
      } catch (error) {
          return error as BasicError; 
      }
    }


    addCodeToServer = async (serverId: string, adminId: string, codeInfo: IServerInviteCode): Promise<ISuccess | BasicError> => {
      try {
        const server = await ServerModel.findOne({serverId}); 
        if (!(server.admins.includes(adminId))) throw (new BasicError(ErrorCode.Unauthorized, `Admin with id ${adminId} is not authorized`)); 
        console.log('the codeINfo ', codeInfo); 
        const inviteCode =  {
          code: codeInfo.code,
          expiration: codeInfo.expiration
        }
        const updatedServer = await ServerModel.updateOne({serverId}, {
                                                                    $push: {
                                                                      inviteCodes: {code: codeInfo.code, 
                                                                                    expiration: codeInfo.expiration}
                                                                    }
                                                                  }) as UpdatedDocument; 
        if (updatedServer.nModified === 1) return {success: true}; 
        else throw (new BasicError(ErrorCode.MongoDBError, `Could not update server with serverId ${serverId}`)); 
      } catch (error) {
          return error as BasicError; 
      }
    }

    sendInvoiceToEmail = async (emailTo: string): Promise<ISuccess | BasicError> => {
      try {
        const mailDetails = {
          from: 'team@thndr.tv', 
          to: emailTo, 
          subject: `Your Thndr Invoice`,
          text: `Your invoice`
        }; 

        let res: any;
        const mailRes = await this.nodeMailerTransport.sendMail(mailDetails) as INodeMailerSendResponse; 
        if (mailRes.accepted.includes(emailTo)) {
          return {success:true}; 
        } else {
          throw new BasicError(ErrorCode.BadRequest, `Could not send invoice to email - ${emailTo}`)
        }
      } catch (error) {
          return error as BasicError; 
      }
    }

    createCustomer = async (name: string, email: string): Promise<string | BasicError> => {
      try {
        const customer = await this.stripe.customers.create({ 
                                                              name,
                                                              email
                                                            });
        return customer.id; 
        
      } catch (error) {
          if ('statusCode' in error) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const { statusCode } = error; 
            if (statusCode === 400) {
              return (new BasicError(ErrorCode.BadRequest,`Invalid email`)); 
            }
          }
          return error as BasicError; 
      }
    }

    createSubscription = async (input: ISubscriptionInput): Promise<ISubscriptionInfo | BasicError> => {
      try {
        const { serverId, customerId, paymentMethodId, priceId, quantity } = input; 
        const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
                                                                                    customer: customerId,
                                                                                  });
        await this.stripe.customers.update(
          customerId,
          {
            invoice_settings: {
              default_payment_method: paymentMethod.id,
            },
          }
        );
    
        // Create the subscription
        const subscription = await this.stripe.subscriptions.create({
          customer: customerId,
          metadata: {
            serverId
          }, 
          items: [
            { price: priceId, quantity: quantity },
          ],
          expand: ['latest_invoice.payment_intent', 'plan.product'],
        });
        return {
          id: subscription.id,
          currentPeriodEnd: subscription.current_period_end,
          customerId: subscription.customer.toString(),
          status: subscription.status,
          productId: subscription.items.data[0].price.product.toString()
        }; 
      } catch (error) {
          return error as BasicError
      }
    }

    retryInvoice = async (customerId: string, paymentMethodId: string, invoiceId: string): Promise<Stripe.Invoice | BasicError> => {
      try {

          await this.stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId,
          });

          await this.stripe.customers.update(customerId, {
            invoice_settings: {
              default_payment_method: paymentMethodId,
            },
          });
      
          const invoice = await this.stripe.invoices.retrieve(invoiceId, {
            expand: ['payment_intent'],
          });
          
          return invoice; 
      } catch (error) {
          return error as BasicError; 
      }
    }

    getPaymentIntentSecret = async (amount: number): Promise<{clientSecret: string} | BasicError> => {
      try {
        const paymentIntent = await this.stripe.paymentIntents.create({
                                                                        amount: amount * 100,
                                                                        currency: 'usd',
                                                                        payment_method_types: ['card'],
                                                                        // Verify your integration in this guide by including this parameter
                                                                        metadata: {integration_check: 'accept_a_payment'},
                                                                      });
        const { client_secret } = paymentIntent; 
        return {
          clientSecret: client_secret
        }; 
      } catch (error) {
          return error as BasicError; 
      }
    }

    getSubscriptionInfo = async (subscriptionId: string): Promise<any | BasicError> => {
      try {
        const subscription = await this.stripe.subscriptions.retrieve(subscriptionId, {
          expand: [
            'latest_invoice',
            'customer.invoice_settings.default_payment_method',
            'items.data.price.product',
          ],
        });
      
        const upcoming_invoice = await this.stripe.invoices.retrieveUpcoming({
          subscription: subscriptionId,
        });
      
        const item = subscription.items.data[0];
         console.log("our item man ", item);
         console.log('our subscrip ', subscription);
         return {
          // card: subscription.customer.invoice_settings.default_payment_method.card,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          // product_description: item.price.product.name,
          current_price: item.price.id,
          current_quantity: item.quantity,
          latest_invoice: subscription.latest_invoice,
          upcoming_invoice: upcoming_invoice,
         };
      } catch (error) {
          return error as BasicError; 
      }
    }


    getUpcomingInvoice = async (newPriceId: string, subscriptionId: string | null, customerId: string, quantity: number): Promise<any | BasicError> => {
      try {
      
        let params: Params; 
        params['customer'] = customerId;
        let subscription;
      
        if (subscriptionId != null) {
          params['subscription'] = subscriptionId;
          subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      
          const currentPriceId = subscription.items.data[0].price.id;
      
          if (currentPriceId == newPriceId) {
            params['subscription_items'] = [
              {
                id: subscription.items.data[0].id,
                quantity: quantity,
              },
            ];
          } else {
            params['subscription_items'] = [
              {
                id: subscription.items.data[0].id,
                deleted: true,
              },
              {
                price: newPriceId,
                quantity: quantity,
              },
            ];
          }
        } else {
          params['subscription_items'] = [
            {
              price: newPriceId,
              quantity: quantity,
            },
          ];
        }
      
        const invoice = await this.stripe.invoices.retrieveUpcoming(params);
      
        let response: any = {};
      
        if (subscriptionId != null) {
          const currentPeriodEnd = subscription.current_period_end;
          let immediateTotal = 0;
          let nextInvoiceSum = 0;
      
          invoice.lines.data.forEach((invoiceLineItem) => {
            if (invoiceLineItem.period.end == currentPeriodEnd) {
              immediateTotal += invoiceLineItem.amount;
            } else {
              nextInvoiceSum += invoiceLineItem.amount;
            }
          });
      
          response = {
            immediateTotal,
            nextInvoiceSum,
            invoice: invoice,
          };

          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return response; 
        } else {
          response = {
            invoice: invoice,
          };

          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return response; 
        }
      
      } catch (error) {
          return error as BasicError; 
      }
    }

    updateSubscription = async (subscriptionId: string, newPriceId: string, quantity: number): Promise<ISubscriptionInfo | BasicError> => {
      try {
        const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

        const currentPriceId = subscription.items.data[0].price.id;
        let updatedSubscription;
      
        if (currentPriceId == newPriceId) {
          updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
            items: [
              {
                id: subscription.items.data[0].id,
                quantity: quantity,
              },
            ],
          });
        } else {
          updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
            items: [
              {
                id: subscription.items.data[0].id,
                deleted: true,
              },
              {
                price: newPriceId,
                quantity: quantity,
              },
            ],
            expand: ['plan.product'],
          });
        }
     
        /*
        let invoice = await this.stripe.invoices.create({
          customer: updatedSubscription.customer.toString(),
          subscription: updatedSubscription.id,
          description:
            'Change to ' +
            quantity +
            ' seat(s) on the ' +
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            // updatedSubscription.plan.product.name +
            (subscription.items.data[0].plan.product as Stripe.Product).name
        });
      
        invoice = await this.stripe.invoices.pay(invoice.id);
        */ 
        return {
          id: updatedSubscription.id,
          currentPeriodEnd: updatedSubscription.current_period_end,
          customerId: updatedSubscription.customer.toString(),
          status: updatedSubscription.status,
          productId: updatedSubscription.items.data[0].price.product.toString()
        }
      } catch (error) {
          return error as BasicError; 
      }
    }

    cancelSubscription = async (subscriptionId: string): Promise<ISuccess | BasicError> => {
      try {
        const deletedSubscription = await this.stripe.subscriptions.del(subscriptionId);
        console.log('Deleted Subscription... ', deletedSubscription);  
        if (deletedSubscription instanceof Stripe) return {success: true}; 
        throw (new BasicError(ErrorCode.BadRequest, `Could not cancel subscription`)); 
      } catch (error) {
          return error as BasicError; 
      }
    }

    updateSubscriptionPaymentMethod = async (subscriptionId: string, paymentMethodId: string): Promise<ISubscriptionInfo | BasicError> => {
      try {
        const subscription = await this.stripe.subscriptions.update(subscriptionId, {
          default_payment_method: paymentMethodId,
        });

        return {
          id: subscription.id,
          currentPeriodEnd: subscription.current_period_end,
          customerId: subscription.customer.toString(),
          status: subscription.status,
          productId: subscription.items.data[0].price.product.toString()
        }
      } catch (error) {
          return error as BasicError; 
      }
    }
    
}


export default AdminRepo; 