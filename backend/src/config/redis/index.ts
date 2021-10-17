import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';

const options = {
  retryStrategy: (times: number) => {
    // reconnect after
    return Math.min(times * 50, 2000);
  }
};

// export const pubSub = new RedisPubSub({
//   publisher: new Redis(REDIS_URL, options),
//   subscriber: new Redis(REDIS_URL, options)
// });
  