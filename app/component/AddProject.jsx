"use client"
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

const AddProject = ({ userId, onProjectAdded, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    technologies: '',
    project_url: '',
    github_url: '',
    duration: '',
    role: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const projectData = {
        user_id: userId,
        title: formData.title,
        description: formData.description,
        technologies: formData.technologies.split(',').map(tech => tech.trim()).filter(tech => tech),
        project_url: formData.project_url || null,
        github_url: formData.github_url || null,
        duration: formData.duration,
        role: formData.role,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('projects')
        .insert([projectData]);

      if (error) throw error;

      toast.success('Project added successfully!');
      onProjectAdded();
      onClose();
      setFormData({
        title: '',
        description: '',
        technologies: '',
        project_url: '',
        github_url: '',
        duration: '',
        role: ''
      });
    } catch (error) {
      console.error('Error adding project:', error);
      toast.error('Failed to add project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-[#0E0E12] rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl relative flex flex-col border border-gray-700">
        
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-gray-700">
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg font-semibold"
            onClick={onClose}
          >
            ✕
          </button>
          <h2 className="text-2xl font-bold text-white">
            Add New Project
          </h2>
        </div>
        
        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Title */}
            <div>
              <label className="text-gray-300 block mb-1 text-sm font-medium">Project Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-[#3E3E55] text-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                required
                placeholder="Enter project title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-gray-300 block mb-1 text-sm font-medium">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-[#3E3E55] text-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                rows="4"
                required
                placeholder="Describe your project..."
              />
            </div>

            {/* Technologies */}
            <div>
              <label className="text-gray-300 block mb-1 text-sm font-medium">Technologies (comma separated)</label>
              <input
                type="text"
                name="technologies"
                value={formData.technologies}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-[#3E3E55] text-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                placeholder="e.g., React, Node.js, MongoDB"
              />
            </div>

            {/* URLs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-300 block mb-1 text-sm font-medium">Project URL</label>
                <input
                  type="url"
                  name="project_url"
                  value={formData.project_url}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg bg-[#3E3E55] text-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                  placeholder="https://yourproject.com"
                />
              </div>
              <div>
                <label className="text-gray-300 block mb-1 text-sm font-medium">GitHub URL</label>
                <input
                  type="url"
                  name="github_url"
                  value={formData.github_url}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg bg-[#3E3E55] text-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                  placeholder="https://github.com/username/repo"
                />
              </div>
            </div>

            {/* Duration & Role */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-300 block mb-1 text-sm font-medium">Duration</label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg bg-[#3E3E55] text-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                  placeholder="e.g., 3 months, 6 weeks"
                />
              </div>
              <div>
                <label className="text-gray-300 block mb-1 text-sm font-medium">Your Role</label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg bg-[#3E3E55] text-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                  placeholder="e.g., Full-stack Developer, Frontend Developer"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#3E3E55] hover:bg-[#3E3E55]/80 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                {loading ? 'Adding...' : 'Add Project'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProject;
