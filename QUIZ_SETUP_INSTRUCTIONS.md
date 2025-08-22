# Quiz System Setup Instructions

## Overview
The quiz system allows users to take skill verification quizzes and earn badges. The system has been fixed to handle errors gracefully and work with or without the badges column.

## Files Fixed
1. **`app/verification/[quizId]/page.jsx`** - Fixed Next.js params warning and improved error handling
2. **`app/verification/page.jsx`** - Enhanced verification main page
3. **`database/add_badges_column.sql`** - SQL script to add badges column
4. **`database/business_tables.sql`** - Business functionality tables

## Setup Steps

### 1. Run the Badges Column Script
Execute this SQL in your Supabase SQL editor:
```sql
-- Copy and paste the contents of database/add_badges_column.sql
```

### 2. Run Business Tables Script (Optional)
If you want the business functionality:
```sql
-- Copy and paste the contents of database/business_tables.sql
```

### 3. Test the Quiz System
1. Navigate to `/verification` to see available quizzes
2. Click on a quiz to take it
3. Answer all questions and submit
4. If you score 4/5 or higher, you'll earn a badge

## How It Works

### Quiz Flow
1. User selects a quiz from the verification page
2. User answers 5 questions
3. System calculates score
4. If score ≥ 4/5, user earns a badge
5. Badge is saved to their profile

### Error Handling
- If the badges column doesn't exist, the quiz still works
- If badge saving fails, user still gets credit for passing
- All errors are logged to console for debugging

### Badge Storage
- Badges are stored as a TEXT array in the profiles table
- Each badge is identified by quiz ID (e.g., "figma", "nextjs")
- Duplicate badges are prevented

## Available Quizzes
1. **Figma Quiz** - UI/UX and Figma skills
2. **Next.js Quiz** - Next.js and React knowledge

## Troubleshooting

### Common Issues
1. **"An error occurred while saving your results"**
   - Check if the badges column exists in profiles table
   - Run the `add_badges_column.sql` script

2. **Quiz not loading**
   - Check browser console for errors
   - Verify Supabase connection

3. **Badge not saving**
   - Check Supabase RLS policies
   - Verify user authentication

### Debug Steps
1. Check browser console for error messages
2. Check Supabase logs for database errors
3. Verify table structure in Supabase dashboard
4. Test with a simple quiz submission

## Features
- ✅ Professional UI design
- ✅ Progress tracking
- ✅ Score calculation
- ✅ Badge system
- ✅ Error handling
- ✅ Responsive design
- ✅ Next.js 14 compatibility

## Future Enhancements
- More quiz categories
- Quiz analytics
- Leaderboards
- Certificate generation
- Social sharing
