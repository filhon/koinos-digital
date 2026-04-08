import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN,
  });
}

interface RateLimitOptions {
  identifier: string;
  limit: number;
  /** Janela em segundos */
  window: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number; // Unix timestamp em segundos
}

export async function rateLimit({
  identifier,
  limit,
  window,
}: RateLimitOptions): Promise<RateLimitResult> {
  if (!redis) {
    return { success: true, remaining: limit, reset: 0 };
  }

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${window} s`),
    prefix: "koinos:rl",
  });

  const { success, remaining, reset } = await limiter.limit(identifier);
  return { success, remaining, reset: Math.floor(reset / 1000) };
}
