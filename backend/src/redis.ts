import * as Redis from "ioredis";

const opts: Redis.RedisOptions = {
  host: process.env.ELASTICACHE_ENDPOINT,
  port: 6379,
  db: 0
};

export const set = (key: string, value: string, expiry: number) => {
  const client = new Redis(opts);
  return client.set(key, value, "EX", expiry);
};

export const get = (key: string) => {
  const client = new Redis(opts);
  return client.get(key);
};
