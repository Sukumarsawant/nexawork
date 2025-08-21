"use client"
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const ProfileForm = ({ userId }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();


  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Show uploading state if needed
      setLoading(true);

      // Create a unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;

      // Upload to Supabase bucket
      const { data, error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { publicUrl, error: urlError } = supabase.storage
        .from("profile-images")
        .getPublicUrl(fileName);

      if (urlError) throw urlError;

      // Update state immediately
      setProfile({ ...profile, profile_image_url: publicUrl });

      // Optionally update the database immediately
      await supabase
        .from("profiles")
        .update({ profile_image_url: publicUrl })
        .eq("id", userId);

      toast.success("Profile image updated!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image. Try again.");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return; // wait until we have a user id
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // If not found, initialize a blank profile for creation
        setProfile({
          id: userId,
          role: "student",
          name: "",
          username: "",
          bio: "",
          profile_image_url: "",
          tagline: "",
          about: "",
          location: "",
          timezone: "",
          languages: [],
          skills: [],
          availability_hours_per_week: null,
          availability_status: "available",
          hourly_rate: null,
          preferred_pricing: "hourly",
          portfolio_links: {},
          resume_url: "",
          email_verified: false,
          phone_verified: false,
          id_verified: false,
          payment_verified: false,
          avg_rating: 0,
          review_count: 0,
          badges: [],
          education: {},
          certifications: {},
          achievements: {},
          last_active: null,
        });
      } else {
        setProfile(data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [userId]);

  if (loading) return <p className="text-white">Loading...</p>;
  if (!profile) return <p className="text-white">No profile found.</p>;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (["skills", "languages", "badges"].includes(name)) {
      setProfile({ ...profile, [name]: value.split(",").map((s) => s.trim()) });
    } else if (["availability_hours_per_week", "review_count"].includes(name)) {
      setProfile({ ...profile, [name]: parseInt(value) });
    } else if (["hourly_rate", "avg_rating"].includes(name)) {
      setProfile({ ...profile, [name]: parseFloat(value) });
    } else if (["email_verified", "phone_verified", "id_verified", "payment_verified"].includes(name)) {
      setProfile({ ...profile, [name]: checked });
    } else {
      setProfile({ ...profile, [name]: value });
    }
  };

  // Handle portfolio links separately
  const handlePortfolioChange = (field, value) => {
    setProfile({
      ...profile,
      portfolio_links: {
        ...profile.portfolio_links,
        [field]: value
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updates = {
      ...profile,
      skills: profile.skills || [],
      languages: profile.languages || [],
      badges: profile.badges || [],
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("profiles")
      .upsert({ ...updates, id: userId }, { onConflict: "id" });
    if (error) toast.error("Update failed.");
    else {
      toast.success("Profile updated successfully!");
      router.push('/student/profile')
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-white text-xl mb-4 font-semibold">Update Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-white block mb-1 text-sm font-medium">Name *</label>
            <input
              type="text"
              name="name"
              value={profile.name || ""}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-[#5E4A77] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              required
            />
          </div>
          <div>
            <label className="text-white block mb-1 text-sm font-medium">Username</label>
            <input
              type="text"
              name="username"
              value={profile.username || ""}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-[#5E4A77] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
        </div>

        <div>
          <label className="text-white block mb-1 text-sm font-medium">Bio</label>
          <textarea
            name="bio"
            value={profile.bio || ""}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-[#5E4A77] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            rows="3"
            placeholder="Tell us about yourself..."
          />
        </div>

        <div>
          <label className="text-white block mb-1 text-sm font-medium">Tagline</label>
          <input
            type="text"
            name="tagline"
            value={profile.tagline || ""}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-[#5E4A77] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="e.g., Full-stack developer passionate about creating amazing web experiences"
          />
        </div>

        {/* Location and Timezone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-white block mb-1 text-sm font-medium">Location</label>
            <input
              type="text"
              name="location"
              value={profile.location || ""}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-[#5E4A77] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="e.g., New York, USA"
            />
          </div>
          <div className="mb-4">
  <label className="text-white block mb-1 text-sm font-medium">Profile Image</label>
  <div
    className="w-32 h-32 bg-gray-400 rounded-full mb-2 overflow-hidden cursor-pointer relative"
    onClick={() => document.getElementById("profileImageInput").click()}
  >
    {profile?.profile_image_url ? (
      <img
        src={profile.profile_image_url}
        alt="profile"
        className="w-full h-full object-cover"
      />
    ) : (
      <span className="text-gray-200 flex items-center justify-center h-full">
        Click to upload
      </span>
    )}
    {loading && (
      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white">
        Uploading...
      </div>
    )}
  </div>
  <input
    type="file"
    id="profileImageInput"
    accept="image/*"
    className="hidden"
    onChange={handleProfileImageUpload}
  />
</div>



        </div>

        {/* Skills and Languages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-white block mb-1 text-sm font-medium">Skills (comma separated)</label>
            <input
              type="text"
              name="skills"
              value={profile.skills?.join(", ") || ""}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-[#5E4A77] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="e.g., JavaScript, React, Node.js, Python"
            />
          </div>
          <div>
            <label className="text-white block mb-1 text-sm font-medium">Languages (comma separated)</label>
            <input
              type="text"
              name="languages"
              value={profile.languages?.join(", ") || ""}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-[#5E4A77] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="e.g., English, Spanish, French"
            />
          </div>
        </div>

        {/* Availability and Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-white block mb-1 text-sm font-medium">Availability Status</label>
            <select
              name="availability_status"
              value={profile.availability_status || "available"}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-[#5E4A77] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="part-time">Part-time</option>
            </select>
          </div>
          <div>
            <label className="text-white block mb-1 text-sm font-medium">Hours per Week</label>
            <input
              type="number"
              name="availability_hours_per_week"
              value={profile.availability_hours_per_week || ""}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-[#5E4A77] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="e.g., 20"
              min="0"
              max="168"
            />
          </div>
          <div>
            <label className="text-white block mb-1 text-sm font-medium">Hourly Rate ($)</label>
            <input
              type="number"
              name="hourly_rate"
              value={profile.hourly_rate || ""}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-[#5E4A77] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="e.g., 25"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Portfolio Links */}
        <div className="space-y-3">
          <label className="text-white block text-sm font-medium">Portfolio Links</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-white block mb-1 text-xs">GitHub</label>
              <input
                type="url"
                value={profile.portfolio_links?.github || ""}
                onChange={(e) => handlePortfolioChange("github", e.target.value)}
                className="w-full p-3 rounded-lg bg-[#5E4A77] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="https://github.com/username"
              />
            </div>
            <div>
              <label className="text-white block mb-1 text-xs">LinkedIn</label>
              <input
                type="url"
                value={profile.portfolio_links?.linkedin || ""}
                onChange={(e) => handlePortfolioChange("linkedin", e.target.value)}
                className="w-full p-3 rounded-lg bg-[#5E4A77] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div>
              <label className="text-white block mb-1 text-xs">Portfolio Website</label>
              <input
                type="url"
                value={profile.portfolio_links?.website || ""}
                onChange={(e) => handlePortfolioChange("website", e.target.value)}
                className="w-full p-3 rounded-lg bg-[#5E4A77] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="https://yourportfolio.com"
              />
            </div>
            <div>
              <label className="text-white block mb-1 text-xs">Resume URL</label>
              <input
                type="url"
                name="resume_url"
                value={profile.resume_url || ""}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-[#5E4A77] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="https://drive.google.com/..."
              />
            </div>
          </div>
        </div>

        {/* Profile Image */}


        {/* About Section */}
        <div>
          <label className="text-white block mb-1 text-sm font-medium">About</label>
          <textarea
            name="about"
            value={profile.about || ""}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-[#5E4A77] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            rows="4"
            placeholder="Tell us more about your experience, background, and what you're passionate about..."
          />
        </div>

        <button type="submit" className="w-full bg-[#5E4A77] hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg mt-6 transition-colors duration-200">
          Update Profile
        </button>
      </form>
    </div>
  );
};

export default ProfileForm;
