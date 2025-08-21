"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, company_name, location, description")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching jobs:", error.message);
      } else {
        setJobs(data);
      }
      setLoading(false);
    }

    fetchJobs();
  }, []);

  if (loading) return <p className="p-6">Loading jobs...</p>;
  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      {jobs.map((job) => (
        <Link key={job.id} href={`/jobs/${job.id}`}>
          <div className="p-6 rounded-2xl bg-purple-700 text-white shadow-lg hover:bg-purple-800 transition cursor-pointer">
            <h2 className="text-xl font-bold">{job.title}</h2>
            <p className="text-sm opacity-80">
              {job.company_name} — {job.location}
            </p>
            <p className="mt-3 text-white/90 line-clamp-2">{job.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
  
}
