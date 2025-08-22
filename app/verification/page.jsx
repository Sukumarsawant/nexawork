// app/verification/page.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Award, Clock, CheckCircle, BookOpen, Target, Users } from "lucide-react";
import { useRouter } from "next/navigation";


const quizzes = [
  { 
    id: "figma", 
    name: "Figma Design Quiz", 
    desc: "Test your UI/UX and Figma skills",
    icon: "🎨",
    difficulty: "Intermediate",
    timeEstimate: "10-15 min",
    questions: 5,
    passingScore: 4
  },
  { 
    id: "nextjs", 
    name: "Next.js Quiz", 
    desc: "Prove your Next.js and React knowledge",
    icon: "⚡",
    difficulty: "Advanced",
    timeEstimate: "15-20 min",
    questions: 5,
    passingScore: 4
  }
];

export default function VerificationPage() {

    const router=useRouter();
  const [user, setUser] = useState(null);
  const [userBadges, setUserBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Get user's badges
        const { data: profile } = await supabase
          .from('profiles')
          .select('badges')
          .eq('id', user.id)
          .single();
        
        setUserBadges(profile?.badges || []);
      }
      setLoading(false);
    };
    getUser();
  }, []);

  const getQuizStatus = (quizId) => {
    if (!user) return 'not-logged-in';
    if (userBadges.includes(quizId)) return 'completed';
    return 'available';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'not-logged-in': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completed ✓';
      case 'not-logged-in': return 'Login Required';
      default: return 'Available';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <button
        onClick={()=>router.push('/student/profile')}
        >Back to Profile</button>
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full mb-6">
            <Award className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Skill Verification
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Prove your expertise and earn verified badges to showcase your skills to potential employers and clients
          </p>
          
          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-8">
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-5 h-5" />
              <span>{user ? 'Personalized' : 'Public'} Quizzes</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <CheckCircle className="w-5 h-5" />
              <span>{userBadges.length} Badges Earned</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Target className="w-5 h-5" />
              <span>Industry Standard</span>
            </div>
          </div>
        </div>

        {/* Quiz Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {quizzes.map((quiz) => {
            const status = getQuizStatus(quiz.id);
            const isCompleted = status === 'completed';
            const isAvailable = status === 'available';
            
            return (
              <div key={quiz.id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                {/* Quiz Header */}
                <div className="p-8 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{quiz.icon}</div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{quiz.name}</h2>
                        <p className="text-gray-600 leading-relaxed">{quiz.desc}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(status)}`}>
                      {getStatusText(status)}
                    </div>
                  </div>

                  {/* Quiz Details */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BookOpen className="w-4 h-4" />
                      <span>{quiz.questions} Questions</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{quiz.timeEstimate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Target className="w-4 h-4" />
                      <span>{quiz.difficulty}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>{quiz.passingScore}/{quiz.questions} to pass</span>
                    </div>
                  </div>
                </div>

                {/* Quiz Actions */}
                <div className="p-8">
                  {isCompleted ? (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-green-800 mb-2">Quiz Completed!</h3>
                      <p className="text-green-600 mb-4">You've earned the {quiz.name} badge</p>
                      <button
                        onClick={() => window.location.href = `/verification/${quiz.id}`}
                        className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Review Quiz
                      </button>
                    </div>
                  ) : isAvailable ? (
                    <Link href={`/verification/${quiz.id}`}>
                      <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl">
                        Start Quiz
                      </button>
                    </Link>
                  ) : (
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">Please log in to take this quiz</p>
                      <Link href="/login">
                        <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
                          Login
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Why Get Verified?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Earn Badges</h3>
              <p className="text-gray-600">Get recognized for your skills with verifiable badges</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Stand Out</h3>
              <p className="text-gray-600">Differentiate yourself from other candidates</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Build Trust</h3>
              <p className="text-gray-600">Show employers your verified expertise</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        {!user && (
          <div className="text-center">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Ready to Prove Your Skills?</h2>
              <p className="text-lg mb-6 opacity-90">
                Create an account and start earning verified badges today
              </p>
              <Link href="/login">
                <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
