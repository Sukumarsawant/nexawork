import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";
import { execFile } from "child_process";

const execFileP = promisify(execFile);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume");
    const jobDescription = formData.get("jobDescription");

    if (!file || !jobDescription) {
      return NextResponse.json(
        { error: "Missing resume or job description" },
        { status: 400 }
      );
    }

    // Try to save the uploaded file to a temporary path and run the Python analyzer if available.
    // Fallback to the existing Gemini-based text-only flow if Python fails.
    const tmpDir = path.join(process.cwd(), "tmp");
    await fs.mkdir(tmpDir, { recursive: true });

    const originalName = file.name || `resume-${Date.now()}`;
    const ext = path.extname(originalName) || ".txt";
    const tmpPath = path.join(tmpDir, `${Date.now()}${ext}`);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(tmpPath, buffer);

      // Attempt to run the Python analyzer script included in the repo.
      const pyScript = path.join(process.cwd(), "scripts", "analyze_resume.py");
      try {
        // Try a small chain of possible python executables to account for Windows 'py' launcher
        const executables = [process.env.PYTHON_PATH, "python", "py"].filter(Boolean);
        let stdout = null;
        let lastErr = null;
        for (const exe of executables) {
          try {
            const res = await execFileP(exe, [pyScript, tmpPath], { maxBuffer: 10 * 1024 * 1024 });
            if (res.stderr) console.error("Python analyzer stderr:", res.stderr.toString());
            stdout = res.stdout;
            break;
          } catch (err) {
            lastErr = err;
            // try next executable
          }
        }

        if (!stdout) {
          console.warn("Python analyzer not available (tried executables). Falling back to Gemini.", lastErr && lastErr.message);
        } else {
          // Python script prints JSON to stdout
          let analysis = JSON.parse(stdout);

          // If the Python analyzer didn't return the expected score/found_skills/missing_skills
          // synthesize them from the job description and detected skills so the frontend gets a 0-100 score.
          if (typeof analysis.score === "undefined") {
            const SKILLS = [
              "python", "java", "javascript", "typescript", "react", "next.js", "next", "node", "express",
              "django", "flask", "sql", "postgresql", "mysql", "mongodb", "docker", "kubernetes",
              "aws", "gcp", "azure", "git", "html", "css", "rest", "graphql", "c++", "c#", "go",
            ];

            const jd = (jobDescription || "").toLowerCase();

            // Role -> skills mapping to cover short job-title inputs like "SDE" or "Frontend"
            const ROLE_MAP = {
              sde: ["data structures", "algorithms", "java", "python", "c++", "git"],
              "software engineer": ["data structures", "algorithms", "java", "python", "git"],
              backend: ["node", "express", "java", "python", "sql", "docker"],
              frontend: ["javascript", "react", "html", "css", "typescript"],
              fullstack: ["javascript", "react", "node", "sql", "docker"],
              devops: ["docker", "kubernetes", "aws", "gcp", "ci/cd"],
              data: ["python", "sql", "pandas", "numpy", "machine learning"],
            };

            // Start with skills explicitly mentioned in the JD
            let required = SKILLS.filter((s) => jd.includes(s));

            // If the JD looks like a short title (few words) or contains a known role keyword,
            // expand required skills using ROLE_MAP
            const jdWords = jd.split(/\s+/).filter(Boolean);
            for (const [role, skills] of Object.entries(ROLE_MAP)) {
              if (jd.includes(role) || (jdWords.length <= 3 && jdWords.some(w => w === role))) {
                for (const sk of skills) {
                  if (!required.includes(sk)) required.push(sk);
                }
              }
            }

            const detected = (analysis.skills || []).map((s) => String(s).toLowerCase());
            const found = required.filter((r) => detected.includes(r));
            const missing = required.filter((r) => !detected.includes(r));

            // Compute a sensible score. If no explicit required skills were found, derive a fallback
            // score from detected skills so short JDs like "SDE" don't give 0/100.
            let score;
            if (required.length > 0) {
              score = Math.round((found.length / required.length) * 100);
            } else if ((detected || []).length > 0) {
              // Give a baseline per detected skill, cap at 90 to leave room for stronger matches.
              score = Math.min(90, detected.length * 25);
              // If detected list is long, allow full 100
              if (detected.length >= 4) score = 100;
            } else {
              score = 0;
            }

            analysis.score = score;
            analysis.found_skills = found;
            analysis.missing_skills = missing;
            analysis.strengths = (analysis.skills || []).slice(0, 5);
            analysis.improvement_suggestions = missing.length > 0 ? missing.map(s => `Consider adding or highlighting ${s} on your resume`) : ["Consider adding quantifiable achievements to improve your match."];
          }

          // cleanup
          await fs.unlink(tmpPath).catch(() => {});
          return NextResponse.json(analysis);
        }
      } catch (pyErr) {
        console.warn("Python analyzer failed, falling back to Gemini. Error:", pyErr && pyErr.message);
        // continue to fallback
      }
    } catch (fileErr) {
      console.error("Failed to save uploaded file:", fileErr);
      // continue to fallback to text-only flow
    }

    // Fallback: read resume as text (works for .txt uploads only)
    const resumeText = await file.text();

    // Force Gemini to ONLY return JSON
    const prompt = `
You are a JSON-only API. Do not include any text outside JSON.

Compare the following resume and job description.
Return ONLY valid JSON in this format:

{
  "score": number,
  "found_skills": [string],
  "missing_skills": [string],
  "strengths": [string],
  "improvement_suggestions": [string]
}

Resume: """${resumeText}"""
Job Description: """${jobDescription}"""
`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    console.log("Gemini raw output:", raw);

    // Extract JSON safely (ignores extra text)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "AI response could not be parsed", raw },
        { status: 500 }
      );
    }

    let analysis;
    try {
      analysis = JSON.parse(jsonMatch[0]);
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid JSON from AI", raw },
        { status: 500 }
      );
    }

    return NextResponse.json(analysis);
  } catch (err) {
    console.error("Resume upload error:", err);
    return NextResponse.json(
      { error: "Failed to process resume" },
      { status: 500 }
    );
  }
}
