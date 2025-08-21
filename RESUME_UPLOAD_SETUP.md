# Resume Upload Setup Guide

## Current Status
The resume upload functionality is now working with a simplified version that supports text (.txt) files only. This provides basic resume analysis without requiring external AI services.

## Features
- ✅ Text file upload (.txt only)
- ✅ Drag & drop interface
- ✅ Basic skills matching analysis
- ✅ Score calculation
- ✅ Improvement suggestions
- ✅ Modern UI with loading states

## How to Use
1. Navigate to the student dashboard
2. Find the "Resume Analyzer" section
3. Paste a job description in the text area
4. Upload your resume as a .txt file
5. Click "Analyze Resume" to get insights

## To Enable Full AI-Powered Analysis

If you want to enable AI-powered resume analysis with PDF/DOCX support, follow these steps:

### 1. Install Required Packages
```bash
npm install pdf-parse mammoth openai
```

### 2. Set Up Environment Variables
Create a `.env.local` file in your project root:
```env
# OpenAI API Key (for AI analysis)
OPENAI_API_KEY=your_openai_api_key_here

# Alternative: Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Update the API Route
Replace the content in `app/api/uploadResume/route.js` with the full AI-powered version:

```javascript
import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import OpenAI from 'openai';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('resume');
    const jobDescription = formData.get('jobDescription');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!jobDescription) {
      return NextResponse.json({ error: 'Job description is required' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let resumeText = "";

    // Parse based on file type
    if (file.type === "application/pdf") {
      const parsed = await pdfParse(buffer);
      resumeText = parsed.text;
    } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const parsed = await mammoth.extractRawText({ buffer });
      resumeText = parsed.value;
    } else if (file.type === "text/plain") {
      resumeText = buffer.toString('utf-8');
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Please upload PDF, DOCX, or TXT files.' }, { status: 400 });
    }

    if (!resumeText.trim()) {
      return NextResponse.json({ error: 'Could not extract text from the uploaded file' }, { status: 400 });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY 
    });

    const prompt = `
Job Description: ${jobDescription}

Candidate Resume: ${resumeText}

Analyze the resume against the job description and provide a comprehensive assessment. Return a JSON response with the following structure:

{
  "score": <number between 0-100 representing overall match>,
  "missing_skills": [<array of skills mentioned in job description but not found in resume>],
  "improvement_suggestions": [<array of specific suggestions to improve the resume>],
  "strengths": [<array of strengths found in the resume>],
  "match_percentage": <number between 0-100 for skills match>
}

Please be specific and actionable in your suggestions.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Resume upload error:', error);
    
    if (error.message.includes('JSON')) {
      return NextResponse.json({ 
        error: 'Failed to parse AI response. Please try again.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to process resume. Please check your file and try again.' 
    }, { status: 500 });
  }
}
```

### 4. Update the Component
Update the file validation in `component/ResumeUpload.jsx` to accept PDF and DOCX files:

```javascript
const validTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
];
```

And update the file input accept attribute:
```javascript
accept=".pdf,.docx,.txt"
```

## Troubleshooting

### Network/SSL Issues
If you encounter SSL errors when installing packages, try:
```bash
npm config set registry https://registry.npmjs.org/
npm install --legacy-peer-deps pdf-parse mammoth openai
```

### API Key Issues
- Make sure your OpenAI API key is valid and has sufficient credits
- Check that the environment variable is properly set
- Restart your development server after adding environment variables

### File Upload Issues
- Ensure files are not corrupted
- Check file size limits (5MB for text, 10MB for PDF/DOCX)
- Verify file types are supported

## Current Limitations
- Only supports .txt files in the basic version
- Basic skills matching without AI analysis
- Limited skill database

## Future Enhancements
- PDF and DOCX support
- AI-powered analysis
- More comprehensive skill matching
- Resume optimization suggestions
- Integration with job boards
