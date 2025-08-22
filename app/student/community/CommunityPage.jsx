"use client"
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

const CommunityPage = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);

  // Fetch posts
  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setPosts(data);
  };

  useEffect(() => {
    fetchPosts();

    // Realtime subscription
    const channel = supabase
      .channel("public:community_posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_posts" },
        (payload) => {
          setPosts((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle post submission
  const handlePost = async () => {
    let imageUrl = null;

    if (image) {
      const fileExt = image.name.split(".").pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("community-images")
        .upload(fileName, image, { cacheControl: "3600", upsert: true });

      if (uploadError) return toast.error("Image upload failed.");

      const { data } = supabase.storage
        .from("community-images")
        .getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    const { error } = await supabase.from("community_posts").insert([
      {
        user_id: user.id,
        content,
        image_url: imageUrl,
      },
    ]);

    if (error) toast.error(error.message);
    else {
      setContent("");
      setImage(null);
      toast.success("Posted successfully!");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Post Input */}
      <div className="bg-purple-950 border border-purple-800 p-4 rounded-xl shadow-md mb-6">
        <textarea
          className="w-full p-3 rounded-lg bg-[#3E3E55] text-white placeholder-gray-400 
                     focus:outline-none focus:ring-2 focus:ring-gray-500"
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          className="mt-2 text-sm text-gray-300"
        />
        <div className="flex gap-3 mt-3">
          <button
            onClick={handlePost}
            className="bg-[#3E3E55] hover:bg-[#505070] text-white font-semibold 
                       px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Post
          </button>
          <button
            onClick={() => {
              setContent("");
              setImage(null);
            }}
            className="px-4 py-2 border border-gray-600 text-gray-300 hover:text-white 
                       hover:border-white rounded-lg transition-colors duration-200"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-purple-950 border border-purple-800 p-4 rounded-xl shadow-sm"
          >
            {post.image_url && (
              <img
                src={post.image_url}
                alt=""
                className="w-full h-auto rounded-lg mb-3"
              />
            )}
            <p className="text-white">{post.content}</p>
            <p className="text-gray-400 text-xs mt-2">
              {new Date(post.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityPage;
