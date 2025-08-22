import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  try {
    const { job } = await req.json();

    if (!job) {
      return new Response(JSON.stringify({ error: "Job data missing" }), { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // Safe (server only)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Generate a structured project proposal in valid JSON ONLY. Do not include explanations or markdown.
    
    Fields required:
    {
      "project_title": string,
      "client": string,
      "client_url": string,
      "job_title": string,
      "cover_letter": string,
      "milestones": [
        {
          "title": string,
          "description": string,
          "cost": number,
          "timeline_days": number
        }
      ],
      "total_quote": string,
      "delivery_time": number
    }
    
    Job Details:
    - Title: ${job.title}
    - Description: ${job.description}
    - Budget: ${job.salary_range || "not specified"}
    - Company: ${job.company_name || "Client"}
    - Location: ${job.location || "not specified"}
    `;
    

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let proposalJson = null;
    try {
      proposalJson = JSON.parse(text);
    } catch {
      proposalJson = {
        cover_letter: text,
        milestones: [],
        total_quote: 0,
        delivery_time: 0,
      };
    }

    return new Response(JSON.stringify({ proposal: proposalJson }), { status: 200 });
  } catch (err) {
    console.error("Proposal generation failed:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
