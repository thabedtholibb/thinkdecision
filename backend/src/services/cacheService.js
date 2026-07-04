const redis = require('redis');

let redisClient = null;
let isConnected = false;

const initializeRedis = async () => {
  if (!process.env.REDIS_URL) {
    console.log('[Cache] Redis not configured - caching disabled (set REDIS_URL to enable)');
    return null;
  }

  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
      },
    });

    redisClient.on('error', (err) => {
      console.error('[Cache] Redis error:', err);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('[Cache] Redis connected');
      isConnected = true;
    });

    await redisClient.connect();
    console.log('[Cache] Redis client initialized');
    return redisClient;
  } catch (error) {
    console.error('[Cache] Failed to initialize Redis:', error);
    redisClient = null;
    return null;
  }
};

const set = async (key, value, ttl = 3600) => {
  if (!isConnected || !redisClient) {
    return null;
  }

  try {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await redisClient.setEx(key, ttl, serialized);
    } else {
      await redisClient.set(key, serialized);
    }
    return true;
  } catch (error) {
    console.error('[Cache] Error setting cache:', error);
    return null;
  }
};

const get = async (key) => {
  if (!isConnected || !redisClient) {
    return null;
  }

  try {
    const value = await redisClient.get(key);
    if (value) {
      return JSON.parse(value);
    }
    return null;
  } catch (error) {
    console.error('[Cache] Error getting cache:', error);
    return null;
  }
};

const del = async (key) => {
  if (!isConnected || !redisClient) {
    return null;
  }

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('[Cache] Error deleting cache:', error);
    return null;
  }
};

const invalidatePattern = async (pattern) => {
  if (!isConnected || !redisClient) {
    return null;
  }

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return keys.length;
  } catch (error) {
    console.error('[Cache] Error invalidating pattern:', error);
    return null;
  }
};

const flush = async () => {
  if (!isConnected || !redisClient) {
    return null;
  }

  try {
    await redisClient.flushDb();
    return true;
  } catch (error) {
    console.error('[Cache] Error flushing cache:', error);
    return null;
  }
};

// Cache key generators
const getCacheKeys = {
  aggregatedResults: (caseId) => `results:aggregated:${caseId}`,
  caseResults: (caseId) => `results:${caseId}`,
  caseList: (userId) => `cases:list:${userId}`,
  expertList: (caseId) => `experts:list:${caseId}`,
  notifications: (userId) => `notifications:${userId}`,
  userProfile: (userId) => `user:${userId}`,
};

module.exports = {
  initializeRedis,
  set,
  get,
  del,
  invalidatePattern,
  flush,
  getCacheKeys,
  isConnected: () => isConnected,
};
