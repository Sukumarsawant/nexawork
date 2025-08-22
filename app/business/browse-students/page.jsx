"use client"
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Search, MessageCircle, Users, Filter, Star, MapPin, Calendar, Mail, Phone, Globe, Github, Linkedin, User, X, SlidersHorizontal, Briefcase, Award, Clock } from "lucide-react";

const CommunityPage = ({ user }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSkills, setFilterSkills] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedAvailability, setSelectedAvailability] = useState("");

  // Filter options
  const locations = ["Remote", "New York", "San Francisco", "London", "Toronto", "Berlin", "Singapore", "Mumbai", "Bangalore"];
  const availabilityOptions = ["Available", "Part-time", "Freelance", "Open to opportunities", "Not available"];

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "student")
        .neq("id", user.id) // Exclude current user
        .order("name");

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.bio?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSkills = !filterSkills || 
                         student.skills?.some(skill => 
                           skill.toLowerCase().includes(filterSkills.toLowerCase())
                         );

    const matchesLocation = !selectedLocation || 
      student.location?.toLowerCase().includes(selectedLocation.toLowerCase());

    const matchesAvailability = !selectedAvailability || 
      student.availability?.toLowerCase().includes(selectedAvailability.toLowerCase());

    return matchesSearch && matchesSkills && matchesLocation && matchesAvailability;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setFilterSkills("");
    setSelectedLocation("");
    setSelectedAvailability("");
  };

  const getIconByLabel = (label) => {
    switch (label.toLowerCase()) {
      case "github":
        return <Github size={16} />;
      case "linkedin":
        return <Linkedin size={16} />;
      case "website":
        return <Globe size={16} />;
      default:
        return null;
    }
  };

  const getSocialLinks = (portfolioLinks) => {
    if (!portfolioLinks) return [];
    const links = portfolioLinks;
    const pairs = [];
    Object.entries(links).forEach(([key, value]) => {
      if (typeof value === "string" && value) pairs.push({ label: key, href: value });
      if (Array.isArray(value)) {
        value.forEach((v, idx) => {
          if (typeof v === "string" && v) pairs.push({ label: `${key} ${idx + 1}`, href: v });
        });
      }
    });
    return pairs;
  };

  const getAvailabilityColor = (availability) => {
    switch (availability?.toLowerCase()) {
      case "available": return "bg-green-100 text-green-800";
      case "part-time": return "bg-blue-100 text-blue-800";
      case "freelance": return "bg-orange-100 text-orange-800";
      case "open to opportunities": return "bg-purple-100 text-purple-800";
      case "not available": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student community...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Student Community
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect with talented students and discover new opportunities for collaboration
            </p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="flex items-center bg-purple-100 rounded-lg px-3 py-2">
                <Users size={20} className="text-purple-600 mr-2" />
                <span className="text-sm text-purple-700 font-medium">{students.length} students</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search students by name, username, or bio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
            >
              <SlidersHorizontal size={20} />
              Filters
              {Object.values({ searchTerm, filterSkills, selectedLocation, selectedAvailability }).some(Boolean) && (
                <span className="bg-white text-purple-600 rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
                  {Object.values({ searchTerm, filterSkills, selectedLocation, selectedAvailability }).filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Skills Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                  <input
                    type="text"
                    placeholder="Filter by skills..."
                    value={filterSkills}
                    onChange={(e) => setFilterSkills(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

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

                {/* Availability Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                  <select
                    value={selectedAvailability}
                    onChange={(e) => setSelectedAvailability(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">All Availability</option>
                    {availabilityOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <X size={16} />
                    Clear all filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredStudents.length}</span> of <span className="font-semibold text-gray-900">{students.length}</span> students
          </p>
          {Object.values({ searchTerm, filterSkills, selectedLocation, selectedAvailability }).some(Boolean) && (
            <button
              onClick={clearFilters}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Students Grid */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-gray-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
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
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
                onClick={() => setSelectedStudent(student)}
              >
                {/* Student Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                        {student.profile_image_url ? (
                          <img
                            src={student.profile_image_url}
                            alt={student.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold text-lg">
                            {student.name?.charAt(0)?.toUpperCase() || "U"}
                          </span>
                        )}
                      </div>
                                             <div className="flex-1 min-w-0">
                         <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-1">
                           {student.name || "Anonymous"}
                         </h3>
                         <p className="text-gray-500 text-sm line-clamp-1">@{student.username || "user"}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="text-yellow-400" size={16} />
                      <span className="text-sm text-gray-500">4.8</span>
                    </div>
                  </div>

                                     {/* Bio */}
                   {student.bio && (
                     <p className="text-gray-600 text-sm line-clamp-1 mb-4">{student.bio}</p>
                   )}

                                     {/* Location and Availability */}
                   <div className="flex items-center gap-4 text-sm">
                     {student.location && (
                       <div className="flex items-center gap-1 flex-1 min-w-0">
                         <MapPin className="text-gray-400 flex-shrink-0" size={14} />
                         <span className="text-gray-600 line-clamp-1">{student.location}</span>
                       </div>
                     )}
                     {student.availability && (
                       <div className="flex items-center gap-1 flex-1 min-w-0">
                         <Clock className="text-gray-400 flex-shrink-0" size={14} />
                         <span className="text-gray-600 line-clamp-1">{student.availability}</span>
                       </div>
                     )}
                   </div>
                </div>

                {/* Student Details */}
                <div className="p-6">
                                     {/* Skills */}
                   {student.skills && student.skills.length > 0 && (
                     <div className="mb-4">
                       <div className="flex gap-2 overflow-hidden">
                         {student.skills.slice(0, 2).map((skill, index) => (
                           <span
                             key={index}
                             className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium flex-shrink-0"
                           >
                             {skill}
                           </span>
                         ))}
                         {student.skills.length > 2 && (
                           <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full flex-shrink-0">
                             +{student.skills.length - 2} more
                           </span>
                         )}
                       </div>
                     </div>
                   )}

                                     {/* Availability Badge */}
                   {student.availability && (
                     <div className="mb-4">
                       <span className={`px-3 py-1 rounded-full text-xs font-medium line-clamp-1 ${getAvailabilityColor(student.availability)}`}>
                         {student.availability}
                       </span>
                     </div>
                   )}

                                     {/* Social Links */}
                   {student.portfolio_links && (
                     <div className="flex items-center gap-2 mb-4 overflow-hidden">
                       {getSocialLinks(student.portfolio_links).slice(0, 2).map((link, index) => (
                         <a
                           key={index}
                           href={link.href}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0"
                           onClick={(e) => e.stopPropagation()}
                         >
                           {getIconByLabel(link.label)}
                         </a>
                       ))}
                     </div>
                   )}

                                     {/* Action Buttons */}
                   <div className="flex gap-3">
                     <button
                       className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                       onClick={(e) => {
                         e.stopPropagation();
                         // Handle view profile
                       }}
                     >
                       <User size={16} />
                       <span className="line-clamp-1">View Profile</span>
                     </button>
                     <button
                       className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                       onClick={(e) => {
                         e.stopPropagation();
                         // Handle message
                       }}
                     >
                       <MessageCircle size={16} />
                     </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                    {selectedStudent.profile_image_url ? (
                      <img
                        src={selectedStudent.profile_image_url}
                        alt={selectedStudent.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-2xl">
                        {selectedStudent.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedStudent.name || "Anonymous"}</h2>
                    <p className="text-gray-500">@{selectedStudent.username || "user"}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-500" />
                </button>
              </div>

              {/* Bio */}
              {selectedStudent.bio && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
                  <p className="text-gray-600">{selectedStudent.bio}</p>
                </div>
              )}

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {selectedStudent.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="text-gray-400" size={16} />
                    <span className="text-gray-600">{selectedStudent.location}</span>
                  </div>
                )}
                {selectedStudent.availability && (
                  <div className="flex items-center gap-2">
                    <Clock className="text-gray-400" size={16} />
                    <span className="text-gray-600">{selectedStudent.availability}</span>
                  </div>
                )}
                {selectedStudent.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="text-gray-400" size={16} />
                    <span className="text-gray-600">{selectedStudent.email}</span>
                  </div>
                )}
                {selectedStudent.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="text-gray-400" size={16} />
                    <span className="text-gray-600">{selectedStudent.phone}</span>
                  </div>
                )}
              </div>

              {/* Skills */}
              {selectedStudent.skills && selectedStudent.skills.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links */}
              {selectedStudent.portfolio_links && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Portfolio & Links</h3>
                  <div className="flex gap-3">
                    {getSocialLinks(selectedStudent.portfolio_links).map((link, index) => (
                      <a
                        key={index}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        {getIconByLabel(link.label)}
                        <span className="text-sm font-medium">{link.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  <MessageCircle size={16} />
                  Send Message
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  <User size={16} />
                  View Full Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
