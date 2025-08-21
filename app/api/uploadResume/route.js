import { NextRequest, NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('resume') ;
    const jobDescription = formData.get('jobDescription') ;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!jobDescription) {
      return NextResponse.json({ error: 'Job description is required' }, { status: 400 });
    }

    // Only support plain text files for now
    if (file.type !== 'text/plain') {
      return NextResponse.json(
        { error: 'Currently only text (.txt) files are supported. Please convert your resume to a text file.' },
        { status: 400 }
      );
    }

    // Convert file to text
    const bytes = await file.arrayBuffer();
    const resumeText = new TextDecoder().decode(bytes);

    if (!resumeText.trim()) {
      return NextResponse.json({ error: 'Could not extract text from the uploaded file' }, { status: 400 });
    }

    // Perform simple keyword analysis
    const analysis = performSimpleAnalysis(resumeText, jobDescription);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Resume upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process resume. Please check your file and try again.' },
      { status: 500 }
    );
  }
}

function performSimpleAnalysis(resumeText: string, jobDescription: string) {
    const normalizeText = (text: string) =>
      text.toLowerCase().replace(/[^a-z0-9+./ ]/g, " "); // keep words + .js etc.
  
    const resumeTextLower = normalizeText(resumeText);
    const jobTextLower = normalizeText(jobDescription);
  
    const commonSkills = [
      'javascript', 'python', 'java', 'react', 'node.js', 'html', 'css', 'sql', 'mongodb',
      'aws', 'docker', 'kubernetes', 'git', 'agile', 'scrum', 'leadership', 'communication',
      'problem solving', 'teamwork', 'project management', 'ui/ux', 'design', 'marketing',
      'sales', 'customer service', 'data analysis', 'machine learning', 'ai', 'blockchain'
    ];
  
    // ✅ Use regex to match whole words (no partials like "java" in "javascript")
    const hasSkill = (text: string, skill: string) => {
      const pattern = new RegExp(`\\b${skill.replace(/[.+]/g, "\\$&")}\\b`, "i");
      return pattern.test(text);
    };
  
    const foundSkills = commonSkills.filter(skill => hasSkill(resumeTextLower, skill));
    const missingSkills = commonSkills.filter(
      skill => !hasSkill(resumeTextLower, skill) && hasSkill(jobTextLower, skill)
    );
  
    // Score
    const totalRelevant = foundSkills.length + missingSkills.length;
    const score = totalRelevant > 0 ? Math.round((foundSkills.length / totalRelevant) * 100) : 50;
  
    return {
      score,
      match_percentage: score,
      found_skills: foundSkills,
      missing_skills: missingSkills,
      strengths: [
        `Found ${foundSkills.length} relevant skills in your resume`,
        foundSkills.includes("communication")
          ? "Strong communication skills highlighted"
          : "Your resume shows good technical background",
        "Consider highlighting your achievements more"
      ],
      improvement_suggestions: [
        missingSkills.length > 0
          ? `Add experience with: ${missingSkills.join(", ")}`
          : "Your skills match well with the job requirements",
        "Include specific metrics and achievements",
        "Add relevant certifications if applicable",
        "Tailor your resume summary to match the job description"
      ]
    };
  }
  
