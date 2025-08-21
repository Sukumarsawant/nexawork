"use client";
import { useState } from "react";
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export default function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (isValidFile(droppedFile)) {
        setFile(droppedFile);
        setError("");
      }
    }
  };

  const isValidFile = (file) => {
    const validTypes = [
      "text/plain"
    ];
    
    if (!validTypes.includes(file.type)) {
      setError("Currently only text (.txt) files are supported. Please convert your resume to a text file.");
      return false;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError("File size must be less than 5MB");
      return false;
    }
    
    return true;
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && isValidFile(selectedFile)) {
      setFile(selectedFile);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a resume file");
      return;
    }
    
    if (!jobDesc.trim()) {
      setError("Please enter a job description");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jobDescription", jobDesc);

      const response = await fetch("/api/uploadResume", { 
        method: "POST", 
        body: formData 
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze resume");
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "An error occurred while analyzing your resume");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setJobDesc("");
    setResult(null);
    setError("");
  };

  return (
    <div className="bg-[#1B1B2F] rounded-xl p-6 border border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-600/20 rounded-lg">
          <FileText size={20} className="text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Resume Analyzer</h2>
          <p className="text-gray-400 text-sm">Upload your resume and get AI-powered insights</p>
        </div>
      </div>

      {!result ? (
        <div className="space-y-6">
          {/* Job Description Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Job Description *
            </label>
            <textarea
              placeholder="Paste the job description here to analyze how well your resume matches..."
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              className="w-full p-4 rounded-lg bg-[#2A2A3E] border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-vertical"
              rows={4}
            />
          </div>

          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Resume File *
            </label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                dragActive 
                  ? "border-purple-400 bg-purple-400/10" 
                  : "border-gray-600 hover:border-gray-500"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
                             <input
                 type="file"
                 onChange={handleFileSelect}
                 accept=".txt"
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               />
              
              <div className="space-y-3">
                <div className="flex justify-center">
                  <div className="p-3 bg-purple-600/20 rounded-full">
                    <Upload size={24} className="text-purple-400" />
                  </div>
                </div>
                
                <div>
                  <p className="text-white font-medium">
                    {file ? file.name : "Drop your resume here or click to browse"}
                  </p>
                                   <p className="text-gray-400 text-sm mt-1">
                   Currently supports TXT files only (max 5MB)
                 </p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleUpload}
            disabled={loading || !file || !jobDesc.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Analyzing Resume...
              </>
            ) : (
              <>
                <FileText size={20} />
                Analyze Resume
              </>
            )}
          </button>
        </div>
      ) : (
        /* Results Display */
        <div className="space-y-6">
          {/* Score Card */}
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg p-6 border border-purple-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Analysis Results</h3>
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-green-400" />
                <span className="text-green-400 text-sm">Analysis Complete</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{result.score}/100</div>
                <div className="text-gray-400 text-sm">Overall Match Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{result.match_percentage || result.score}%</div>
                <div className="text-gray-400 text-sm">Skills Match</div>
              </div>
            </div>
          </div>

          {/* Strengths */}
          {result.strengths && result.strengths.length > 0 && (
            <div>
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <CheckCircle size={16} className="text-green-400" />
                Your Strengths
              </h4>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <ul className="space-y-2">
                  {result.strengths.map((strength, index) => (
                    <li key={index} className="text-green-300 text-sm flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Missing Skills */}
          {result.missing_skills && result.missing_skills.length > 0 && (
            <div>
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <AlertCircle size={16} className="text-yellow-400" />
                Missing Skills
              </h4>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex flex-wrap gap-2">
                  {result.missing_skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Improvement Suggestions */}
          {result.improvement_suggestions && result.improvement_suggestions.length > 0 && (
            <div>
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <AlertCircle size={16} className="text-blue-400" />
                Improvement Suggestions
              </h4>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <ul className="space-y-3">
                  {result.improvement_suggestions.map((suggestion, index) => (
                    <li key={index} className="text-blue-300 text-sm flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Reset Button */}
          <button
            onClick={resetForm}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200"
          >
            Analyze Another Resume
          </button>
        </div>
      )}
    </div>
  );
}
