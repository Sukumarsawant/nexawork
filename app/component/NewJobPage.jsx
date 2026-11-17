"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth, withTimeout } from "@/component/AuthProvider";
import { newJobPayload } from "@/lib/jobs";

export default function NewJobPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    posted_time: "",
    published_at: "",
    job_url: "",
    company_name: "",
    company_url: "",
    description: "",
    applications_count: "",
    employment_type: "",
    seniority_level: "",
    job_function: "",
    industries_sector: "",
    salary: "",
    posted_by: "",
    poster_profile_url: "",
    company_id: "",
    apply_url: "",
    apply_type: "",
    sbenefits: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const employmentTypes = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"];
  const seniorityLevels = ["Entry", "Junior", "Mid-level", "Senior", "Lead", "Executive"];
  const jobFunctions = ["Engineering", "Design", "Marketing", "Sales", "Product", "Operations", "Finance", "HR", "Other"];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = newJobPayload(formData, user?.id);
      const { error } = await withTimeout(supabase.from("jobs").insert([payload]));

      if (error) {
        setMessage("We could not save this job. Your draft remains here. Please retry.");
      } else {
        setMessage("Job added successfully.");
        setFormData({
          title: "",
          location: "",
          posted_time: "",
          published_at: "",
          job_url: "",
          company_name: "",
          company_url: "",
          description: "",
          applications_count: "",
          employment_type: "",
          seniority_level: "",
          job_function: "",
          industries_sector: "",
          salary: "",
          posted_by: "",
          poster_profile_url: "",
          company_id: "",
          apply_url: "",
          apply_type: "",
          sbenefits: "",
        });
      }
    } catch (error) {
      setMessage(error.message || "We could not save this job. Please retry.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--nx-bg)] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[var(--nx-white)] mb-2">Create New Job Posting</h1>
          <p className="text-[var(--nx-muted)]">Fill in the details below to create a new job opportunity</p>
        </div>

        {/* Form Container */}
        <div className="bg-[var(--nx-card)] border border-[var(--nx-line)] rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Job Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="job-title" className="block text-sm font-semibold text-[var(--nx-text)] mb-2">Job Title *</label>
                <input id="job-title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Senior Frontend Developer"
                  className="nx-field"
                />
              </div>

              <div>
                <label htmlFor="job-location" className="block text-sm font-semibold text-[var(--nx-text)] mb-2">Location</label>
                <input id="job-location"
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., New York, NY"
                  className="nx-field"
                />
              </div>

              <div>
                <label htmlFor="job-salary" className="block text-sm font-semibold text-[var(--nx-text)] mb-2">Salary</label>
                <input id="job-salary"
                  type="number"
                  min="0"
                  step="0.01"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="Optional recorded amount"
                  className="nx-field"
                />
              </div>
            </div>

            {/* Job Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="job-employment_type" className="block text-sm font-semibold text-[var(--nx-text)] mb-2">Employment Type</label>
                <select id="job-employment_type"
                  name="employment_type"
                  value={formData.employment_type}
                  onChange={handleChange}
                  className="nx-field"
                >
                  <option value="">Select type</option>
                  {employmentTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="job-seniority_level" className="block text-sm font-semibold text-[var(--nx-text)] mb-2">Seniority Level</label>
                <select id="job-seniority_level"
                  name="seniority_level"
                  value={formData.seniority_level}
                  onChange={handleChange}
                  className="nx-field"
                >
                  <option value="">Select level</option>
                  {seniorityLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="job-job_function" className="block text-sm font-semibold text-[var(--nx-text)] mb-2">Job Function</label>
                <select id="job-job_function"
                  name="job_function"
                  value={formData.job_function}
                  onChange={handleChange}
                  className="nx-field"
                >
                  <option value="">Select function</option>
                  {jobFunctions.map((func) => (
                    <option key={func} value={func}>{func}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Company Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="job-company_name" className="block text-sm font-semibold text-[var(--nx-text)] mb-2">Company Name</label>
                <input id="job-company_name"
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="e.g., TechCorp Inc."
                  className="nx-field"
                />
              </div>

              <div>
                <label htmlFor="job-company_url" className="block text-sm font-semibold text-[var(--nx-text)] mb-2">Company URL</label>
                <input id="job-company_url"
                  type="url"
                  name="company_url"
                  value={formData.company_url}
                  onChange={handleChange}
                  placeholder="https://company.com"
                  className="nx-field"
                />
              </div>
            </div>

            {/* Job Description */}
            <div>
              <label htmlFor="job-description" className="block text-sm font-semibold text-[var(--nx-text)] mb-2">Job Description</label>
                <textarea id="job-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                placeholder="Describe the role, responsibilities, and requirements..."
                className="nx-field resize-vertical"
              />
            </div>

            {/* Benefits */}
            <div>
              <label htmlFor="job-sbenefits" className="block text-sm font-semibold text-[var(--nx-text)] mb-2">Benefits & Perks</label>
                <textarea id="job-sbenefits"
                name="sbenefits"
                value={formData.sbenefits}
                onChange={handleChange}
                rows={3}
                placeholder="List the benefits and perks offered..."
                className="nx-field resize-vertical"
              />
            </div>

            {/* URLs and Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="job-job_url" className="block text-sm font-semibold text-[var(--nx-text)] mb-2">Job URL</label>
                <input id="job-job_url"
                  type="url"
                  name="job_url"
                  value={formData.job_url}
                  onChange={handleChange}
                  placeholder="https://job-posting-url.com"
                  className="nx-field"
                />
              </div>

              <div>
                <label htmlFor="job-apply_url" className="block text-sm font-semibold text-[var(--nx-text)] mb-2">Apply URL</label>
                <input id="job-apply_url"
                  type="url"
                  name="apply_url"
                  value={formData.apply_url}
                  onChange={handleChange}
                  placeholder="https://apply-url.com"
                  className="nx-field"
                />
              </div>
            </div>

            {/* Additional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="job-industries_sector" className="block text-sm font-semibold text-[var(--nx-text)] mb-2">Industry/Sector</label>
                <input id="job-industries_sector"
                  type="text"
                  name="industries_sector"
                  value={formData.industries_sector}
                  onChange={handleChange}
                  placeholder="e.g., Technology, Healthcare"
                  className="nx-field"
                />
              </div>

            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <button
                type="submit"
                disabled={loading}
                className="nx-button-primary"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Job...
                  </>
                ) : (
                  "Create Job Posting"
                )}
              </button>
            </div>
          </form>

          {/* Message Display */}
          {message && (
            <div role={message === "Job added successfully." ? "status" : "alert"} className={`mt-6 p-4 rounded-lg text-center font-medium ${
              message === "Job added successfully."
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
