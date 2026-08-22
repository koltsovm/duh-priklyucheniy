import { RequestHandler } from "express";

interface Bucket {
  count: number;
  resetAt: number;
}

/** Простой in-memory rate limiter по IP. Для продакшена заменить на Redis. */
export function rateLimit(max: number, windowMs: number): RequestHandler {
  const buckets = new Map<string, Bucket>();

  return (req, res, next) => {
    const ip = req.ip ?? "unknown";
    const now = Date.now();
    const bucket = buckets.get(ip);

    if (!bucket || bucket.resetAt < now) {
      buckets.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > max) {
      return res.status(429).json({ error: "Слишком много запросов, попробуйте позже" });
    }
    next();
  };
}