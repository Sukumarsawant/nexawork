import { createClient } from "@supabase/supabase-js";

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_TRACKED_USERS = 1_000;
const DEFAULT_AUTH_TIMEOUT_MS = 5_000;
const DEFAULT_BODY_READ_TIMEOUT_MS = 15_000;

export function createPerUserRateLimiter({
  limit,
  windowMs = DEFAULT_WINDOW_MS,
  maxTrackedUsers = DEFAULT_MAX_TRACKED_USERS,
}) {
  const attempts = new Map();

  return {
    check(userId, now = Date.now()) {
      for (const [key, entry] of attempts) {
        if (entry.resetAt <= now) attempts.delete(key);
      }

      const entry = attempts.get(userId);
      if (entry && entry.count >= limit) {
        return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1_000) };
      }

      // Do not evict active users to make room: that would let an attacker churn IDs
      // and continually reset another user's in-memory protection.
      if (!entry && attempts.size >= maxTrackedUsers) {
        return { allowed: false, retryAfterSeconds: Math.ceil(windowMs / 1_000) };
      }

      attempts.set(userId, entry
        ? { ...entry, count: entry.count + 1 }
        : { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}

// This bounded limiter is deliberately process-local. Multi-instance deployments need a shared quota.
export const aiRequestLimiter = createPerUserRateLimiter({ limit: 6 });

export function getBearerToken(request) {
  const authorization = request.headers.get("authorization") || (process.env.NEXT_PUBLIC_PREVIEW_AUTH_PROXY === "true" ? request.headers.get("x-nexawork-authorization") : null) || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function createTimeoutFetch(timeoutMs) {
  return async (input, init = {}) => {
    const controller = new AbortController();
    const onAbort = () => controller.abort(init.signal?.reason);
    init.signal?.addEventListener("abort", onAbort, { once: true });
    let timer = setTimeout(() => {
      timer = undefined;
      init.signal?.removeEventListener("abort", onAbort);
      controller.abort();
    }, timeoutMs);
    const release = () => {
      if (timer) clearTimeout(timer);
      timer = undefined;
      init.signal?.removeEventListener("abort", onAbort);
    };

    try {
      const response = await fetch(input, { ...init, signal: controller.signal });
      if (!response.body) {
        release();
        return response;
      }

      const reader = response.body.getReader();
      const body = new ReadableStream({
        async pull(streamController) {
          try {
            const { done, value } = await reader.read();
            if (done) {
              release();
              streamController.close();
              return;
            }
            streamController.enqueue(value);
          } catch (error) {
            release();
            streamController.error(error);
          }
        },
        async cancel(reason) {
          release();
          await reader.cancel(reason).catch(() => {});
        },
      });
      return new Response(body, {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText,
      });
    } catch (error) {
      release();
      throw error;
    }
  };
}

export function createCallerClient(token, { requestTimeoutMs = DEFAULT_AUTH_TIMEOUT_MS } = {}) {
  const url = process.env.SUPABASE_SERVER_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: createTimeoutFetch(requestTimeoutMs),
    },
  });
}

export async function authenticateApiRequest(request, { authTimeoutMs = DEFAULT_AUTH_TIMEOUT_MS } = {}) {
  const token = getBearerToken(request);
  if (!token) return { error: "Authentication required", status: 401 };

  const supabase = createCallerClient(token, { requestTimeoutMs: authTimeoutMs });
  if (!supabase) return { error: "Service is not configured", status: 503 };

  try {
    const { data, error } = await withTimeout(supabase.auth.getUser(token), authTimeoutMs);
    if (error || !data.user) return { error: "Invalid or expired session", status: 401 };
    return { user: data.user, supabase };
  } catch {
    return { error: "Authentication service is unavailable", status: 503 };
  }

}

export async function readBoundedBody(request, maxBytes, timeoutMs = DEFAULT_BODY_READ_TIMEOUT_MS) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error("REQUEST_TOO_LARGE");
  }

  if (!request.body) return Buffer.alloc(0);
  const reader = request.body.getReader();
  try {
    return await withTimeout((async () => {
      const chunks = [];
      let size = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) {
          throw new Error("REQUEST_TOO_LARGE");
        }
        chunks.push(Buffer.from(value));
      }

      return Buffer.concat(chunks, size);
    })(), timeoutMs);
  } catch (error) {
    await reader.cancel().catch(() => {});
    if (error.message === "OPERATION_TIMED_OUT") throw new Error("REQUEST_TIMED_OUT");
    throw error;
  }
}

export async function readBoundedJson(request, maxBytes) {
  const body = await readBoundedBody(request, maxBytes);
  if (!body.length) throw new Error("INVALID_JSON");
  try {
    return JSON.parse(body.toString("utf8"));
  } catch {
    throw new Error("INVALID_JSON");
  }
}

export function withTimeout(promise, timeoutMs) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("OPERATION_TIMED_OUT")), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export function safeString(value, maxLength) {
  return typeof value === "string" && value.length <= maxLength ? value.trim() : "";
}
