import type { NextRequest } from "next/server";

type Bucket = { count: number; resetAt: number };

/**
 * In-memory fixed-window rate limiter.
 *
 * Deliberately simple: this is a single-process guard to stop the mail
 * endpoint being trivially abused, not a distributed quota system. On a
 * multi-instance or serverless deployment each instance keeps its own counter,
 * so a shared store (Redis, Upstash) would be needed for a hard guarantee.
 */
const buckets = new Map<string, Bucket>();

/** Bounds memory use if a lot of distinct keys are seen. */
const MAX_TRACKED_KEYS = 10_000;

export type RateLimitResult = {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
};

export function rateLimit(
    key: string,
    limit: number,
    windowMs: number
): RateLimitResult {
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
        if (buckets.size >= MAX_TRACKED_KEYS) {
            for (const [k, bucket] of buckets) {
                if (bucket.resetAt <= now) buckets.delete(k);
            }
            // Still full of live entries — drop the oldest to stay bounded.
            if (buckets.size >= MAX_TRACKED_KEYS) {
                const oldest = buckets.keys().next().value;
                if (oldest !== undefined) buckets.delete(oldest);
            }
        }

        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
    }

    if (existing.count >= limit) {
        return {
            allowed: false,
            remaining: 0,
            retryAfterSeconds: Math.max(
                1,
                Math.ceil((existing.resetAt - now) / 1000)
            ),
        };
    }

    existing.count += 1;
    return {
        allowed: true,
        remaining: limit - existing.count,
        retryAfterSeconds: 0,
    };
}

/**
 * Best-effort client identity. Behind a proxy this is the forwarded address;
 * it is spoofable, which is why it gates abuse rather than authorisation.
 */
export function getClientKey(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return req.headers.get("x-real-ip") ?? "unknown";
}
