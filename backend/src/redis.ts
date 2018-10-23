import * as Redis from "ioredis";

const opts: Redis.RedisOptions = {
  host: process.env.ELASTICACHE_ENDPOINT,
  port: 6379,
  db: 0
};

export const set = (key: string, value: string, expiry: number) => {
  if (process.env.IS_OFFLINE) {
    // localhost cannot access redis
    return Promise.resolve();
  }

  const client = new Redis(opts);
  return client.set(key, value, "EX", expiry);
};

export const get = (key: string) => {
  if (process.env.IS_OFFLINE) {
    // localhost cannot access redis
    return Promise.resolve(undefined);
  }

  const client = new Redis(opts);
  return client.get(key);
};

export const setJson = (key: string, value: object, expiry: number) => {
  return set(key, JSON.stringify(value), expiry);
};

export const getJson = async (key: string) => {
  const value: string = await get(key);

  if (!!value) {
    return JSON.parse(value);
  }
};
