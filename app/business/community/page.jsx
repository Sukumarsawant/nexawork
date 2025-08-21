"use client"
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Search, MessageCircle, Users, Filter, Star, MapPin, Calendar, Mail, Phone, Globe, Github, Linkedin, User, X } from "lucide-react";

const CommunityPage = ({ user }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSkills, setFilterSkills] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

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

    return matchesSearch && matchesSkills;
  });

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p>Loading community...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0E12] text-white">
      {/* Header */}
      <div className="bg-[#1B1B2F] border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-white">Student Community</h1>
              <p className="text-gray-400 mt-2">Connect with fellow students and discover new opportunities</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-[#3E3E55] rounded-lg px-3 py-2">
                <Users size={20} className="text-gray-400 mr-2" />
                <span className="text-sm text-gray-300">{students.length} students</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-[#1B1B2F] rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#3E3E55] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Filter by skills..."
                value={filterSkills}
                onChange={(e) => setFilterSkills(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#3E3E55] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div className="flex items-center justify-end">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterSkills("");
                }}
                className="px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-[#1B1B2F] rounded-xl p-6 hover:bg-[#2A2A3F] transition-colors duration-200 cursor-pointer border border-gray-700"
              onClick={() => setSelectedStudent(student)}
            >
              {/* Profile Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
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
                  <div>
                    <h3 className="font-semibold text-white">{student.name || "Anonymous"}</h3>
                    <p className="text-gray-400 text-sm">@{student.username || "user"}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Star size={16} className="text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-400">4.8</span>
                </div>
              </div>

              {/* Bio */}
              {student.bio && (
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">{student.bio}</p>
              )}

              {/* Location and Availability */}
              <div className="flex items-center space-x-4 mb-4 text-sm text-gray-400">
                {student.location && (
                  <div className="flex items-center">
                    <MapPin size={14} className="mr-1" />
                    <span>{student.location}</span>
                  </div>
                )}
                {student.availability && (
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-1" />
                    <span>{student.availability}</span>
                  </div>
                )}
              </div>

              {/* Skills */}
              {student.skills && student.skills.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {student.skills.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                    {student.skills.length > 3 && (
                      <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded-full">
                        +{student.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Social Links */}
              {student.portfolio_links && (
                <div className="flex items-center space-x-2 mb-4">
                  {getSocialLinks(student.portfolio_links).slice(0, 3).map((link, index) => (
                    <a
                      key={index}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-[#3E3E55] rounded-lg hover:bg-[#4E4E65] transition-colors duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {getIconByLabel(link.label)}
                    </a>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors duration-200 text-sm font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle view profile
                  }}
                >
                  <User size={16} />
                  <span>View Profile</span>
                </button>
                <button
                  className="flex items-center justify-center px-4 py-2 bg-[#3E3E55] hover:bg-[#4E4E65] rounded-lg transition-colors duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle message
                  }}
                >
                  <MessageCircle size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredStudents.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users size={64} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No students found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1B1B2F] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
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
                    <h2 className="text-2xl font-bold text-white">{selectedStudent.name || "Anonymous"}</h2>
                    <p className="text-gray-400">@{selectedStudent.username || "user"}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              {selectedStudent.bio && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">About</h3>
                  <p className="text-gray-300">{selectedStudent.bio}</p>
                </div>
              )}

              {selectedStudent.skills && selectedStudent.skills.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedStudent.portfolio_links && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Links</h3>
                  <div className="flex flex-wrap gap-2">
                    {getSocialLinks(selectedStudent.portfolio_links).map((link, index) => (
                      <a
                        key={index}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-4 py-2 bg-[#3E3E55] rounded-lg hover:bg-[#4E4E65] transition-colors duration-200"
                      >
                        {getIconByLabel(link.label)}
                        <span className="text-gray-300">{link.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors duration-200 font-medium">
                  <MessageCircle size={18} />
                  <span>Send Message</span>
                </button>
                <button className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-[#3E3E55] hover:bg-[#4E4E65] rounded-lg transition-colors duration-200 font-medium">
                  <Mail size={18} />
                  <span>Contact</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CommunityPageWrapper = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const sessionUser = supabase.auth.getUser();
    sessionUser.then(({ data: { user } }) => setUser(user));
  }, []);

  if (!user) return (
    <div className="min-h-screen bg-[#0E0E12] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
        <p>Loading user...</p>
      </div>
    </div>
  );

  return <CommunityPage user={user} />;
};

export default CommunityPageWrapper;
