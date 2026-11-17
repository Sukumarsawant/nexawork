import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { generateBoundedContent, getGeminiModel, parseProviderJson } from "@/lib/server/ai";
import {
  aiRequestLimiter,
  authenticateApiRequest,
  readBoundedBody,
  safeString,
} from "@/lib/server/api";

const execFileAsync = promisify(execFile);
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_MULTIPART_BYTES = MAX_FILE_BYTES + 64 * 1024;
const MAX_JOB_DESCRIPTION_CHARS = 6_000;
const MAX_RESUME_TEXT_CHARS = 24_000;
const PYTHON_TIMEOUT_MS = 10_000;
const ALLOWED_FILES = {
  ".txt": ["text/plain"],
  ".pdf": ["application/pdf"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};

const SKILLS = [
  "python", "java", "javascript", "typescript", "react", "next.js", "next", "node", "express",
  "django", "flask", "sql", "postgresql", "mysql", "mongodb", "docker", "kubernetes",
  "aws", "gcp", "azure", "git", "html", "css", "rest", "graphql", "c++", "c#", "go",
];

const ROLE_SKILLS = {
  sde: ["data structures", "algorithms", "java", "python", "c++", "git"],
  "software engineer": ["data structures", "algorithms", "java", "python", "git"],
  backend: ["node", "express", "java", "python", "sql", "docker"],
  frontend: ["javascript", "react", "html", "css", "typescript"],
  fullstack: ["javascript", "react", "node", "sql", "docker"],
  devops: ["docker", "kubernetes", "aws", "gcp", "ci/cd"],
  data: ["python", "sql", "pandas", "numpy", "machine learning"],
};

function safeSkills(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .filter((skill) => typeof skill === "string")
    .map((skill) => skill.trim().toLowerCase().slice(0, 80))
    .filter(Boolean))].slice(0, 40);
}

function createAnalysis(skills, jobDescription) {
  const description = jobDescription.toLowerCase();
  const required = SKILLS.filter((skill) => description.includes(skill));
  for (const [role, roleSkills] of Object.entries(ROLE_SKILLS)) {
    if (description.includes(role)) {
      for (const skill of roleSkills) {
        if (!required.includes(skill)) required.push(skill);
      }
    }
  }

  const detected = safeSkills(skills);
  const foundSkills = required.filter((skill) => detected.includes(skill));
  const missingSkills = required.filter((skill) => !detected.includes(skill));
  const score = required.length
    ? Math.round((foundSkills.length / required.length) * 100)
    : Math.min(100, detected.length * 25);

  return {
    score,
    found_skills: foundSkills,
    missing_skills: missingSkills,
    strengths: detected.slice(0, 5),
    improvement_suggestions: missingSkills.length
      ? missingSkills.slice(0, 10).map((skill) => `Consider adding or highlighting ${skill} on your resume`)
      : ["Consider adding quantifiable achievements to strengthen your resume."],
  };
}

function parseFile(formData) {
  const file = formData.get("resume");
  const jobDescription = safeString(formData.get("jobDescription"), MAX_JOB_DESCRIPTION_CHARS);
  if (!file || typeof file.arrayBuffer !== "function" || !jobDescription) {
    return { error: "Missing resume or job description" };
  }
  if (file.size > MAX_FILE_BYTES) return { error: "File size must be 5 MiB or less" };

  const extension = path.extname(file.name || "").toLowerCase();
  const allowedTypes = ALLOWED_FILES[extension];
  if (!allowedTypes || (file.type && !allowedTypes.includes(file.type))) {
    return { error: "Only TXT, PDF, and DOCX files are supported" };
  }

  return { file, jobDescription, extension };
}

async function parseMultipart(request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
    throw new Error("INVALID_MULTIPART");
  }

  const body = await readBoundedBody(request, MAX_MULTIPART_BYTES);
  const formRequest = new Request(request.url, {
    method: "POST",
    headers: { "content-type": request.headers.get("content-type") },
    body,
  });
  return formRequest.formData();
}

async function analyzeWithPython(filePath) {
  const script = path.join(process.cwd(), "scripts", "analyze_resume.py");
  const executables = [process.env.PYTHON_PATH, "python3", "python"].filter(Boolean);

  for (const executable of executables) {
    try {
      const { stdout } = await execFileAsync(executable, [script, filePath], {
        timeout: PYTHON_TIMEOUT_MS,
        maxBuffer: 32 * 1024,
        windowsHide: true,
      });
      if (typeof stdout !== "string" || stdout.length > 32 * 1024) continue;
      const result = JSON.parse(stdout);
      if (result?.error) continue;
      return safeSkills(result?.skills);
    } catch {
      // Try a compatible Python executable without logging resume-derived output.
    }
  }
  return null;
}

async function analyzeWithGemini(resumeBuffer, jobDescription) {
  const model = getGeminiModel();
  if (!model) return null;

  const resumeText = resumeBuffer.toString("utf8").slice(0, MAX_RESUME_TEXT_CHARS);
  const prompt = `Return valid JSON only in this exact shape: {"skills":[string]}.
Extract up to 40 professional technical skills from this TXT resume. Do not return names, contact details, addresses, education history, or any other personal information.
Resume:\n${resumeText}\n\nJob description:\n${jobDescription}`;
  const text = await generateBoundedContent(model, prompt);
  return safeSkills(parseProviderJson(text)?.skills);
}

export async function POST(request) {
  const auth = await authenticateApiRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const throttle = aiRequestLimiter.check(auth.user.id);
  if (!throttle.allowed) {
    return NextResponse.json(
      { error: "Please wait before analyzing another resume" },
      { status: 429, headers: { "Retry-After": String(throttle.retryAfterSeconds) } },
    );
  }

  let parsed;
  try {
    parsed = parseFile(await parseMultipart(request));
  } catch (error) {
    const message = error.message === "REQUEST_TOO_LARGE" ? "Upload is too large" : "Invalid upload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

  let temporaryDirectory;
  try {
    const tempRoot = path.resolve(process.env.RESUME_TEMP_ROOT || "/var/tmp");
    await fs.mkdir(tempRoot, { recursive: true, mode: 0o700 });
    temporaryDirectory = await fs.mkdtemp(path.join(tempRoot, "nexawork-resume-"));
    await fs.chmod(temporaryDirectory, 0o700);

    const fileBuffer = Buffer.from(await parsed.file.arrayBuffer());
    if (fileBuffer.length > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "File size must be 5 MiB or less" }, { status: 400 });
    }

    const temporaryFile = path.join(temporaryDirectory, `resume${parsed.extension}`);
    await fs.writeFile(temporaryFile, fileBuffer, { mode: 0o600 });
    const skills = await analyzeWithPython(temporaryFile);
    if (skills) return NextResponse.json(createAnalysis(skills, parsed.jobDescription));

    if (parsed.extension !== ".txt") {
      return NextResponse.json({ error: "Resume analysis is temporarily unavailable" }, { status: 503 });
    }

    try {
      const fallbackSkills = await analyzeWithGemini(fileBuffer, parsed.jobDescription);
      if (fallbackSkills) return NextResponse.json(createAnalysis(fallbackSkills, parsed.jobDescription));
    } catch {
      // Do not expose or log provider output or resume-derived failures.
    }
    return NextResponse.json({ error: "Resume analysis is temporarily unavailable" }, { status: 503 });
  } catch {
    return NextResponse.json({ error: "Failed to process resume" }, { status: 500 });
  } finally {
    if (temporaryDirectory) await fs.rm(temporaryDirectory, { recursive: true, force: true }).catch(() => {});
  }
}
