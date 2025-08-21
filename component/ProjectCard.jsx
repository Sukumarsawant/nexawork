"use client";
import React from "react";

const ProjectCard = ({ project, onDelete }) => {
  return (
    <div className="bg-[#1a1025] border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10">
      
      {/* Optional Icon / Placeholder */}
      <div className="w-12 h-12 rounded-lg bg-[#251a35] flex items-center justify-center mb-4 text-purple-300">
        {project.icon || "🛠️"} {/* Replace with your icon if available */}
      </div>

      {/* Title and Delete */}
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-white">{project.title}</h3>
        <button
          onClick={() => onDelete(project.id)}
          className="text-red-400 hover:text-red-300 text-sm"
        >
          Delete
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 mb-4 line-clamp-3">{project.description}</p>

      {/* Technologies */}
      {project.technologies && project.technologies.length > 0 && (
        <div className="mb-4">
          <span className="text-sm text-gray-400">Technologies:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {project.technologies.map((tech, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-purple-600 text-white text-xs rounded"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Links */}
      <div className="space-y-2 mb-4">
        {project.project_url && (
          <div>
            <span className="text-sm text-gray-400">Project URL:</span>
            <a
              href={project.project_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-purple-400 hover:text-purple-300 text-sm mt-1"
            >
              {project.project_url}
            </a>
          </div>
        )}
        {project.github_url && (
          <div>
            <span className="text-sm text-gray-400">GitHub:</span>
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-purple-400 hover:text-purple-300 text-sm mt-1"
            >
              {project.github_url}
            </a>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-sm text-gray-400">
        <span>Duration: {project.duration}</span>
        <span>Role: {project.role}</span>
      </div>
    </div>
  );
};

export default ProjectCard;
