import { NextResponse } from "next/server";
import { generateBoundedContent, getGeminiModel, parseProviderJson } from "@/lib/server/ai";
import {
  aiRequestLimiter,
  authenticateApiRequest,
  readBoundedJson,
  safeString,
} from "@/lib/server/api";

const MAX_JSON_BYTES = 16 * 1024;

function invalidRequest(message) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function normalizeJob(job) {
  if (!job || typeof job !== "object" || Array.isArray(job)) return null;
  const title = safeString(job.title, 200);
  const description = safeString(job.description, 6_000);
  if (!title || !description) return null;

  return {
    title,
    description,
    salaryRange: safeString(job.salary_range, 200) || "not specified",
    companyName: safeString(job.company_name, 200) || "Client",
    location: safeString(job.location, 200) || "not specified",
  };
}

function strings(value, maxItems, maxLength) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeProposal(value, job) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const coverLetter = safeString(value.cover_letter, 4_000);
  if (!coverLetter) return null;

  const milestones = Array.isArray(value.milestones)
    ? value.milestones.slice(0, 8).map((milestone) => ({
      title: safeString(milestone?.title, 160),
      description: safeString(milestone?.description, 800),
      cost: Number.isFinite(Number(milestone?.cost)) ? Math.max(0, Number(milestone.cost)) : 0,
      timeline_days: Number.isInteger(Number(milestone?.timeline_days))
        ? Math.max(0, Math.min(3650, Number(milestone.timeline_days)))
        : 0,
    })).filter((milestone) => milestone.title && milestone.description)
    : [];

  return {
    project_title: safeString(value.project_title, 200) || job.title,
    client: safeString(value.client, 200) || job.companyName,
    client_url: safeString(value.client_url, 500),
    job_title: safeString(value.job_title, 200) || job.title,
    cover_letter: coverLetter,
    milestones,
    total_quote: safeString(String(value.total_quote ?? ""), 80) || "0",
    delivery_time: Number.isInteger(Number(value.delivery_time))
      ? Math.max(0, Math.min(3650, Number(value.delivery_time)))
      : 0,
    notes: strings(value.notes, 5, 300),
  };
}

export async function POST(request) {
  const auth = await authenticateApiRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const throttle = aiRequestLimiter.check(auth.user.id);
  if (!throttle.allowed) {
    return NextResponse.json(
      { error: "Please wait before generating another proposal" },
      { status: 429, headers: { "Retry-After": String(throttle.retryAfterSeconds) } },
    );
  }

  let body;
  try {
    body = await readBoundedJson(request, MAX_JSON_BYTES);
  } catch (error) {
    return invalidRequest(error.message === "REQUEST_TOO_LARGE" ? "Request is too large" : "Invalid request body");
  }

  const job = normalizeJob(body.job);
  if (!job) return invalidRequest("Valid job title and description are required");

  const model = getGeminiModel();
  if (!model) {
    return NextResponse.json({ error: "AI proposal generation is unavailable" }, { status: 503 });
  }

  const prompt = `Generate a structured project proposal in valid JSON only. Return this shape:
{
  "project_title": string,
  "client": string,
  "client_url": string,
  "job_title": string,
  "cover_letter": string,
  "milestones": [{"title": string, "description": string, "cost": number, "timeline_days": number}],
  "total_quote": string,
  "delivery_time": number
}

Job title: ${job.title}
Job description: ${job.description}
Budget: ${job.salaryRange}
Company: ${job.companyName}
Location: ${job.location}`;

  try {
    const text = await generateBoundedContent(model, prompt);
    const proposal = normalizeProposal(parseProviderJson(text), job);
    if (!proposal) {
      return NextResponse.json({ error: "AI proposal generation returned an invalid result" }, { status: 502 });
    }
    return NextResponse.json({ proposal });
  } catch (error) {
    const status = error.message === "OPERATION_TIMED_OUT" ? 504 : 502;
    return NextResponse.json({ error: "AI proposal generation is temporarily unavailable" }, { status });
  }
}
