'use client'
import React, { useEffect, useMemo, useState } from "react";
import EditProfile from "./EditProfile";
import AddProject from "@/component/AddProject";
import ProjectCard from "@/component/ProjectCard";
import { supabase } from "@/lib/supabaseClient";




const ProfilePage = () => {
  const [showEdit, setShowEdit] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  const getIconByLabel = (label) => {
    switch (label.toLowerCase()) {
      case "github":
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-github-icon lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>;
      case "linkedin":
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-linkedin-icon lucide-linkedin"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>;
      case "website":
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe-icon lucide-globe"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>;
      case "resume":
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-icon lucide-file"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>;
      default:
        return null; // or a default icon
    }
  };

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      setCurrentUserId(userId);

      // Load profile data
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      setProfile(profileData || null);

      // Load projects data
      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setProjects(projectsData || []);

      setLoading(false);
    };
    load();
  }, []);

  const handleProjectAdded = async () => {
    // Reload projects after adding a new one
    const { data: projectsData } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });
    setProjects(projectsData || []);
  };

  const handleProjectDelete = async (projectId) => {
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      // Remove from local state
      setProjects(prev => prev.filter(project => project.id !== projectId));
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const socialLinks = useMemo(() => {
    if (!profile?.portfolio_links) return [];
    const links = profile.portfolio_links;
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
  }, [profile]);

  return (
    <div className="min-h-screen w-full bg-[#0E0E12] text-white flex justify-center p-4 sm:p-6">
      <div className="flex flex-col w-full max-w-6xl gap-6">
        {/* Profile Section */}
        <div className="flex flex-col md:flex-row w-full bg-[#3E3E55]/50 rounded-2xl overflow-hidden shadow-xl">
          {/* Left Sidebar */}
          <div className="w-full h-full md:w-[30%] bg-[#3E3E55]/50 p-6 flex flex-col items-center rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none">
            {/* Profile Image */}
            <div className="w-32 h-32 bg-gray-400 rounded-full mb-6 overflow-hidden">
              {profile?.profile_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.profile_image_url} alt="profile" className="w-full h-full object-cover" />
              ) : null}
            </div>

            {/* Location + Availability */}
            <div className="w-full border-b border-gray-600 pb-4 mb-4 text-center">
              <div className="flex flex-col  justify-center  gap-3 ">

                {/* Location */}
                {profile?.location && (
                  <div className="flex items-center gap-2 text-gray-200">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-map-pin"
                    >
                      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="text-lg font-semibold">{profile.location}</span>
                  </div>
                )}

                {/* Availability */}
                {profile?.availability_hours_per_week != null && (
                  <div className="flex items-center gap-2 text-gray-200">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-clock"
                    >
                      <path d="M12 6v6l-4-2" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    <span className="text-lg font-semibold">
                      {profile.availability_hours_per_week} hrs/week
                    </span>
                  </div>
                )}

                {/* Hourly Rate */}
                {profile?.hourly_rate != null && (
                  <div className="flex items-center gap-2 text-gray-200">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-dollar-sign"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                      <path d="M12 18V6" />
                    </svg>
                    <span className="text-lg font-semibold">${Number(profile.hourly_rate).toFixed(2)}/hr</span>
                  </div>
                )}

              </div>
            </div>


            {/* Social Links */}
            <div className="w-full flex gap-5 mb-6 text-center space-y-2">
              {socialLinks.map((link) => (
                <a key={`${link.label}-${link.href}`} href={link.href} target="_blank" rel="noreferrer" className="block hover:underline break-all">
                   {getIconByLabel(link.label)}
                   
                </a>
              ))}
              {(!socialLinks || socialLinks.length === 0) && <p className="text-sm text-gray-300">No links</p>}
            </div>

            {/* Verifications */}
            <div className="w-full">
  <h2 className="text-lg font-semibold mb-2">Verifications</h2>
  <ul className="space-y-2 text-sm">
    {/* ID Verified */}
    <li className="flex items-center gap-2">
      {profile?.id_verified ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 "
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      ID Verified
    </li>

    {/* Email Verified */}
    <li className="flex items-center gap-2">
      {profile?.email_verified ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 "
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 "
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      Email Verified
    </li>

    {/* Payment Verified */}
    <li className="flex items-center gap-2">
      {profile?.payment_verified ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 "
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 "
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      Payment Verified
    </li>

    {/* Phone Verified */}
    <li className="flex items-center gap-2">
      {profile?.phone_verified ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 "
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 "
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      Phone Verified
    </li>
  </ul>
</div>

          </div>

          {/* Right Main Section */}
          <div className="w-full md:w-[70%] bg-[#3E3E55]/50 p-8 rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold">{profile?.name || ""}</h1>
              <p className="text-gray-300">{profile?.tagline || profile?.about || ""}</p>

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 w-full sm:w-auto">
                  Hire Me
                </button>
                <button
                  className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 flex items-center gap-2 w-full sm:w-auto"
                  onClick={() => setShowEdit(true)}
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Skills */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {(profile?.skills || []).map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-[#0E0E12] rounded-lg text-sm">
                    {skill}
                  </span>
                ))}
                {(!profile?.skills || profile.skills.length === 0) && (
                  <p className="text-sm text-gray-300">No skills added</p>
                )}
              </div>
            </div>

            {/* Stats */}
     

            {/* Education / Certifications / Achievements */}
        

            <div className="bg-[#3E3E55] rounded-2xl p-8 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Projects</h2>
                <button
                  onClick={() => setShowAddProject(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors duration-200"
                >
                  + Add Project
                </button>
              </div>

              {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onDelete={handleProjectDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg mb-4">No projects added yet</p>
                  <p className="text-gray-500">Start by adding your first project to showcase your work!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Projects Section */}

      </div>

      {showEdit && <EditProfile onClose={() => setShowEdit(false)} />}
      {showAddProject && (
        <AddProject
          userId={currentUserId}
          onProjectAdded={handleProjectAdded}
          onClose={() => setShowAddProject(false)}
        />
      )}
      {loading && <div className="absolute top-4 right-4 text-gray-300 text-sm">Loading...</div>}
    </div>
  );
};

export default ProfilePage;
