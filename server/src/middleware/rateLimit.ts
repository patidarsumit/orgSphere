import { NextFunction, Request, Response } from 'express'

type RateLimitOptions = {
  keyPrefix: string
  maxRequests: number
  windowMs: number
  message?: string
}

type RateLimitBucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, RateLimitBucket>()

const cleanupExpiredBuckets = (now: number) => {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key)
    }
  }
}

const getClientKey = (req: Request, keyPrefix: string) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  return `${keyPrefix}:${ip}`
}

export const rateLimit = ({
  keyPrefix,
  maxRequests,
  windowMs,
  message = 'Too many requests. Please try again later.',
}: RateLimitOptions) => {
  let lastCleanupAt = 0

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now()

    if (now - lastCleanupAt > windowMs) {
      cleanupExpiredBuckets(now)
      lastCleanupAt = now
    }

    const key = getClientKey(req, keyPrefix)
    const existingBucket = buckets.get(key)
    const bucket =
      existingBucket && existingBucket.resetAt > now
        ? existingBucket
        : { count: 0, resetAt: now + windowMs }

    bucket.count += 1
    buckets.set(key, bucket)

    const remaining = Math.max(maxRequests - bucket.count, 0)
    const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000)

    res.setHeader('X-RateLimit-Limit', String(maxRequests))
    res.setHeader('X-RateLimit-Remaining', String(remaining))
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)))

    if (bucket.count > maxRequests) {
      res.setHeader('Retry-After', String(retryAfterSeconds))
      res.status(429).json({
        code: 'RATE_LIMITED',
        message,
        retryAfterSeconds,
      })
      return
    }

    next()
  }
}
