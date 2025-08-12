type Key = string

const buckets = new Map<Key, { tokens: number; lastRefill: number }>()

export function rateLimit(key: Key, limit = 10, windowMs = 60_000) {
  const now = Date.now()
  const bucket = buckets.get(key) || { tokens: limit, lastRefill: now }
  const elapsed = now - bucket.lastRefill
  if (elapsed > windowMs) {
    bucket.tokens = limit
    bucket.lastRefill = now
  }
  if (bucket.tokens <= 0) {
    buckets.set(key, bucket)
    return { allowed: false, remaining: 0 }
  }
  bucket.tokens -= 1
  buckets.set(key, bucket)
  return { allowed: true, remaining: bucket.tokens }
}
