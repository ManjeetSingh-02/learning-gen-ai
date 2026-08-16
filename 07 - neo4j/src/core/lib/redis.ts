// external-imports
import { Redis } from 'ioredis';

// create redis client
const redis = new Redis({ host: process.env.REDIS_HOST!, port: +process.env.REDIS_PORT! });

// function to set a key-value pair in redis
export async function setRedisKV(key: string, value: any) {
  await redis.set(key, value);
}

// function to get a value from redis by key
export async function getRedisKV(key: string) {
  return await redis.get(key);
}

// function to zadd a value to a sorted set in redis
export async function zaddRedisSortedSet(key: string, score: number, value: string) {
  await redis.zadd(key, score, value);
}

// function to zrangebyscore a sorted set in redis
export async function zrangebyscoreRedisSortedSet(key: string, min: number, max: string) {
  return await redis.zrangebyscore(key, min, max);
}
