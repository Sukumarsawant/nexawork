import { NextResponse } from "next/server";
import { authenticateApiRequest, readBoundedJson, safeString } from "@/lib/server/api";

const PRACTICE_QUIZZES = new Set(["figma", "nextjs"]);

export async function POST(request) {
  const auth = await authenticateApiRequest(request);
  if (auth.error) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  let body;
  try {
    body = await readBoundedJson(request, 1024);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message === "REQUEST_TOO_LARGE" ? "Request is too large" : "Invalid request body" },
      { status: 400 },
    );
  }

  const quizId = safeString(body?.quizId, 40);
  if (!PRACTICE_QUIZZES.has(quizId)) {
    return NextResponse.json({ success: false, error: "Unknown practice quiz" }, { status: 400 });
  }

  const { data, error } = await auth.supabase.rpc("award_practice_badge", { quiz_id: quizId });
  if (error) {
    return NextResponse.json({ success: false, error: "Practice badge is unavailable" }, { status: 503 });
  }

  const badges = Array.isArray(data?.badges) ? data.badges : Array.isArray(data) ? data : [];
  return NextResponse.json({ success: true, badges });
}
