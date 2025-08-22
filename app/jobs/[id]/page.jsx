"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function JobDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  // Proposal states
  const [draft, setDraft] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Fetch job details
  useEffect(() => {
    if (!id) return;

    async function fetchJob() {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching job:", error.message);
        setJob(null);
      } else {
        setJob(data);
      }
      setLoading(false);
    }

    fetchJob();
  }, [id]);

  // Call backend API for AI proposal
  async function handleGenerateProposal() {
    if (!job) return;
    setGenLoading(true);

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job }),
      });

      const data = await res.json();

      if (data.proposal) {
        setDraft(data.proposal);
      } else {
        alert("Failed to generate proposal");
      }
    } catch (err) {
      console.error("Error calling API:", err);
      alert("Something went wrong while generating proposal");
    }

    setGenLoading(false);
  }

  // Save proposal to Supabase
  async function handleSubmitProposal() {
    if (!draft || !job) return;
    setSubmitLoading(true);
  
    // ✅ Get logged-in user (student) from Supabase Auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      alert("You must be logged in to submit a proposal.");
      setSubmitLoading(false);
      return;
    }
  
    const studentId = user.id; // this is a real UUID
  
    const { error } = await supabase.from("proposals").insert([{
      job_id: job.id,
      submitted_by: studentId,
      milestones: draft.milestones,
      total_quote: draft.total_quote,
      delivery_time: draft.delivery_time,
      cover_letter: draft.cover_letter,
      ai_drafted: true
    }]);
  
    if (error) {
      alert("Error submitting proposal: " + error.message);
    } else {
      alert("Proposal submitted successfully!");
      router.push("/student/proposals");
    }
    setSubmitLoading(false);
  }
  

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h1>
          <p className="text-gray-600 mb-6">
            The job you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/student/browse"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            ← Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto p-6">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/student/browse"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Jobs
          </Link>
        </div>

        {/* Job Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
          <p className="text-xl text-blue-600 font-semibold mb-3">
            {job.company_name}
          </p>
          <p className="text-gray-600 mb-4">📍 {job.location}</p>
        </div>

        {/* Job Description */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Job Description
          </h2>
          <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
        </div>

        {/* --- Proposal Section --- */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mt-6">
  <h2 className="text-2xl font-bold text-gray-900 mb-4">Send Proposal</h2>

  {!draft ? (
    <button
      onClick={handleGenerateProposal}
      disabled={genLoading}
      className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
    >
      {genLoading ? "Generating Proposal..." : "Generate Proposal with AI"}
    </button>
  ) : (
    <div className="space-y-6">
      {/* --- Editable Section --- */}
      <div>
        <label className="block font-semibold mb-2">Cover Letter</label>
        <textarea
          className="w-full border rounded p-2"
          rows="4"
          value={draft.cover_letter}
          onChange={(e) =>
            setDraft({ ...draft, cover_letter: e.target.value })
          }
        />
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">Milestones</h3>
        {draft.milestones?.map((m, i) => (
          <div key={i} className="border p-3 rounded mb-2">
            <input
              className="w-full border-b mb-2 p-1"
              value={m.title}
              onChange={(e) => {
                const updated = [...draft.milestones];
                updated[i].title = e.target.value;
                setDraft({ ...draft, milestones: updated });
              }}
            />
            <textarea
              className="w-full border p-1 rounded"
              value={m.description}
              onChange={(e) => {
                const updated = [...draft.milestones];
                updated[i].description = e.target.value;
                setDraft({ ...draft, milestones: updated });
              }}
            />
          </div>
        ))}
      </div>

      {/* --- Review Section --- */}
      <div className="bg-gray-50 rounded-xl p-6 border mt-6">
        <h3 className="text-xl font-semibold mb-4">📋 Review Proposal</h3>

        <div className="mb-4">
          <h4 className="font-semibold">Cover Letter</h4>
          <p className="text-gray-700 whitespace-pre-line">
            {draft.cover_letter}
          </p>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold">Milestones</h4>
          <ul className="list-disc pl-5 space-y-2">
            {draft.milestones?.map((m, i) => (
              <li key={i}>
                <p className="font-medium">{m.title}</p>
                <p className="text-gray-600">{m.description}</p>
                <p className="text-sm text-gray-500">
                  💰 ${m.cost} | ⏳ {m.timeline_days} days
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between border-t pt-4 mt-4">
          <span className="font-semibold text-lg">
            Total Quote: ${draft.total_quote}
          </span>
          <span className="text-gray-600">
            Delivery Time: {draft.delivery_time} days
          </span>
        </div>
      </div>

      {/* --- Final Submit --- */}
      <button
        onClick={handleSubmitProposal}
        disabled={submitLoading}
        className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors w-full"
      >
        {submitLoading ? "Submitting..." : "Submit Proposal"}
      </button>
    </div>
  )}
</div>

      </div>
    </div>
  );
}
