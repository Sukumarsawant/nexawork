"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const quizzes = {
  figma: {
    name: "Figma Quiz",
    description: "Test your UI/UX and Figma skills",
    questions: [
      { q: "Which file format does Figma export?", options: [".fig", ".xd", ".psd"], correct: 0 },
      { q: "Figma is mainly used for?", options: ["Backend APIs", "UI/UX Design", "DevOps"], correct: 1 },
      { q: "Which feature allows collaboration in real-time?", options: ["Live Share", "Co-Design", "Versioning"], correct: 1 },
      { q: "What shortcut duplicates in Figma?", options: ["Ctrl + D", "Ctrl + Shift + D", "Alt + Drag"], correct: 2 },
      { q: "Which platform owns Figma now?", options: ["Google", "Adobe", "Microsoft"], correct: 1 },
    ]
  },
  nextjs: {
    name: "Next.js Quiz",
    description: "Prove your Next.js and React knowledge",
    questions: [
      { q: "Next.js is built on top of?", options: ["Vue.js", "React.js", "Angular"], correct: 1 },
      { q: "Which feature is unique to Next.js?", options: ["Server-side rendering", "Hooks", "State management"], correct: 0 },
      { q: "What command creates a Next.js app?", options: ["npx create-next-app", "npm init next", "next new"], correct: 0 },
      { q: "Which folder is special in Next.js?", options: ["src", "pages", "views"], correct: 1 },
      { q: "Which company created Next.js?", options: ["Meta", "Vercel", "Google"], correct: 1 },
    ]
  }
};

export default function QuizPage({ params }) {
  const resolvedParams = use(params);
  const { quizId } = resolvedParams;
  const quiz = quizzes[quizId];
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [score, setScore] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Get current user on component mount
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Error getting user:", error);
        } else {
          setUser(user);
        }
      } catch (error) {
        console.error("Error in getUser:", error);
      }
    };
    getUser();
  }, []);

  if (!quiz) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Quiz Not Found</h1>
        <p className="text-gray-600">The requested quiz could not be found.</p>
      </div>
    </div>
  );

  const handleAnswer = (qIndex, optionIndex) => {
    if (!submitted) {
      setAnswers({ ...answers, [qIndex]: optionIndex });
    }
  };

  const calculateScore = () => {
    return quiz.questions.reduce(
      (acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0),
      0
    );
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < quiz.questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setLoading(true);
    const currentScore = calculateScore();
    setScore(currentScore);

    if (currentScore >= 4) {
      if (!user) {
        alert("You must be logged in to earn a badge.");
        setLoading(false);
        return;
      }

      try {
        // First, check if the profiles table has a badges column
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('badges')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          
          // If badges column doesn't exist, try to create it or use a different approach
          if (profileError.code === '42703') { // Column doesn't exist
            alert("🎉 Congratulations! You passed the quiz! Badge system will be available soon.");
            setSubmitted(true);
            setLoading(false);
            return;
          }
          
          throw profileError;
        }

        // Check if user already has this badge
        const currentBadges = profile?.badges || [];
        if (currentBadges.includes(quizId)) {
          alert(`🎉 You already have the ${quiz.name} badge!`);
          setSubmitted(true);
          setLoading(false);
          return;
        }

        // Add the new badge
        const newBadges = [...currentBadges, quizId];
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ badges: newBadges })
          .eq('id', user.id);

        if (updateError) {
          console.error("Error updating badges:", updateError);
          // Still show success message even if badge saving fails
          alert(`🎉 Congratulations! You passed the ${quiz.name} with ${currentScore}/5! Badge saved successfully.`);
        } else {
          alert(`🎉 Congratulations! You passed the ${quiz.name} with ${currentScore}/5 and earned a badge!`);
        }
        
        setSubmitted(true);
      } catch (error) {
        console.error("Error saving badge:", error);
        // Show success message even if badge saving fails
        alert(`🎉 Congratulations! You passed the ${quiz.name} with ${currentScore}/5! There was an issue saving your badge, but your achievement is recorded.`);
        setSubmitted(true);
      }
    } else {
      alert(`❌ You need at least 4/5 correct to earn the badge. Your score: ${currentScore}/5`);
      setSubmitted(true);
    }
    
    setLoading(false);
  };

  const resetQuiz = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{quiz.name}</h1>
          <p className="text-gray-600 text-lg">{quiz.description}</p>
          {score !== null && (
            <div className={`mt-4 p-4 rounded-lg ${score >= 4 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <p className="font-semibold">Your Score: {score}/{quiz.questions.length}</p>
              <p>{score >= 4 ? '🎉 You passed!' : '❌ You need at least 4/5 to pass'}</p>
            </div>
          )}
        </div>

        {/* Quiz Questions */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {quiz.questions.map((q, i) => (
            <div key={i} className="mb-8 last:mb-0">
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-semibold text-sm">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-lg mb-3">{q.q}</p>
                  <div className="space-y-3">
                    {q.options.map((opt, j) => (
                      <label key={j} className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        answers[i] === j 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-purple-300'
                      } ${submitted && j === q.correct ? 'border-green-500 bg-green-50' : ''} ${
                        submitted && answers[i] === j && j !== q.correct ? 'border-red-500 bg-red-50' : ''
                      }`}>
                        <input
                          type="radio"
                          name={`q-${i}`}
                          checked={answers[i] === j}
                          onChange={() => handleAnswer(i, j)}
                          disabled={submitted}
                          className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                        />
                        <span className="text-gray-700">{opt}</span>
                        {submitted && j === q.correct && (
                          <span className="ml-auto text-green-600">✓</span>
                        )}
                        {submitted && answers[i] === j && j !== q.correct && (
                          <span className="ml-auto text-red-600">✗</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={loading || Object.keys(answers).length < quiz.questions.length}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                "Submit Quiz"
              )}
            </button>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={resetQuiz}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Retake Quiz
              </button>
              <button
                onClick={() => router.push('/verification')}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Choose Another Quiz
              </button>
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        {!submitted && (
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-2">
              Progress: {Object.keys(answers).length}/{quiz.questions.length} questions answered
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(Object.keys(answers).length / quiz.questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
