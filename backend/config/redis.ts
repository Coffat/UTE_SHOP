import { createClient } from 'redis';

const MAX_RETRY_DELAY_MS = 30_000;
const MAX_RETRIES = 20;

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  socket: {
    // Exponential back-off capped at 30 s; stop retrying after MAX_RETRIES attempts.
    reconnectStrategy: (retries) => {
      if (retries >= MAX_RETRIES) {
        console.error(`❌ Redis: giving up after ${MAX_RETRIES} reconnect attempts`);
        return new Error('Redis reconnect limit reached');
      }
      const delay = Math.min(100 * Math.pow(2, retries), MAX_RETRY_DELAY_MS);
      return delay;
    },
  },
});

redisClient.on('error', (err: Error) => {
  // Suppress repetitive ECONNREFUSED noise; a single message per attempt is enough.
  const msg = err?.message ?? String(err);
  if (msg.includes('ECONNREFUSED') || msg.includes('connect ECONNREFUSED')) {
    console.warn('⚠️  Redis unavailable (ECONNREFUSED) – retrying in background…');
  } else {
    console.error('❌ Redis Client Error:', err);
  }
});
redisClient.on('connect', () => console.log('✅ Redis connected'));
redisClient.on('reconnecting', () => console.log('🔄 Redis reconnecting…'));

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('❌ Failed to connect to Redis:', errorMessage);
  }
})();

export default redisClient;
