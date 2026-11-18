// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  auth: async () => ({ user: { id: "student-1" }, supabase: { rpc: vi.fn() } }),
  body: {},
  bodyError: null,
  model: null,
  providerText: "",
  limiter: { allowed: true, retryAfterSeconds: 0 },
  withTimeout: (promise) => promise,
}));

vi.mock("@/lib/server/api", () => ({
  authenticateApiRequest: (...args) => state.auth(...args),
  aiRequestLimiter: { check: () => state.limiter },
  readBoundedJson: async () => {
    if (state.bodyError) throw new Error(state.bodyError);
    return state.body;
  },
  readBoundedBody: async () => Buffer.alloc(0),
  safeString: (value, maxLength) => typeof value === "string" && value.length <= maxLength ? value.trim() : "",
  withTimeout: (...args) => state.withTimeout(...args),
}));

vi.mock("@/lib/server/ai", () => ({
  getGeminiModel: () => state.model,
  generateBoundedContent: async () => state.providerText,
  parseProviderJson: (text) => JSON.parse(text),
}));

import { POST as proposalPost } from "@/app/api/proposals/route";
import { POST as uploadPost } from "@/app/api/uploadResume/route";
import { POST as verificationPost } from "@/app/api/verification/route";

const request = () => new Request("http://localhost/api", { method: "POST" });

beforeEach(() => {
  state.auth = async () => ({ user: { id: "student-1" }, supabase: { rpc: vi.fn().mockResolvedValue({ data: { badges: ["figma"] }, error: null }) } });
  state.body = {};
  state.bodyError = null;
  state.model = null;
  state.providerText = "";
  state.limiter = { allowed: true, retryAfterSeconds: 0 };
  state.withTimeout = (promise) => promise;
});

describe("proposal API", () => {
  it("rejects unauthenticated callers before reading a body", async () => {
    state.auth = async () => ({ error: "Authentication required", status: 401 });
    const response = await proposalPost(request());
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Authentication required" });
  });

  it("returns a bounded malformed-body response", async () => {
    state.bodyError = "INVALID_JSON";
    const response = await proposalPost(request());
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("Invalid request body");
  });

  it("disables only the missing AI provider path", async () => {
    state.body = { job: { title: "Frontend developer", description: "Build React features" } };
    const response = await proposalPost(request());
    expect(response.status).toBe(503);
    expect((await response.json()).error).toBe("AI proposal generation is unavailable");
  });

  it("rejects a throttled caller", async () => {
    state.limiter = { allowed: false, retryAfterSeconds: 12 };
    const response = await proposalPost(request());
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("12");
  });
});

describe("verification API", () => {
  it("uses the authenticated caller RPC and ignores arbitrary user IDs", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { badges: ["figma"] }, error: null });
    state.auth = async () => ({ user: { id: "student-1" }, supabase: { rpc } });
    state.body = { quizId: "figma", userId: "another-user" };

    const response = await verificationPost(request());
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("award_practice_badge", { quiz_id: "figma" });
    expect(await response.json()).toEqual({ success: true, badges: ["figma"] });
  });

  it("rejects a quiz outside the server allowlist", async () => {
    state.body = { quizId: "admin-badge" };
    const response = await verificationPost(request());
    expect(response.status).toBe(400);
  });

  it("returns a controlled timeout when the practice badge RPC stalls", async () => {
    state.auth = async () => ({
      user: { id: "student-1" },
      supabase: { rpc: vi.fn(() => new Promise(() => {})) },
    });
    state.body = { quizId: "figma" };
    state.withTimeout = async () => { throw new Error("OPERATION_TIMED_OUT"); };

    const response = await verificationPost(request());
    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({ success: false, error: "Practice badge request timed out" });
  });
});

describe("resume API", () => {
  it("authenticates before accepting an upload", async () => {
    state.auth = async () => ({ error: "Invalid or expired session", status: 401 });
    const response = await uploadPost(request());
    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe("Invalid or expired session");
  });
});
