"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function NewJobPage() {
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
      const { error } = await supabase.from("jobs").insert([formData]);

      if (error) {
        setMessage("❌ Error: " + error.message);
      } else {
        setMessage("✅ Job added successfully!");
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
      setMessage("❌ Unexpected error occurred");
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Create New Job Posting</h1>
          <p className="text-gray-600">Fill in the details below to create a new job opportunity</p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Job Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Senior Frontend Developer"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., New York, NY"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Salary
                </label>
                <input
                  type="text"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="e.g., $80,000 - $120,000"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Job Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Employment Type
                </label>
                <select
                  name="employment_type"
                  value={formData.employment_type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select type</option>
                  {employmentTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Seniority Level
                </label>
                <select
                  name="seniority_level"
                  value={formData.seniority_level}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select level</option>
                  {seniorityLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Function
                </label>
                <select
                  name="job_function"
                  value={formData.job_function}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="e.g., TechCorp Inc."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company URL
                </label>
                <input
                  type="url"
                  name="company_url"
                  value={formData.company_url}
                  onChange={handleChange}
                  placeholder="https://company.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Job Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                placeholder="Describe the role, responsibilities, and requirements..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-vertical"
              />
            </div>

            {/* Benefits */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Benefits & Perks
              </label>
              <textarea
                name="sbenefits"
                value={formData.sbenefits}
                onChange={handleChange}
                rows={3}
                placeholder="List the benefits and perks offered..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-vertical"
              />
            </div>

            {/* URLs and Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job URL
                </label>
                <input
                  type="url"
                  name="job_url"
                  value={formData.job_url}
                  onChange={handleChange}
                  placeholder="https://job-posting-url.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Apply URL
                </label>
                <input
                  type="url"
                  name="apply_url"
                  value={formData.apply_url}
                  onChange={handleChange}
                  placeholder="https://apply-url.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Additional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Industry/Sector
                </label>
                <input
                  type="text"
                  name="industries_sector"
                  value={formData.industries_sector}
                  onChange={handleChange}
                  placeholder="e.g., Technology, Healthcare"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Posted By
                </label>
                <input
                  type="text"
                  name="posted_by"
                  value={formData.posted_by}
                  onChange={handleChange}
                  placeholder="Recruiter name"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Hidden/System Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Posted Time
                </label>
                <input
                  type="datetime-local"
                  name="posted_time"
                  value={formData.posted_time}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Published At
                </label>
                <input
                  type="datetime-local"
                  name="published_at"
                  value={formData.published_at}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Applications Count
                </label>
                <input
                  type="number"
                  name="applications_count"
                  value={formData.applications_count}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
            <div className={`mt-6 p-4 rounded-lg text-center font-medium ${
              message.includes("✅") 
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
