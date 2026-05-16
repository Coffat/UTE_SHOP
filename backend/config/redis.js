import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
});

redisClient.on('error', (err) => console.error('❌ Redis Client Error:', err));
redisClient.on('connect', () => console.log('✅ Redis connected'));

// Connect ngay khi module được import
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('❌ Failed to connect to Redis:', err.message);
  }
})();

export default redisClient;
