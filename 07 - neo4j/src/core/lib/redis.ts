// external-imports
import { Redis } from 'ioredis';

// create redis client
export const redis = new Redis({ host: process.env.REDIS_HOST!, port: +process.env.REDIS_PORT! });
