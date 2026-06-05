/**
 * In-memory cache for expensive DB queries.
 * On Vercel serverless, this lives as long as the warm function instance.
 * TTL = 120 seconds (2 minutes) — stale data is acceptable for dashboards.
 * 
 * PERFORMANCE: Previously 60s TTL caused frequent re-computation.
 * Mutation endpoints call invalidate() to ensure fresh data after writes.
 */

const cache = new Map();

function get(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function set(key, data, ttlMs = 120000) {
  cache.set(key, { data, expiry: Date.now() + ttlMs });
}

function invalidate(prefix) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

function invalidateAll() {
  cache.clear();
}

module.exports = { get, set, invalidate, invalidateAll };
