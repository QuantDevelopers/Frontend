/**
 * Maps `items` through an async `worker` with at most `limit` calls in flight.
 * Keeps fan-out requests (e.g. one per underlying) well below the backend rate limiter.
 * Failed items resolve to `undefined` so one bad instrument does not break a whole page.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
  signal?: AbortSignal
): Promise<(R | undefined)[]> {
  const results: (R | undefined)[] = new Array(items.length);
  let cursor = 0;

  async function run(): Promise<void> {
    while (cursor < items.length) {
      if (signal?.aborted) return;
      const index = cursor++;
      try {
        results[index] = await worker(items[index], index);
      } catch (err) {
        if (signal?.aborted) return;
        results[index] = undefined;
        console.warn('mapWithConcurrency: item failed', items[index], err);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}
