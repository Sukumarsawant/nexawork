import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const { quizId, userId } = await req.json();

    // ✅ Add badge if not already present
    const { data, error } = await supabase
      .from("profiles")
      .update({ badges: supabase.sql`array_append(badges, ${quizId})` })
      .eq("id", userId)
      .not("badges", "cs", `{${quizId}}`) // prevents duplicates
      .select("badges")
      .single();

    if (error) {
      console.error("Error updating badges:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, badges: data.badges });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
