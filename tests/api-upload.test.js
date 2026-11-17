// @vitest-environment node

import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  auth: async () => ({ user: { id: "student-1" } }),
}));

vi.mock("@/lib/server/api", () => ({
  authenticateApiRequest: (...args) => state.auth(...args),
  aiRequestLimiter: { check: () => ({ allowed: true, retryAfterSeconds: 0 }) },
  readBoundedBody: async (request) => Buffer.from(await request.arrayBuffer()),
  safeString: (value, maxLength) => typeof value === "string" && value.length <= maxLength ? value.trim() : "",
}));

vi.mock("@/lib/server/ai", () => ({
  getGeminiModel: () => null,
  generateBoundedContent: vi.fn(),
  parseProviderJson: vi.fn(),
}));

import { POST } from "@/app/api/uploadResume/route";

let tempRoot;
afterEach(async () => {
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true });
  tempRoot = undefined;
  delete process.env.RESUME_TEMP_ROOT;
});

describe("resume upload cleanup", () => {
  it("parses synthetic TXT data and always removes its private work directory", async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "nexawork-api-test-"));
    process.env.RESUME_TEMP_ROOT = tempRoot;

    const form = new FormData();
    form.append("resume", new Blob(["React Python SQL"], { type: "text/plain" }), "resume.txt");
    form.append("jobDescription", "React developer with Python and SQL");
    const request = new Request("http://localhost/api/uploadResume", { method: "POST", body: form });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect((await response.json()).found_skills).toContain("react");
    expect(await fs.readdir(tempRoot)).toEqual([]);
  });
});
