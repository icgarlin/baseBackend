import { GraphQLSchema } from 'graphql';
import { AuthChecker,
         buildSchema, 
         ContainerGetter, 
         ContainerType } from 'type-graphql';
import { BasicError } from '../../modules/__shared__/error';
import { PubSubEngine,
         PubSubOptions } from 'graphql-subscriptions';
import { Context } from '../../modules/__shared__/interfaces';



// eslint-disable-next-line @typescript-eslint/ban-types
type Resolvers = readonly [Function, ...Function[]] | [Function, ...Function[]] | readonly [string, ...string[]] | [string, ...string[]]; 

interface TypeGraphQLSchemaBuilderConfig {
  resolvers: Resolvers,
  nullableByDefault: boolean; 
  container?: ContainerType | ContainerGetter<any>; 
  validate: boolean;
  pubSub?: PubSubEngine | PubSubOptions;  
  authChecker: AuthChecker<any, any>; 
}

class TypeGraphQLSchemaBuilder {
    
    private resolvers: TypeGraphQLSchemaBuilderConfig['resolvers'];
    private container: TypeGraphQLSchemaBuilderConfig['container'];
    private nullableByDefault: TypeGraphQLSchemaBuilderConfig['nullableByDefault']; 
    private validate: TypeGraphQLSchemaBuilderConfig['validate']; 
    private pubSub: PubSubEngine | PubSubOptions; 
    private authChecker: TypeGraphQLSchemaBuilderConfig['authChecker'];

    constructor (config: TypeGraphQLSchemaBuilderConfig) {
       this.resolvers = config.resolvers; 
       this.nullableByDefault = config.nullableByDefault; 
       this.validate = config.validate; 
       this.pubSub = config.pubSub; 
       this.authChecker = config.authChecker; 
       if (config.container !== undefined) this.container = config.container; 

    }

    build = async (): Promise<GraphQLSchema | BasicError> => {
        try {
            return await buildSchema({
                                       resolvers: this.resolvers,
                                       container: this.container,
                                       nullableByDefault: this.nullableByDefault,
                                       validate: this.validate,
                                       pubSub: this.pubSub,
                                       authChecker: this.authChecker
                                    }); 
        } catch (error) {
            return error as BasicError; 
        }
    }
}

export default TypeGraphQLSchemaBuilder; 
