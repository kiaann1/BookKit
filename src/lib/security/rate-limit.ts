type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export function checkRateLimit(
  key: string,
  options: { limit: number; windowMs: number },
): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true };
  }

  if (entry.count >= options.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count += 1;
  return { allowed: true };
}

export function rateLimitResponse(retryAfterSeconds?: number) {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again later.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        ...(retryAfterSeconds
          ? { "Retry-After": String(retryAfterSeconds) }
          : {}),
      },
    },
  );
}

export function enforceRateLimit(
  request: Request,
  scope: string,
  options: { limit: number; windowMs: number },
) {
  const ip = getClientIp(request);
  const result = checkRateLimit(`${scope}:${ip}`, options);

  if (!result.allowed) {
    return rateLimitResponse(result.retryAfterSeconds);
  }

  return null;
}

export function enforceUserRateLimit(
  userId: string,
  scope: string,
  options: { limit: number; windowMs: number },
) {
  const result = checkRateLimit(`${scope}:user:${userId}`, options);

  if (!result.allowed) {
    return rateLimitResponse(result.retryAfterSeconds);
  }

  return null;
}
