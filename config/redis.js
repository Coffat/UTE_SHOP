const { createClient } = require('redis');

// Create a Redis client pointing at the local Redis instance
const redisClient = createClient({
  url: 'redis://127.0.0.1:6379',
});

// Log any connection-level errors so they are visible in the console
redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

// Confirm when the connection is established
redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

// Initiate the connection asynchronously.
// Errors during connect are surfaced via the 'error' event above.
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('❌ Failed to connect to Redis:', err.message);
  }
})();

module.exports = redisClient;
