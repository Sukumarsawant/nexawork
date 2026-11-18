// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  getUser: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser: state.getUser } }),
}));

import {
  authenticateApiRequest,
  createTimeoutFetch,
  createPerUserRateLimiter,
  readBoundedBody,
  readBoundedJson,
} from "@/lib/server/api";

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  state.getUser.mockReset();
});

describe("bounded API helpers", () => {
  it("rejects malformed JSON and capped request bodies", async () => {
    const malformed = new Request("http://localhost/api", { method: "POST", body: "{" });
    await expect(readBoundedJson(malformed, 100)).rejects.toThrow("INVALID_JSON");

    const tooLarge = new Request("http://localhost/api", { method: "POST", body: "x".repeat(101) });
    await expect(readBoundedJson(tooLarge, 100)).rejects.toThrow("REQUEST_TOO_LARGE");
  });

  it("throttles per user and expires entries", () => {
    const limiter = createPerUserRateLimiter({ limit: 2, windowMs: 100 });
    expect(limiter.check("student-a", 0).allowed).toBe(true);
    expect(limiter.check("student-a", 1).allowed).toBe(true);
    expect(limiter.check("student-a", 2).allowed).toBe(false);
    expect(limiter.check("student-b", 2).allowed).toBe(true);
    expect(limiter.check("student-a", 101).allowed).toBe(true);
  });

  it("fails closed for new users at capacity without evicting active entries", () => {
    const limiter = createPerUserRateLimiter({ limit: 2, windowMs: 100, maxTrackedUsers: 2 });
    expect(limiter.check("student-a", 0).allowed).toBe(true);
    expect(limiter.check("student-b", 0).allowed).toBe(true);
    expect(limiter.check("attacker-c", 1).allowed).toBe(false);
    expect(limiter.check("student-a", 1).allowed).toBe(true);
    expect(limiter.check("attacker-c", 101).allowed).toBe(true);
  });

  it("bounds a slow request stream", async () => {
    const slowStream = new ReadableStream({ start() {} });
    const request = new Request("http://localhost/api", {
      method: "POST",
      body: slowStream,
      duplex: "half",
    });

    await expect(readBoundedBody(request, 100, 10)).rejects.toThrow("REQUEST_TIMED_OUT");
  });

  it("returns a safe failure when token validation never resolves", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    state.getUser.mockImplementation(() => new Promise(() => {}));
    const request = new Request("http://localhost/api", {
      headers: { Authorization: "Bearer valid-looking-token" },
    });

    await expect(authenticateApiRequest(request, { authTimeoutMs: 10 })).resolves.toEqual({
      error: "Authentication service is unavailable",
      status: 503,
    });
  });

  it("keeps the network deadline active when headers arrive before a stalled body", async () => {
    vi.stubGlobal("fetch", vi.fn((_input, init) => {
      const stalledBody = new ReadableStream({
        start(controller) {
          init.signal.addEventListener("abort", () => controller.error(new Error("aborted")), { once: true });
        },
      });
      return Promise.resolve(new Response(stalledBody, { status: 200 }));
    }));

    const response = await createTimeoutFetch(10)("http://localhost/test");
    await expect(response.text()).rejects.toThrow();
  });
});
