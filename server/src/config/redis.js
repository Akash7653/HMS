const { createClient } = require("redis");

let redisClient = null;
let redisReady = false;

function getRedisClient() {
  return redisReady ? redisClient : null;
}

async function connectRedis() {
  // Support both traditional Redis and Upstash HTTPS URLs
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.log("[REDIS] REDIS_URL not configured, running without cache");
    return null;
  }

  if (redisReady && redisClient) {
    return redisClient;
  }

  redisClient = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy(retries) {
        return Math.min(retries * 150, 2500);
      },
    },
  });

  redisClient.on("error", (error) => {
    redisReady = false;
    console.error("[REDIS_ERROR]", error.message);
  });

  redisClient.on("ready", () => {
    redisReady = true;
    console.log("[REDIS] Connected");
  });

  redisClient.on("end", () => {
    redisReady = false;
    console.log("[REDIS] Disconnected");
  });

  try {
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    redisReady = false;
    console.error("[REDIS_CONNECT_ERROR]", error.message);
    return null;
  }
}

module.exports = {
  connectRedis,
  getRedisClient,
};
