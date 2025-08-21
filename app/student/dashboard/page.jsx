'use client'

import { useState, useEffect } from 'react'
import { Bell, Search, User, TrendingUp, DollarSign, Clock, MapPin, Plus, BookOpen, Wallet } from 'lucide-react'
import LogoutButton from '@/component/LogOutButton'
import { supabase } from '@/lib/supabaseClient'
import ResumeUpload from '@/component/ResumeUpload'

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    completedProjects: 0,
    activeProjects: 0
  });

  useEffect(() => {
    loadUserData();
    loadRecentProjects();
    loadStats();
  }, []);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadRecentProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentProjects(data || []);
    } catch (error) {
      console.error("Error loading recent projects:", error);
    }
  };

  const loadStats = async () => {
    // This would be replaced with actual data from your database
    setStats({
      totalEarnings: 25000,
      completedProjects: 8,
      activeProjects: 2
    });
  };

  const blogs = [
    { id: 1, title: 'Top 5 AI Tools for Students', link: '#', readTime: '5 min read' },
    { id: 2, title: 'Freelancing Tax Basics You Should Know', link: '#', readTime: '8 min read' },
    { id: 3, title: 'UI/UX Trends 2025', link: '#', readTime: '6 min read' },
  ]

  return (
    <div>
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.user_metadata?.full_name || 'Student'}! 👋
          </h1>
          <p className="text-gray-400">Here's what's happening with your freelancing journey</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1B1B2F] rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Earnings</p>
                <p className="text-2xl font-bold text-white">₹{stats.totalEarnings.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-600/20 rounded-lg">
                <DollarSign className="text-green-400" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-[#1B1B2F] rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Completed Projects</p>
                <p className="text-2xl font-bold text-white">{stats.completedProjects}</p>
              </div>
              <div className="p-3 bg-blue-600/20 rounded-lg">
                <TrendingUp className="text-blue-400" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-[#1B1B2F] rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Projects</p>
                <p className="text-2xl font-bold text-white">{stats.activeProjects}</p>
              </div>
              <div className="p-3 bg-purple-600/20 rounded-lg">
                <Clock className="text-purple-400" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Projects */}
          <div className="lg:col-span-2">
            <div className="bg-[#1B1B2F] rounded-xl p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Recent Projects</h2>
                <button className="text-purple-400 hover:text-purple-300 text-sm font-medium">
                  View All
                </button>
              </div>

              <div className="space-y-4">
                {recentProjects.length > 0 ? (
                  recentProjects.map((project) => (
                    <div key={project.id} className="bg-[#3E3E55]/50 rounded-lg p-4 hover:bg-[#4E4E65]/50 transition-colors duration-200">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-white">{project.title}</h3>
                        <span className="text-purple-400 font-medium">₹{project.budget?.toLocaleString()}</span>
                      </div>
                      {project.description && (
                        <p className="text-gray-300 text-sm mb-3 line-clamp-2">{project.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          {project.deadline && (
                            <div className="flex items-center">
                              <Clock size={14} className="mr-1" />
                              <span>{project.deadline}</span>
                            </div>
                          )}
                          {project.location && (
                            <div className="flex items-center">
                              <MapPin size={14} className="mr-1" />
                              <span>{project.location}</span>
                            </div>
                          )}
                        </div>
                        <button className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors duration-200">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus size={24} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">No projects yet</h3>
                    <p className="text-gray-500 mb-4">Start by adding your first project to showcase your work!</p>
                    <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors duration-200">
                      Add Project
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-[#1B1B2F] rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors duration-200">
                  <Plus size={20} />
                  <span className="font-medium">Add New Project</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-4 py-3 bg-[#3E3E55] hover:bg-[#4E4E65] rounded-lg transition-colors duration-200">
                  <User size={20} />
                  <span className="font-medium">Update Profile</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-4 py-3 bg-[#3E3E55] hover:bg-[#4E4E65] rounded-lg transition-colors duration-200">
                  <Wallet size={20} />
                  <span className="font-medium">Check Wallet</span>
                </button>
              </div>
            </div>

            {/* Tech Trends */}
            <div className="bg-[#1B1B2F] rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Tech Trends</h2>
              <div className="space-y-4">
                {blogs.map((blog) => (
                  <div key={blog.id} className="group cursor-pointer">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-purple-600/20 rounded-lg group-hover:bg-purple-600/30 transition-colors duration-200">
                        <BookOpen size={16} className="text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium group-hover:text-purple-400 transition-colors duration-200">
                          {blog.title}
                        </h3>
                        <p className="text-gray-400 text-sm">{blog.readTime}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
            </div>
            <ResumeUpload/>

            {/* Logout */}
            <div className="bg-[#1B1B2F] rounded-xl p-6 border border-gray-700">
              <LogoutButton />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
