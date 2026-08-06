import { getRedis } from "./redis";

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`[cache] ${label} timed out after ${ms}ms`)),
        ms,
      ),
    ),
  ]);
}
export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  try {
    const cached = await withTimeout(getRedis().get(key), 1000, `get "${key}"`);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch (err) {
    console.error(`[cache] read failed for key "${key}":`, err);
  }

  const fresh = await fetcher();

  try {
    await withTimeout(
      getRedis().set(key, JSON.stringify(fresh), "EX", ttlSeconds),
      1000,
      `set "${key}"`,
    );
  } catch (err) {
    console.error(`[cache] write failed for key "${key}":`, err);
  }

  return fresh;
}

export async function invalidateCache(key: string) {
  try {
    await withTimeout(getRedis().del(key), 1000, `del "${key}"`);
  } catch (err) {
    console.error(`[cache] invalidate failed for key "${key}":`, err);
  }
}
