declare module 'mongoose-fuzzy-searching' {
    import { Document, 
             DocumentQuery, 
             Model, 
             Schema } from 'mongoose'
  
    export interface MongooseFuzzyOptions<T> {
      // eslint-disable-next-line @typescript-eslint/ban-types
      fields: (T extends Object ? keyof T : string)[]
    }
  
    // eslint-disable-next-line @typescript-eslint/ban-types
    export interface MongooseFuzzyModel<T extends Document, QueryHelpers = {}>
      extends Model<T, QueryHelpers> {
      fuzzySearch(
        search: string,
        callBack?: (err: any, data: Model<T, QueryHelpers>[]) => void
      ): DocumentQuery<T[], T, QueryHelpers>
    }
  
    function fuzzyPlugin<T>(schema: Schema<T>, options: MongooseFuzzyOptions<T>): void
  
    export default fuzzyPlugin
  }