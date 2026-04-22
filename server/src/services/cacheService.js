const { getRedisClient } = require("../config/redis");

const CACHE_PREFIX = "hms";

function buildCacheKey(section, payload = {}) {
  const sortedEntries = Object.entries(payload)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b));

  const queryPart = sortedEntries
    .map(([key, value]) => `${key}:${String(value)}`)
    .join("|");

  return `${CACHE_PREFIX}:${section}:${queryPart || "all"}`;
}

async function getCacheJSON(key) {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("[CACHE_GET_ERROR]", key, error.message);
    return null;
  }
}

async function setCacheJSON(key, value, ttlSeconds = 60) {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch (error) {
    console.error("[CACHE_SET_ERROR]", key, error.message);
  }
}

async function invalidateByPrefix(prefix) {
  const client = getRedisClient();
  if (!client) return;

  try {
    const pattern = `${prefix}*`;
    const keys = [];

    for await (const key of client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      keys.push(key);
      if (keys.length >= 200) {
        await client.del(keys);
        keys.length = 0;
      }
    }

    if (keys.length) {
      await client.del(keys);
    }
  } catch (error) {
    console.error("[CACHE_INVALIDATE_ERROR]", prefix, error.message);
  }
}

async function invalidateHotelsCache() {
  await invalidateByPrefix(`${CACHE_PREFIX}:hotels:`);
}

module.exports = {
  buildCacheKey,
  getCacheJSON,
  setCacheJSON,
  invalidateHotelsCache,
};
