-- Add badges column to profiles table
-- This script adds a badges column to store quiz completion badges

-- Check if badges column exists, if not add it
DO $$ 
BEGIN
    -- Check if the badges column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'badges'
    ) THEN
        -- Add the badges column as an array of text
        ALTER TABLE profiles ADD COLUMN badges TEXT[] DEFAULT '{}';
        
        -- Add a comment to describe the column
        COMMENT ON COLUMN profiles.badges IS 'Array of quiz badges earned by the user';
        
        RAISE NOTICE 'Added badges column to profiles table';
    ELSE
        RAISE NOTICE 'Badges column already exists in profiles table';
    END IF;
END $$;

-- Create an index on the badges column for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_badges ON profiles USING GIN (badges);

-- Grant necessary permissions
GRANT SELECT, UPDATE ON profiles TO authenticated;

-- Update existing profiles to have an empty badges array if they don't have one
UPDATE profiles 
SET badges = '{}' 
WHERE badges IS NULL;

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'badges';
