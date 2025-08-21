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
  
    // Realtime subscription using the new API
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
      supabase.removeChannel(channel); // cleanup
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

      const { publicUrl } = supabase.storage
        .from("community-images")
        .getPublicUrl(fileName);

      imageUrl = publicUrl;
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
      <div className="bg-[#1B1B2F] p-4 rounded-lg mb-6">
        <textarea
          className="w-full p-3 rounded-lg bg-[#2A2A40] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          className="mt-2 text-sm text-white"
        />
        <button
          onClick={handlePost}
          className="mt-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg"
        >
          Post
        </button>
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-[#1B1B2F] p-4 rounded-lg border border-gray-700">
            {post.image_url && (
              <img src={post.image_url} alt="" className="w-full h-auto rounded-lg mb-2" />
            )}
            <p className="text-white">{post.content}</p>
            <p className="text-gray-400 text-sm mt-1">{new Date(post.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityPage;
