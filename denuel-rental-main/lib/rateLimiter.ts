import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';

let rateLimiter: any;

if (process.env.REDIS_URL) {
  // prefer Redis in production (requires ioredis available)
  try {
    const IORedis = require('ioredis');
    const client = new IORedis(process.env.REDIS_URL);
    rateLimiter = new RateLimiterRedis({ storeClient: client, points: 60, duration: 60 }); // 60 req/min
  } catch (e) {
    // fallback to memory
    rateLimiter = new RateLimiterMemory({ points: 20, duration: 60 });
  }
} else {
  // simple in-memory rate limiter for endpoints
  rateLimiter = new RateLimiterMemory({ points: 20, duration: 60 }); // 20 requests per minute per key
}

export async function checkRate(key = 'global') {
  try {
    await rateLimiter.consume(key);
    return true;
  } catch (e) {
    return false;
  }
}