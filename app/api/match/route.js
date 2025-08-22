// app/api/match/route.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { jobId } = await req.json();

    // 1. Fetch job details
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return Response.json({ error: "Job not found" }, { status: 404 });
    }

    // 2. Fetch profiles (students)
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, skills, availability");

    if (profileError) throw profileError;

    // 3. Score students
    const matches = profiles.map((p) => {
      const skillMatch = p.skills?.filter((s) =>
        job.required_skills.includes(s)
      ).length || 0;

      const availabilityMatch = p.availability === job.availability ? 1 : 0;

      const score = skillMatch * 2 + availabilityMatch;

      return { ...p, score };
    });

    // 4. Sort by score (best match first)
    matches.sort((a, b) => b.score - a.score);

    return Response.json({ job, matches });
  } catch (err) {
    console.error("Match Engine Error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
