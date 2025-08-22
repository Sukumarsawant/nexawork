'use client'
import React, { useEffect, useMemo, useState } from "react";
import EditProfile from "./EditProfile";
import AddProject from "@/component/AddProject";
import ProjectCard from "@/component/ProjectCard";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";

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
        return <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" className="lucide lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5a6.5 6.5 0 0 0-1-3.5c.3-1.1.3-2.3 0-3.5 0 0-1 0-3 1.5-2.6-.5-5.4-.5-8 0C6 2 5 2 5 2c-.3 1.1-.3 2.3 0 3.5a6.5 6.5 0 0 0-1 3.5c0 3.5 3 5.5 6 5.5-.4.5-.7 1.1-.9 1.7-.2.6-.2 1.2-.2 1.8v4" /><path d="M9 18c-4.5 2-5-2-7-2" /></svg>;
      case "linkedin":
        return <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" className="lucide lucide-linkedin"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>;
      case "website":
        return <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" className="lucide lucide-globe"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>;
      case "resume":
        return <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" className="lucide lucide-file"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></svg>;
      default:
        return null;
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

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      setProfile(profileData || null);

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
    const { data: projectsData } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });
    setProjects(projectsData || []);
  };

  const handleProjectDelete = async (projectId) => {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);
    if (!error) {
      setProjects(prev => prev.filter(project => project.id !== projectId));
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
      <div className="flex flex-col w-full max-w-7xl gap-6">

        {/* Profile Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left Sidebar */}
          <div className="bg-[#3E3E55]/50 rounded-2xl p-6 flex flex-col items-center md:items-start gap-6">
            {/* Profile Image + Name */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3 w-full">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-500">
                {profile?.profile_image_url && (
                  <img src={profile.profile_image_url} alt="profile" className="w-full h-full object-cover" />
                )}
              </div>
              <h1 className="text-2xl font-bold">{profile?.name || ""}</h1>
              <p className="text-gray-300">{profile?.tagline || profile?.about || ""}</p>
              <div className="flex flex-wrap gap-3 mt-2">
                <button className="px-4 py-2 bg-[#3E3E55]/70 rounded-xl">Contact</button>
                <button onClick={() => setShowEdit(true)} className="px-4 py-2 bg-[#3E3E55]/90 rounded-xl">Edit</button>
                
              </div>
            </div>
            <div className="mt-6">
                  <Link href="/verification">
                    <button className="bg-[#3E3E55] text-white px-6 py-2 rounded-lg shadow-md hover:bg-opacity-90">
                      Get Verified
                    </button>
                  </Link>
                </div>
            {/* Social Links */}
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              {socialLinks.length > 0 ? socialLinks.map(link => (
                <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="hover:opacity-80">
                  {getIconByLabel(link.label)}
                </a>
              )) : <p className="text-sm text-gray-400">No links</p>}
            </div>

            {/* Location */}
            {profile?.location && (
              <div className="flex items-center gap-2 text-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="lucide lucide-map-pin">
                  <path d="M20 10c0 5-5.5 10-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20 4 15 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" />
                </svg>
                <span>{profile.location}</span>
              </div>
            )}

            {/* Bio */}
            {profile?.bio && (
              <div className="w-full border-t border-gray-600 pt-4 text-sm text-gray-300">{profile.bio}</div>
            )}

            {/* Skills */}
            <div className="w-full border-t border-gray-600 pt-4">
              <h2 className="text-lg font-semibold mb-2">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {(profile?.skills || []).map(skill => (
                  <span key={skill} className="px-3 py-1 bg-[#0E0E12]/60 rounded-md text-sm">{skill}</span>
                ))}
                {(!profile?.skills || profile.skills.length === 0) && (
                  <p className="text-sm text-gray-400">No skills added</p>
                )}
              </div>
            </div>

            {/* Languages */}
            {profile?.languages?.length > 0 && (
              <div className="w-full border-t border-gray-600 pt-4">
                <h2 className="text-lg font-semibold mb-2">Languages</h2>
                <p className="text-sm text-gray-300">{profile.languages.join(", ")}</p>
              </div>
            )}
          </div>

          {/* Right Section */}
          <div className="md:col-span-2 flex flex-col gap-6">

            {/* Availability & Rate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="mt-4">
    <h3 className="text-lg font-semibold text-white mb-2">Badges Earned</h3>
    <div className="flex flex-wrap gap-2">
      {profile?.badges.map((badgeId, index) => {
        const badgeInfo = {
          figma: { name: "Figma Design", icon: "🎨", color: "bg-purple-100 text-purple-800",src:"/badgeF.png" },
          nextjs: { name: "Next.js", icon: "⚡", color: "bg-blue-100 text-blue-800",src:"/badgeN.png" }
        };
        
        const badge = badgeInfo[badgeId];
        if (!badge) return null;
        
        return (
          <div
  key={index}
  className="relative inline-flex items-center"
>
  {/* Badge Image */}
  <Image 
    src={badge.src} 
    width={100} 
    height={100} 
    alt={badge.name}
    className="cursor-pointer"
  />

  {/* Tooltip (Name on Hover) */}
  <span
    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1 
               text-sm font-medium text-white bg-gray-800 rounded-md opacity-0 
               group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
  >
    {badge.name}
  </span>
</div>
        );
      })}
    </div>
  </div>
              <div className="bg-[#3E3E55]/50 rounded-2xl p-6 flex flex-col gap-3">
                {profile?.availability_hours_per_week != null && (
                  <div className="flex items-center gap-2 text-gray-200">
                    ⏱ {profile.availability_hours_per_week} hrs/week
                  </div>
                )}
                {profile?.hourly_rate != null && (
                  <div className="flex items-center gap-2 text-gray-200">
                    💰 ${Number(profile.hourly_rate).toFixed(2)}/hr
                  </div>
                )}
              </div>
            </div>

            {/* Projects */}
            <div className="bg-[#3E3E55] rounded-2xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Projects</h2>
                <button
                  onClick={() => setShowAddProject(true)}
                  className="px-4 py-2 bg-[#3E3E55]/70 hover:bg-[#3E3E55]/90 rounded-lg text-sm"
                >
                  + Add Project
                </button>
              </div>
              {projects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projects.map(project => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onDelete={handleProjectDelete}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No projects added yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showEdit && <EditProfile onClose={() => setShowEdit(false)} />}
      {showAddProject && (
        <AddProject
          userId={currentUserId}
          onProjectAdded={handleProjectAdded}
          onClose={() => setShowAddProject(false)}
        />
      )}
      {loading && <div className="absolute top-4 right-4 text-gray-400 text-sm">Loading...</div>}
    </div>
  );
};

export default ProfilePage;
