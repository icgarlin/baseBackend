/* eslint-disable @typescript-eslint/no-unsafe-member-access */
export class BasicError extends Error {
  code: number; 
  constructor(code?: number, message?: string) {
    super();
    this.message = message; 
    this.code = code; 
  }
}

export interface ISuccess {
  success: true
}

export enum ErrorCode {
  MovedPermanently = 301,
  BadRequest = 400,
  Unauthorized = 401,  
  NotFound = 404,
  UserInputError = 420,
  PaymentError = 430, 
  InternalServerError = 500,
  MongoDBError = 512, 
}



export const handleMongoError = (error: any): BasicError => {
  if (error['code'] === 11000) {
    return new BasicError(ErrorCode.MongoDBError,'Duplicate credential error');
  } else if (error['code'] === 11000) {

  } else {
      return new BasicError(ErrorCode.MongoDBError,'Database error'); 
  }
}


export const handleStripeError = (error: any): BasicError => {
  switch (error.type) {
    case 'StripeCardError':
      // A declined card error
      error.message; // => e.g. "Your card's expiration year is invalid."
      return new BasicError(ErrorCode.PaymentError,error.message);
    case 'StripeRateLimitError':
      // Too many requests made to the API too quickly
      return new BasicError(ErrorCode.PaymentError,error.message);
    case 'StripeInvalidRequestError':
      // Invalid parameters were supplied to Stripe's API
      return new BasicError(ErrorCode.PaymentError,error.message);
    case 'StripeAPIError':
      // An error occurred internally with Stripe's API
      return new BasicError(ErrorCode.PaymentError,error.message);
    case 'StripeConnectionError':
      // Some kind of error occurred during the HTTPS communication
      return new BasicError(ErrorCode.PaymentError,error.message); 
    case 'StripeAuthenticationError':
      // You probably used an incorrect API key
      return new BasicError(ErrorCode.PaymentError,error.message);
    default:
      // Handle any other types of unexpected errors
      return new BasicError(ErrorCode.PaymentError,error.message);
  }
}
  
  
