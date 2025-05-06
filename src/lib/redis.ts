import Redis from "ioredis";

export const redisPublisher = new Redis(); // For publishing
export const redisSubscriber = new Redis(); // For subscribing
