-- Quiz Results Table Setup for Supabase
-- This table stores all quiz attempts and results

-- Create quiz_results table
CREATE TABLE IF NOT EXISTS quiz_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    answers JSONB NOT NULL,
    passed BOOLEAN NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz_id ON quiz_results(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_passed ON quiz_results(passed);

-- Enable Row Level Security (RLS)
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own quiz results
CREATE POLICY "Users can view own quiz results" ON quiz_results
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own quiz results
CREATE POLICY "Users can insert own quiz results" ON quiz_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own quiz results
CREATE POLICY "Users can update own quiz results" ON quiz_results
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own quiz results
CREATE POLICY "Users can delete own quiz results" ON quiz_results
    FOR DELETE USING (auth.uid() = user_id);

-- Create a view for quiz statistics
CREATE OR REPLACE VIEW quiz_statistics AS
SELECT 
    user_id,
    quiz_id,
    COUNT(*) as total_attempts,
    COUNT(*) FILTER (WHERE passed = true) as successful_attempts,
    MAX(score) as best_score,
    AVG(score) as average_score,
    MIN(completed_at) as first_attempt,
    MAX(completed_at) as last_attempt
FROM quiz_results
GROUP BY user_id, quiz_id;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON quiz_results TO authenticated;
GRANT SELECT ON quiz_statistics TO authenticated;

-- Insert sample quiz data (optional)
INSERT INTO quiz_results (user_id, quiz_id, score, total_questions, answers, passed, completed_at)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'figma', 4, 5, '{"0": 0, "1": 1, "2": 1, "3": 2, "4": 1}', true, NOW() - INTERVAL '1 day'),
    ('00000000-0000-0000-0000-000000000001', 'nextjs', 5, 5, '{"0": 1, "1": 0, "2": 0, "3": 1, "4": 1}', true, NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;
