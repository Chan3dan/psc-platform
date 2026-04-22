// Redis client — supports node-redis and Upstash REST.
// Falls back gracefully if Redis is unavailable (cache miss, not crash).

let redisClient: any = null;
let redisMode: 'upstash' | 'node' | null = null;

async function getClient() {
  if (redisClient) return redisClient;

  const url = process.env.REDIS_URL?.trim();
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  const hasUpstash = Boolean(upstashUrl && upstashToken);

  if (!url && !hasUpstash) return null;

  try {
    const shouldUseUpstash =
      hasUpstash &&
      (!url || url.includes('upstash') || url.startsWith('http://') || url.startsWith('https://'));

    if (shouldUseUpstash) {
      const { Redis } = await import('@upstash/redis');
      redisClient = new Redis({
        url: upstashUrl!,
        token: upstashToken!,
      });
      redisMode = 'upstash';
    } else {
      const { createClient } = await import('redis');
      redisClient = createClient({ url: url! });
      redisClient.on('error', (err: Error) => {
        console.warn('Redis error (non-fatal):', err.message);
        redisClient = null;
        redisMode = null;
      });
      await redisClient.connect();
      redisMode = 'node';
    }
    return redisClient;
  } catch {
    console.warn('Redis unavailable — continuing without cache');
    redisClient = null;
    redisMode = null;
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
    if (ttlSeconds <= 0 || value === null || typeof value === 'undefined') {
      await client.del(key);
      return;
    }
    const serialized = JSON.stringify(value);
    if (typeof client.set === 'function') {
      if (redisMode === 'upstash') {
        await client.set(key, serialized, { ex: ttlSeconds });
      } else {
        await client.set(key, serialized, { EX: ttlSeconds });
      }
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
  dashboardSummary: (userId: string) => `dashboard:${userId}:summary`,
  resultsHistory: (userId: string) => `results:${userId}:history`,
  leaderboard: (
    id: string,
    period: 'all' | 'week' | 'month' = 'all',
    scope: 'test' | 'exam' = 'test'
  ) => `lb:${scope}:${id}:${period}`,
  adminOverview: () => 'admin:overview',
  adminResults: () => 'admin:results',
  adminUsers: () => 'admin:users',
  adminFlagged: () => 'admin:flagged',
};
