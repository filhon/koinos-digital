import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (
    !_redis &&
    process.env.UPSTASH_REDIS_URL &&
    process.env.UPSTASH_REDIS_TOKEN
  ) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
    });
  }
  return _redis;
}
