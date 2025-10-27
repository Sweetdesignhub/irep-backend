import { createClient } from 'redis';

// Create a Redis client
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redis.on('error', (err) => console.error('Redis Client Error', err));
redis.on('connect', () => console.log('Connected to Redis!'));

// Connect Redis
await redis.connect();

export default redis;
