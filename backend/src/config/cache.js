const Redis = require("ioredis");

let redis = null;
let isRedisAvailable = false;

// Fallback in-memory cache: Map<key, { value, expiresAt }>
const memoryCache = new Map();

function initRedis() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    isRedisAvailable = false;
    console.warn("ℹ️ [CACHE] Variable REDIS_URL non configurée. Utilisation du cache mémoire local.");
    return;
  }

  try {
    const isTls = redisUrl.startsWith("rediss://");
    const options = {
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => {
        if (times > 10) return 5000;
        return Math.min(times * 250, 2000);
      },
      enableOfflineQueue: true,
      connectTimeout: 10000
    };

    if (isTls) {
      options.tls = { rejectUnauthorized: false };
    }

    redis = new Redis(redisUrl, options);

    redis.on("connect", () => {
      isRedisAvailable = true;
      console.log("⚡ [CACHE] Connecté au serveur Redis (Upstash) avec succès.");
    });

    redis.on("ready", () => {
      isRedisAvailable = true;
    });

    redis.on("error", (err) => {
      if (isRedisAvailable) {
        console.warn("⚠️ [CACHE] Redis déconnecté ou erreur temporaire :", err.message);
      }
      isRedisAvailable = false;
    });

    redis.on("close", () => {
      isRedisAvailable = false;
    });

    redis.on("reconnecting", () => {
      // Reconnexion automatique gérée par ioredis
    });
  } catch (e) {
    isRedisAvailable = false;
    console.warn("⚠️ [CACHE] Erreur lors de l'initialisation Redis :", e.message);
  }
}

initRedis();

// Nettoyage régulier du cache mémoire (toutes les 60 secondes)
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of memoryCache.entries()) {
    if (item.expiresAt < now) {
      memoryCache.delete(key);
    }
  }
}, 60000);

async function getCache(key) {
  if (isRedisAvailable && redis) {
    try {
      const data = await redis.get(key);
      if (data) return JSON.parse(data);
    } catch (err) {
      // En cas d'erreur de lecture Redis, basculer vers memoryCache
    }
  }
  const item = memoryCache.get(key);
  if (item && item.expiresAt > Date.now()) {
    return item.value;
  }
  return null;
}

async function setCache(key, value, ttlSeconds = 300) {
  if (isRedisAvailable && redis) {
    try {
      await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
      // Donnée enregistrée dans Redis cloud : ne pas encombrer la RAM locale Node.js
      return;
    } catch (err) {
      // Si Redis échoue, on continue vers le fallback mémoire ci-dessous
    }
  }

  // Fallback mémoire local : plafonné strictement à 30 entrées (LRU) pour ne jamais saturer la RAM (max 5-10 Mo)
  if (memoryCache.size >= 30) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }

  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
}

async function clearCachePattern(patternKey) {
  if (isRedisAvailable && redis) {
    try {
      const keys = [];
      await new Promise((resolve, reject) => {
        const stream = redis.scanStream({ match: `*${patternKey}*`, count: 200 });
        stream.on("data", (batch) => keys.push(...batch));
        stream.on("end", resolve);
        stream.on("error", reject);
      });
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      // Ne pas bloquer si erreur de scan
    }
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(patternKey)) {
      memoryCache.delete(key);
    }
  }
}

// Express Cache Middleware
function cacheMiddleware(durationSeconds = 120) {
  return async (req, res, next) => {
    if (req.method !== "GET") return next();

    const boutiqueId = req.boutique ? req.boutique.id : "default";
    const cacheKey = `cache:b${boutiqueId}:${req.originalUrl || req.url}`;
    const cachedData = await getCache(cacheKey);

    if (cachedData) {
      res.setHeader("X-Cache", "HIT");
      return res.json(cachedData);
    }

    res.setHeader("X-Cache", "MISS");
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCache(cacheKey, body, durationSeconds).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  };
}

async function remember(key, ttlSeconds, fetchFn) {
  const cached = await getCache(key);
  if (cached) return cached;
  const fresh = await fetchFn();
  if (fresh) await setCache(key, fresh, ttlSeconds);
  return fresh;
}

async function delCache(key) {
  if (isRedisAvailable && redis) {
    try {
      await redis.del(key);
    } catch (err) {}
  }
  memoryCache.delete(key);
}

module.exports = {
  getCache,
  setCache,
  delCache,
  clearCachePattern,
  cacheMiddleware,
  remember
};
