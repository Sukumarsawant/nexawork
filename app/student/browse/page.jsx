"use client"
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Search, Filter, MapPin, Calendar, DollarSign, Clock, Star, Eye, Bookmark, BookmarkCheck } from "lucide-react";

const BrowsePage = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBudget, setFilterBudget] = useState("");
  const [bookmarkedProjects, setBookmarkedProjects] = useState([]);

  useEffect(() => {
    loadProjects();
    loadBookmarks();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          profiles:user_id (
            name,
            username,
            profile_image_url
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarks = async () => {
    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("project_id")
        .eq("user_id", user.id);

      if (error) throw error;
      setBookmarkedProjects(data?.map(b => b.project_id) || []);
    } catch (error) {
      console.error("Error loading bookmarks:", error);
    }
  };

  const toggleBookmark = async (projectId) => {
    try {
      const isBookmarked = bookmarkedProjects.includes(projectId);
      
      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("project_id", projectId);

        if (error) throw error;
        setBookmarkedProjects(prev => prev.filter(id => id !== projectId));
      } else {
        // Add bookmark
        const { error } = await supabase
          .from("bookmarks")
          .insert({
            user_id: user.id,
            project_id: projectId
          });

        if (error) throw error;
        setBookmarkedProjects(prev => [...prev, projectId]);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.skills_required?.some(skill => 
                           skill.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    
    const matchesCategory = !filterCategory || project.category === filterCategory;
    
    const matchesBudget = !filterBudget || 
                         (filterBudget === "low" && project.budget <= 5000) ||
                         (filterBudget === "medium" && project.budget > 5000 && project.budget <= 15000) ||
                         (filterBudget === "high" && project.budget > 15000);

    return matchesSearch && matchesCategory && matchesBudget;
  });

  const categories = ["Web Development", "Mobile Development", "Design", "Marketing", "Content Writing", "Data Science", "Other"];
  const budgetRanges = [
    { value: "low", label: "Under ₹5,000", max: 5000 },
    { value: "medium", label: "₹5,000 - ₹15,000", min: 5000, max: 15000 },
    { value: "high", label: "Above ₹15,000", min: 15000 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p>Loading projects...</p>
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
              <h1 className="text-3xl font-bold text-white">Browse Projects</h1>
              <p className="text-gray-400 mt-2">Discover exciting opportunities and showcase your skills</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-[#3E3E55] rounded-lg px-3 py-2">
                <Eye size={20} className="text-gray-400 mr-2" />
                <span className="text-sm text-gray-300">{projects.length} projects</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-[#1B1B2F] rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#3E3E55] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 bg-[#3E3E55] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={filterBudget}
              onChange={(e) => setFilterBudget(e.target.value)}
              className="px-4 py-3 bg-[#3E3E55] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">All Budgets</option>
              {budgetRanges.map(range => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterCategory("");
                setFilterBudget("");
              }}
              className="px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors duration-200 text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-[#1B1B2F] rounded-xl p-6 hover:bg-[#2A2A3F] transition-colors duration-200 border border-gray-700"
            >
              {/* Project Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                    {project.profiles?.profile_image_url ? (
                      <img
                        src={project.profiles.profile_image_url}
                        alt={project.profiles.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {project.profiles?.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{project.profiles?.name || "Anonymous"}</h3>
                    <p className="text-gray-400 text-xs">@{project.profiles?.username || "user"}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleBookmark(project.id)}
                  className="text-gray-400 hover:text-yellow-400 transition-colors duration-200"
                >
                  {bookmarkedProjects.includes(project.id) ? (
                    <BookmarkCheck size={20} className="text-yellow-400 fill-current" />
                  ) : (
                    <Bookmark size={20} />
                  )}
                </button>
              </div>

              {/* Project Title */}
              <h2 className="text-lg font-bold text-white mb-2 line-clamp-2">{project.title}</h2>

              {/* Project Description */}
              {project.description && (
                <p className="text-gray-300 text-sm mb-4 line-clamp-3">{project.description}</p>
              )}

              {/* Project Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-400">
                    <DollarSign size={16} className="mr-1" />
                    <span>Budget</span>
                  </div>
                  <span className="text-white font-semibold">₹{project.budget?.toLocaleString()}</span>
                </div>
                
                {project.deadline && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-400">
                      <Clock size={16} className="mr-1" />
                      <span>Deadline</span>
                    </div>
                    <span className="text-white">{project.deadline}</span>
                  </div>
                )}

                {project.location && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-400">
                      <MapPin size={16} className="mr-1" />
                      <span>Location</span>
                    </div>
                    <span className="text-white">{project.location}</span>
                  </div>
                )}
              </div>

              {/* Skills Required */}
              {project.skills_required && project.skills_required.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {project.skills_required.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                    {project.skills_required.length > 3 && (
                      <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded-full">
                        +{project.skills_required.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors duration-200 text-sm font-medium">
                  Apply Now
                </button>
                <button className="px-4 py-2 bg-[#3E3E55] hover:bg-[#4E4E65] rounded-lg transition-colors duration-200 text-sm">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && !loading && (
          <div className="text-center py-12">
            <Eye size={64} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No projects found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

const BrowsePageWrapper = () => {
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

  return <BrowsePage user={user} />;
};

export default BrowsePageWrapper;
