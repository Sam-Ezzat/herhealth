import dotenv from 'dotenv';
import { Redis } from '@upstash/redis';

dotenv.config();

type CacheEntry = {
  value: unknown;
  expiresAt: number;
};

const memoryStore = new Map<string, CacheEntry>();

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

export const getCache = async <T>(key: string): Promise<T | null> => {
  if (redis) {
    const value = await redis.get<T>(key);
    return value ?? null;
  }

  const entry = memoryStore.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }

  return entry.value as T;
};

export const setCache = async (key: string, value: unknown, ttlSeconds = 60): Promise<void> => {
  if (redis) {
    await redis.set(key, value, { ex: ttlSeconds });
    return;
  }

  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
};

export const deleteCache = async (key: string): Promise<void> => {
  if (redis) {
    await redis.del(key);
    return;
  }

  memoryStore.delete(key);
};

export const isRedisEnabled = (): boolean => Boolean(redis);
