import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

    // ✅ Read resume text
    const resumeText = await file.text();

    // ✅ Force Gemini to ONLY return JSON
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

    // ✅ Extract JSON safely (ignores extra text)
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
