// Redis client — works with local Redis (redis://) or Upstash (rediss://)
// Falls back gracefully if Redis is unavailable (cache miss, not crash)

let redisClient: any = null;

async function getClient() {
  if (redisClient) return redisClient;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    if (url.includes('upstash')) {
      // Upstash HTTP client (edge-compatible)
      const { Redis } = await import('@upstash/redis');
      redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL || url,
        token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
      });
    } else {
      // Standard Redis (local / Render / Railway)
      const { createClient } = await import('redis');
      redisClient = createClient({ url });
      redisClient.on('error', (err: Error) => {
        console.warn('Redis error (non-fatal):', err.message);
        redisClient = null;
      });
      await redisClient.connect();
    }
    return redisClient;
  } catch (err) {
    console.warn('Redis unavailable — continuing without cache');
    return null;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = await getClient();
    if (!client) return null;
    const val = await client.get(key);
    if (!val) return null;
    return typeof val === 'string' ? JSON.parse(val) : val;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds = 300
): Promise<void> {
  try {
    const client = await getClient();
    if (!client) return;
    const serialized = JSON.stringify(value);
    // Works for both node-redis and @upstash/redis
    if (typeof client.set === 'function') {
      await client.set(key, serialized, { EX: ttlSeconds });
    }
  } catch {
    // Cache write failure is non-fatal
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const client = await getClient();
    if (!client) return;
    await client.del(key);
  } catch {}
}

// Cache key helpers
export const CacheKeys = {
  exams: () => 'exams:all',
  exam: (slug: string) => `exam:${slug}`,
  subjects: (examId: string) => `subjects:${examId}`,
  performance: (userId: string, examId?: string) =>
    `perf:${userId}:${examId ?? 'all'}`,
  leaderboard: (
    id: string,
    period: 'all' | 'week' | 'month' = 'all',
    scope: 'test' | 'exam' = 'test'
  ) => `lb:${scope}:${id}:${period}`,
};
