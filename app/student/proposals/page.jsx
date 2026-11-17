"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function StudentProposals() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProposals() {
      // ✅ get logged-in student
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setLoading(false);
        return;
      }

      // ✅ fetch proposals for this student
      const { data, error } = await supabase
        .from("proposals")
        .select("id, job_id, cover_letter, total_quote, delivery_time, created_at, jobs(title, company_name)")
        .eq("submitted_by", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching proposals:", error.message);
      } else {
        setProposals(data);
      }
      setLoading(false);
    }

    fetchProposals();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-gray-600 mb-4">You haven’t submitted any proposals yet.</p>
          <Link href="/student/browse" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Browse Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Proposals</h1>

        <div className="space-y-4">
          {proposals.map((proposal) => (
            <div key={proposal.id} className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-1">
                {proposal.jobs?.title || "Untitled Job"}
              </h2>
              <p className="text-sm text-gray-500 mb-2">
                {proposal.jobs?.company_name}
              </p>
              <p className="text-gray-700 mb-3 line-clamp-3">{proposal.cover_letter}</p>
              <div className="text-sm text-gray-600">
                💰 Quote: {proposal.total_quote || "N/A"} | ⏳ Delivery: {proposal.delivery_time} days
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Submitted on {new Date(proposal.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
