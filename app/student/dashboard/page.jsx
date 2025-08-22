'use client'

import { useState, useEffect } from 'react'
import { 
  Bell, 
  Search, 
  User, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  MapPin, 
  Plus, 
  BookOpen, 
  Wallet,
  Home,
  Briefcase,
  Users,
  MessageCircle,
  Heart,
  Share2,
  MoreHorizontal,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Star,
  Settings,
  LogOut,
  CheckCircle,
  Video,
  ImageIcon,
  Edit3,
  ExternalLink,
  Eye,
  Crown,
  Megaphone,
  BarChart3,
  Bookmark,
  Hash,
  Mail,
  Calendar as CalendarIcon,
  ChevronDown,
  Globe,
  Send
} from 'lucide-react'
import LogoutButton from '@/component/LogOutButton'
import { supabase } from '@/lib/supabaseClient'
import ResumeUpload from '@/component/ResumeUpload'

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  const POSTS_PER_PAGE = 10;

  useEffect(() => {
    loadUserData();
    loadPosts();
    loadBlogs();
    loadUpcomingEvents();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadPosts = async (page = 0) => {
    try {
      setLoading(true);
      const from = page * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;
      
      // For now, use dummy data since we don't have real posts
      const dummyPosts = generateDummyPosts(from, to);
      
      if (page === 0) {
        setPosts(dummyPosts);
      } else {
        setPosts(prev => [...prev, ...dummyPosts]);
      }
      
      setCurrentPage(page);
      setHasMore(dummyPosts.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
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

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching posts:", error);
        // Fallback to dummy data
        setPosts(generateDummyPosts(0, POSTS_PER_PAGE - 1));
      } else {
        setPosts(data || generateDummyPosts(0, POSTS_PER_PAGE - 1));
      }
    } catch (error) {
      console.error("Error in fetchPosts:", error);
      setPosts(generateDummyPosts(0, POSTS_PER_PAGE - 1));
    }
  };

  const generateDummyPosts = (from, to) => {
    const dummyPosts = [
      {
        id: 1,
        user_name: "Samudra J.",
        user_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        content: "What an unforgettable day at Razorpreneur 3.0 hosted at Vidyalankar Institute of Technology, Mumbai! As the General Secretary of the Student Council, I had the privilege of organizing this incredible event that brought together aspiring entrepreneurs and industry leaders. The energy was electric as we explored the future of entrepreneurship and innovation. Special thanks to all the speakers, participants, and our amazing team who made this possible. Here's to building the next generation of business leaders! 🚀 #Razorpreneur #Entrepreneurship #Innovation #VITMumbai",
        image_url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&h=400&fit=crop",
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        likes: 89,
        comments: 23,
        isConnection: true,
        likedBy: "Navin Choudhary"
      },
      {
        id: 2,
        user_name: "Sarah Johnson",
        user_avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
        content: "Just completed my first freelance project! 🎉 The client was super happy with the React dashboard I built. Feeling motivated to take on more challenging projects. #freelancing #webdev #success",
        image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        likes: 24,
        comments: 8
      },
      {
        id: 3,
        user_name: "Alex Chen",
        user_avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        content: "Working on a new AI-powered chatbot for a startup. The integration with OpenAI's API is going smoothly. Anyone else working with AI/ML projects? Would love to connect! 🤖 #AI #ML #startup",
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        likes: 42,
        comments: 15
      }
    ];

    return dummyPosts.slice(from, to + 1);
  };

  const loadBlogs = async () => {
    try {
      // Try to fetch from blogs table, fallback to dummy data
      let { data, error } = await supabase
        .from("blogs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.log("Blogs table not found, using dummy data");
        data = [
          { id: 1, title: 'OpenAI to launch first India office', created_at: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(), readers: 66137 },
          { id: 2, title: 'Benefits or pay — what matters more?', created_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(), readers: 2992 },
          { id: 3, title: 'AI-focused upskilling surges', created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), readers: 423 },
          { id: 4, title: 'Real estate eyes bumper sales', created_at: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(), readers: 258 },
          { id: 5, title: 'Global beauty brands bet on India', created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), readers: 223 }
        ];
      }

      setBlogs(data || []);
    } catch (error) {
      console.error("Error loading blogs:", error);
      setBlogs([
        { id: 1, title: 'OpenAI to launch first India office', created_at: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(), readers: 66137 },
        { id: 2, title: 'Benefits or pay — what matters more?', created_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(), readers: 2992 },
        { id: 3, title: 'AI-focused upskilling surges', created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), readers: 423 },
        { id: 4, title: 'Real estate eyes bumper sales', created_at: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(), readers: 258 },
        { id: 5, title: 'Global beauty brands bet on India', created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), readers: 223 }
      ]);
    }
  };

  const loadUpcomingEvents = () => {
    // Dummy upcoming events
    setUpcomingEvents([
      { id: 1, title: 'Tech Meetup', date: '2024-01-15', time: '6:00 PM' },
      { id: 2, title: 'Project Deadline', date: '2024-01-18', time: '11:59 PM' },
      { id: 3, title: 'Client Meeting', date: '2024-01-20', time: '2:00 PM' },
      { id: 4, title: 'Code Review', date: '2024-01-22', time: '10:00 AM' }
    ]);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadPosts(currentPage + 1);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return '1d ago';
    return date.toLocaleDateString();
  };

  const formatReaders = (readers) => {
    if (readers >= 1000) {
      return `${(readers / 1000).toFixed(0)}k`;
    }
    return readers.toString();
  };

  return (
    <div className="min-h-screen bg-[#0E0E12]">
      {/* Mobile Header */}
      <div className="lg:hidden bg-[#0E0E12] px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">LinkedIn</h1>
          <div className="flex items-center space-x-3">
            <button className="p-2 hover:bg-purple-800 rounded-full">
              <Search className="w-5 h-5 text-gray-300" />
            </button>
            <button className="p-2 hover:bg-purple-800 rounded-full">
              <Bell className="w-5 h-5 text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr_250px] xl:grid-cols-[300px_1fr_300px] gap-4 lg:gap-6 max-w-7xl mx-auto px-4 py-6">

        {/* Left Sidebar - Fixed */}
        <div className="hidden lg:block">
          <div className="sticky top-6 space-y-6">
            {/* Profile Card */}
            <div className="bg-[#3E3E55]/50 rounded-xl shadow-sm border border-[#3E3E55] overflow-hidden">
              {/* Cover Photo */}
              <div className="h-20 bg-[#000]/40"></div>
              
              {/* Profile Info */}
              <div className="relative px-6 pb-6">
                <div className="flex justify-center -mt-8 mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center border-4 border-purple-950">
                    <span className="text-white text-2xl font-bold">R</span>
                  </div>
                </div>
                
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <h2 className="text-lg font-semibold text-white">Rohit Soneji</h2>
                    <CheckCircle className="w-5 h-5 text-purple-400" />
                  </div>
                  <p className="text-gray-300 text-sm">Student at Vidyalankar Institute of Technology, Mumbai</p>
                  <p className="text-gray-400 text-sm">Mumbai, Maharashtra</p>
                </div>

                {/* Institution */}
                <div className="border-t border-[#3E3E55] pt-4 mb-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-6 h-6 bg-[#3E3E55] rounded"></div>
                    <span className="text-sm font-medium text-white">Vidyalankar Institute of Technology, Mumbai</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="border-t border-[#3E3E55] pt-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-400">Profile views</p>
                      <p className="text-lg font-semibold text-white">245</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Post impressions</p>
                      <p className="text-lg font-semibold text-white">1,234</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="bg-[#3E3E55]/40 rounded-xl shadow-sm border border-[#3E3E55] p-4">
              <nav className="space-y-2">
                <a href="/student/dashboard" className="flex items-center space-x-3 px-3 py-2 text-white bg-purple-800/20 rounded-lg">
                  <Home className="w-5 h-5" />
                  <span>Home</span>
                </a>
                <a href="/student/browse" className="flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-purple-800/20 rounded-lg transition-colors">
                  <Briefcase className="w-5 h-5" />
                  <span>Browse Jobs</span>
                </a>
                <a href="/student/community" className="flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-purple-800/20 rounded-lg transition-colors">
                  <Users className="w-5 h-5" />
                  <span>Community</span>
                </a>
                <a href="/student/profile" className="flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-purple-800/20 rounded-lg transition-colors">
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </a>
                <a href="/student/proposals" className="flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-purple-800/20 rounded-lg transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span>Proposals</span>
                </a>
              </nav>
            </div>

            {/* Logout Button */}
            <div className="bg-[#3E3E55]/40 rounded-xl shadow-sm border border-[#3E3E55] p-4">
              <LogoutButton />
            </div>
          </div>
        </div>

        {/* Middle Section - Scrollable Feed */}
        <div className="space-y-6">
          {/* Create Post */}
          <div className="bg-[#3E3E55]/50 rounded-xl shadow-sm border border-[#3E3E55]/60 p-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-[#3E3E55] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">R</span>
              </div>
              <div className="flex-1">
                <button className="w-full text-left px-4 py-3 bg-[#3E3E55]/50 rounded-xl text-gray-300 transition-colors">
                  Start a post
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#3E3E55]">
              <button className="flex items-center space-x-2 px-4 py-2 hover:bg-purple-800 rounded-lg text-gray-300">
                <Video className="w-5 h-5" />
                <span>Video</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 hover:bg-purple-800 rounded-lg text-gray-300">
                <ImageIcon className="w-5 h-5" />
                <span>Photo</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 hover:bg-purple-800 rounded-lg text-gray-300">
                <Edit3 className="w-5 h-5" />
                <span>Write article</span>
              </button>
            </div>
          </div>

          {/* Posts Feed */}
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-[#3E3E55]/50 rounded-xl shadow-sm border border-[#3E3E55]/60 p-6">
                {/* Post Header */}
                <div className="flex items-start space-x-3 mb-4">
                  <img 
                    src={post.user_avatar} 
                    alt={post.user_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-white">{post.user_name}</h3>
                      {post.isConnection && (
                        <span className="text-xs bg-purple-800 text-purple-200 px-2 py-1 rounded-full">
                          Connection
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{formatDate(post.created_at)}</p>
                  </div>
                  <button className="p-2 hover:bg-purple-800 rounded-full">
                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  <p className="text-gray-300 leading-relaxed">{post.content}</p>
                  {post.image_url && (
                    <img 
                      src={post.image_url} 
                      alt="Post"
                      className="w-full h-64 object-cover rounded-lg mt-4"
                    />
                  )}
                </div>

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-[#3E3E55]">
                  <button className="flex items-center space-x-2 text-gray-400 hover:text-purple-400 transition-colors">
                    <Heart className="w-5 h-5" />
                    <span>{post.likes}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-400 hover:text-purple-400 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    <span>{post.comments}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-400 hover:text-purple-400 transition-colors">
                    <Share2 className="w-5 h-5" />
                    <span>Share</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-400 hover:text-purple-400 transition-colors">
                    <Send className="w-5 h-5" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center">
                <button 
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-6 py-3 bg-purple-950 border border-purple-800 rounded-xl hover:bg-purple-900 transition-colors disabled:opacity-50 text-white"
                >
                  {loading ? 'Loading...' : 'Load More Posts'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Fixed */}
        <div className="hidden lg:block">
          <div className="sticky top-6 space-y-6">
            {/* LinkedIn News */}
            <div className="bg-[#3E3E55]/40 rounded-xl shadow-sm border border-[#3E3E55] p-6">
              <h3 className="text-lg font-semibold text-white mb-4">LinkedIn News</h3>
              <p className="text-sm text-gray-300 mb-4">Top stories</p>
              <div className="space-y-4">
                {blogs.map((blog) => (
                  <div key={blog.id} className="group cursor-pointer">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                          {blog.title}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(blog.created_at)} • {formatReaders(blog.readers)} readers
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <button className="w-full text-left text-sm text-purple-400 font-medium hover:underline">
                  Show more
                </button>
              </div>
            </div>

            {/* Resume Upload */}
            <div>
              <ResumeUpload/>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
