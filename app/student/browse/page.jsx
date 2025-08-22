"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { 
  Search, 
  Filter, 
  MapPin, 
  Building, 
  Clock, 
  DollarSign, 
  Briefcase,
  Star,
  Eye,
  Send,
  X,
  SlidersHorizontal
} from "lucide-react";

export default function BrowseJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedEmploymentType, setSelectedEmploymentType] = useState("");
  const [selectedSeniority, setSelectedSeniority] = useState("");
  const [selectedJobFunction, setSelectedJobFunction] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [salaryRange, setSalaryRange] = useState("");

  // Filter options
  const locations = ["Remote", "New York", "San Francisco", "London", "Toronto", "Berlin", "Singapore"];
  const employmentTypes = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"];
  const seniorityLevels = ["Entry", "Junior", "Mid-level", "Senior", "Lead", "Executive"];
  const jobFunctions = ["Engineering", "Design", "Marketing", "Sales", "Product", "Operations", "Finance", "HR", "Other"];
  const salaryRanges = ["$0-$50k", "$50k-$100k", "$100k-$150k", "$150k+"];

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching jobs:", error.message);
      } else {
        setJobs(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = 
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_function?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation = !selectedLocation || 
      job.location?.toLowerCase().includes(selectedLocation.toLowerCase());

    const matchesEmploymentType = !selectedEmploymentType || 
      job.employment_type === selectedEmploymentType;

    const matchesSeniority = !selectedSeniority || 
      job.seniority_level === selectedSeniority;

    const matchesJobFunction = !selectedJobFunction || 
      job.job_function === selectedJobFunction;

    const matchesSalary = !salaryRange || 
      (job.salary && job.salary.includes(salaryRange.split('-')[0]));

    return matchesSearch && matchesLocation && matchesEmploymentType && 
           matchesSeniority && matchesJobFunction && matchesSalary;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedLocation("");
    setSelectedEmploymentType("");
    setSelectedSeniority("");
    setSelectedJobFunction("");
    setSalaryRange("");
  };

  const formatSalary = (salary) => {
    if (!salary) return "Salary not specified";
    return salary;
  };

  const getEmploymentTypeColor = (type) => {
    switch (type) {
      case "Full-time": return "bg-green-100 text-green-800";
      case "Part-time": return "bg-blue-100 text-blue-800";
      case "Contract": return "bg-orange-100 text-orange-800";
      case "Internship": return "bg-purple-100 text-purple-800";
      case "Freelance": return "bg-pink-100 text-pink-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSeniorityColor = (level) => {
    switch (level) {
      case "Entry": return "bg-green-100 text-green-800";
      case "Junior": return "bg-blue-100 text-blue-800";
      case "Mid-level": return "bg-yellow-100 text-yellow-800";
      case "Senior": return "bg-orange-100 text-orange-800";
      case "Lead": return "bg-red-100 text-red-800";
      case "Executive": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading amazing opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  ">
      {/* Header */}
      <div className="text-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold lexa mb-2">
              Discover Your Next Opportunity
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Browse through thousands of job opportunities and find the perfect match for your skills and career goals
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div className=" rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300/70" size={17} />
              <input
                type="text"
                placeholder="Search jobs, companies, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#3E3E55]/70 text-gray-300 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-3 bg-[#5E4A77]/20 border border-[#5E4A77] text-white rounded-xl hover:bg-purple-950 transition-colors"
            >
              <SlidersHorizontal size={20} />
              Filters
              {Object.values({ searchTerm, selectedLocation, selectedEmploymentType, selectedSeniority, selectedJobFunction, salaryRange }).some(Boolean) && (
                <span className="bg-white text-purple-600 rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
                  {Object.values({ searchTerm, selectedLocation, selectedEmploymentType, selectedSeniority, selectedJobFunction, salaryRange }).filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">All Locations</option>
                    {locations.map((location) => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>

                {/* Employment Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                  <select
                    value={selectedEmploymentType}
                    onChange={(e) => setSelectedEmploymentType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    {employmentTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Seniority Level Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Seniority</label>
                  <select
                    value={selectedSeniority}
                    onChange={(e) => setSelectedSeniority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">All Levels</option>
                    {seniorityLevels.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                {/* Job Function Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Function</label>
                  <select
                    value={selectedJobFunction}
                    onChange={(e) => setSelectedJobFunction(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">All Functions</option>
                    {jobFunctions.map((func) => (
                      <option key={func} value={func}>{func}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Salary Range Filter */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
                <select
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  className="w-full md:w-64 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">All Ranges</option>
                  {salaryRanges.map((range) => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X size={16} />
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredJobs.length}</span> of <span className="font-semibold text-gray-900">{jobs.length}</span> opportunities
          </p>
          {Object.values({ searchTerm, selectedLocation, selectedEmploymentType, selectedSeniority, selectedJobFunction, salaryRange }).some(Boolean) && (
            <button
              onClick={clearFilters}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Jobs Grid */}
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="text-gray-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
  {filteredJobs.map((job) => (
    <div
      key={job.id}
      className="bg-[#3E3E55]/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
    >
      {/* Job Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xl text-white font-bold  group-hover:text-purple-600 transition-colors line-clamp-1">
              {job.title}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <Building className="text-gray-400" size={16} />
              <span className="text-gray-600 font-medium">
                {job.company_name}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Star className="text-yellow-400" size={16} />
            <span className="text-sm text-gray-500">4.5</span>
          </div>
        </div>

        {/* Location and Type */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <MapPin className="text-gray-400" size={16} />
            <span className="text-gray-600">{job.location || "Remote"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="text-gray-400" size={16} />
            <span className="text-gray-600">
              {job.employment_type || "Full-time"}
            </span>
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="p-6">
        {/* ✅ Keep description only here */}
        <p className="text-gray-600 line-clamp-2 mb-4">
          {job.description || "No description available"}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {job.employment_type && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${getEmploymentTypeColor(
                job.employment_type
              )}`}
            >
              {job.employment_type}
            </span>
          )}
          {job.seniority_level && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${getSeniorityColor(
                job.seniority_level
              )}`}
            >
              {job.seniority_level}
            </span>
          )}
          {/* {job.job_function && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {job.job_function}
            </span>
          )} */}
        </div>

        {/* Salary */}
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="text-green-500" size={16} />
          <span className="text-green-600 font-semibold">
            {formatSalary(job.salary)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link
            href={`/jobs/${job.id}`}
            className="flex-1 flex bg-[#5E4A77]/50 items-center justify-center gap-2 px-4 py-2 text-white rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Eye size={16} />
            View Details
          </Link>
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-[#5E4A77] text-white rounded-lg hover:bg-purple-700 transition-colors">
            <Send size={16} />
            Apply Now
          </button>
        </div>
      </div>
    </div>
  ))}
</div>

        )}
      </div>
    </div>
  );
}
