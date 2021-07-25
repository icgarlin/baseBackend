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
  InternalServerError = 500,
  MongoDBError = 512, 
}
  
