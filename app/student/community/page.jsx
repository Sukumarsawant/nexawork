"use client"
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Send, Image, Heart, MessageCircle, MoreVertical, User, Clock, Trash2, Edit } from "lucide-react";

const CommunityPage = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostText, setNewPostText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const postsEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadUserProfile();
    loadPosts();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [posts]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("community_posts")
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
      setPosts(data || []);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    postsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPG, PNG, GIF, or WebP)');
        return;
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('Image size must be less than 5MB');
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file) => {
    try {
      console.log("Starting image upload...", file.name);
      
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      
      console.log("File name:", fileName);

      // Upload to the dedicated community-images bucket
      const { data, error } = await supabase.storage
        .from("community-images")
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error("Upload error:", error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("community-images")
        .getPublicUrl(fileName);
        
      console.log("Upload successful:", publicUrl);
      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      
      // Show user-friendly error message
      if (error.message.includes('bucket') || error.message.includes('not found')) {
        alert("Image upload failed: Storage bucket not configured. Please run the storage setup script in Supabase.");
      } else if (error.message.includes('file size')) {
        alert("Image upload failed: File size too large. Please use a smaller image.");
      } else if (error.message.includes('file type')) {
        alert("Image upload failed: Invalid file type. Please use JPG, PNG, or GIF.");
      } else {
        alert("Image upload failed. Please try again.");
      }
      
      return null;
    }
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!newPostText.trim() && !selectedImage) return;

    setIsSubmitting(true);
    try {
      let imageUrl = null;
      if (selectedImage) {
        console.log("Uploading image...", selectedImage.name, selectedImage.size);
        imageUrl = await uploadImage(selectedImage);
        console.log("Image upload result:", imageUrl);
      }

      const postData = {
        user_id: user.id,
        content: newPostText.trim(),
      };

      // Only add image_url if we successfully uploaded an image
      if (imageUrl) {
        postData.image_url = imageUrl;
        console.log("Adding image URL to post:", imageUrl);
      }

      console.log("Creating post with data:", postData);

      const { data, error } = await supabase
        .from("community_posts")
        .insert(postData)
        .select(`
          *,
          profiles:user_id (
            name,
            username,
            profile_image_url
          )
        `)
        .single();

      if (error) {
        console.error("Error creating post:", error);
        throw error;
      }

      console.log("Post created successfully:", data);
      console.log("Post image_url:", data.image_url);
      
      setPosts(prev => [data, ...prev]);
      setNewPostText("");
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - postTime) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleLike = async (postId) => {
    // This would be implemented with a likes table
    console.log("Like post:", postId);
  };

  const handleComment = async (postId) => {
    // This would be implemented with a comments table
    console.log("Comment on post:", postId);
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
    <div className="flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 pb-24">
        {/* Header */}
        <div className="py-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-white">Student Community</h1>
          <p className="text-gray-400 mt-1">Share your thoughts and connect with fellow students</p>
        </div>

        {/* Posts Feed */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <div
                key={post.id}
                className="bg-[#1B1B2F] rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors duration-200"
              >
                {/* Post Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                      {post.profiles?.profile_image_url ? (
                        <img
                          src={post.profiles.profile_image_url}
                          alt={post.profiles.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-sm">
                          {post.profiles?.name?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">
                        {post.profiles?.name || "Anonymous"}
                      </h3>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <Clock size={12} />
                        <span>{formatTimestamp(post.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors duration-200 cursor-pointer">
                    <MoreVertical size={16} />
                  </button>
                </div>

                {/* Post Content */}
                {post.content && (
                  <p className="text-white text-sm mb-3 leading-relaxed">{post.content}</p>
                )}

                {/* Post Image */}
                {post.image_url && (
                  <div className="mb-3">
                    <img
                      src={post.image_url}
                      alt="Post content"
                      className="w-full rounded-lg max-h-96 object-cover"
                    />
                  </div>
                )}

                {/* Post Actions */}
                <div className="flex items-center space-x-6 pt-2 border-t border-gray-700">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors duration-200 cursor-pointer"
                  >
                    <Heart size={16} />
                    <span className="text-xs">Like</span>
                  </button>
                  <button
                    onClick={() => handleComment(post.id)}
                    className="flex items-center space-x-2 text-gray-400 hover:text-purple-400 transition-colors duration-200 cursor-pointer"
                  >
                    <MessageCircle size={16} />
                    <span className="text-xs">Comment</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">No posts yet</h3>
              <p className="text-gray-500">Be the first to share something with the community!</p>
            </div>
          )}
          <div ref={postsEndRef} />
        </div>
      </div>

      {/* Sticky Chat Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1B1B2F] border-t border-gray-700 p-4">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmitPost} className="flex items-end space-x-3">
            {/* User Avatar */}
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              {userProfile?.profile_image_url ? (
                <img
                  src={userProfile.profile_image_url}
                  alt={userProfile.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {userProfile?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              )}
            </div>

            {/* Input Area */}
            <div className="flex-1 bg-[#3E3E55] rounded-xl p-3 border border-gray-600 focus-within:border-purple-400 transition-colors duration-200">
              <textarea
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-transparent text-white placeholder-gray-400 resize-none outline-none text-sm"
                rows={1}
                style={{ minHeight: '20px', maxHeight: '120px' }}
              />
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="relative mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-200 cursor-pointer"
                  >
                    <Trash2 size={12} className="text-white" />
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-colors duration-200 cursor-pointer"
              >
                <Image size={20} />
              </button>
              <button
                type="submit"
                disabled={(!newPostText.trim() && !selectedImage) || isSubmitting}
                className="p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 cursor-pointer"
              >
                <Send size={20} className="text-white" />
              </button>
            </div>
          </form>
        </div>
      </div>
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
