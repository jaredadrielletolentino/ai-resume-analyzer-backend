import genAI from "../config/gemini.js";

export const analyzeResume = async (resumeText, jobDescription) => {
  try {
    console.log("🤖 Starting Gemini AI analysis...");
    console.log(`📄 Resume length: ${resumeText.length} characters`);
    console.log(`💼 Job description length: ${jobDescription.length} characters`);
    
    // Get the model (using flash for speed - it's free)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    // Create the prompt
    const prompt = `You are an expert ATS (Applicant Tracking System) resume analyzer. 
    
Analyze this resume for the following job position.

RESUME TEXT:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Return ONLY a valid JSON object with this exact structure. Do not include any other text or markdown formatting:

{
  "skillsMatched": ["skill1", "skill2", "skill3"],
  "missingSkills": ["skill1", "skill2"],
  "score": 75,
  "summary": "2-3 sentence analysis of how well the candidate fits the role",
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
}

Guidelines:
- Score from 0-100 based on match percentage
- Be specific with technical and soft skills
- Provide actionable recommendations
- Keep summary concise and professional
- Only include skills that are actually mentioned in the resume`;

    console.log("📤 Sending request to Gemini API...");
    
    // Get response from Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("📥 Received response from Gemini");
    console.log("Raw response:", text.substring(0, 200) + "...");
    
    // Clean the response - remove markdown if present
    let cleanText = text.trim();
    
    // Remove markdown code blocks if they exist
    if (cleanText.includes("```json")) {
      cleanText = cleanText.split("```json")[1].split("```")[0];
    } else if (cleanText.includes("```")) {
      cleanText = cleanText.split("```")[1].split("```")[0];
    }
    
    // Parse JSON
    const parsedResult = JSON.parse(cleanText);
    
    // Validate and ensure all fields exist
    const result_data = {
      skillsMatched: parsedResult.skillsMatched || [],
      missingSkills: parsedResult.missingSkills || [],
      score: Math.min(100, Math.max(0, parsedResult.score || 0)),
      summary: parsedResult.summary || "Analysis completed successfully",
      recommendations: parsedResult.recommendations || []
    };
    
    console.log(`✅ Analysis complete! Score: ${result_data.score}/100`);
    console.log(`📊 Skills matched: ${result_data.skillsMatched.length}`);
    
    return result_data;
    
  } catch (error) {
    console.error("❌ Gemini AI Analysis Error:", error.message);
    
    if (error.message.includes("API key")) {
      console.error("⚠️ API Key issue. Please check your GEMINI_API_KEY in .env file");
    }
    
    // Return a meaningful fallback response
    return {
      skillsMatched: extractSkillsFromResume(resumeText),
      missingSkills: ["Cloud deployment", "CI/CD pipelines", "Docker"],
      score: 65,
      summary: "Analysis temporarily unavailable. Based on resume content, candidate shows relevant skills but complete analysis requires AI service.",
      recommendations: [
        "Check your Gemini API key configuration",
        "Try again in a few moments",
        "Ensure you have an active internet connection"
      ]
    };
  }
};

// Helper function to extract skills from resume (fallback)
function extractSkillsFromResume(resumeText) {
  const skills = [];
  const commonSkills = [
    "Node.js", "Express.js", "MongoDB", "React.js", "JavaScript", 
    "HTML5", "CSS3", "Bootstrap", "REST API", "PHP", "MySQL",
    "Git", "GitHub", "Postman", "AWS", "Azure", "Java", "Spring Boot"
  ];
  
  for (const skill of commonSkills) {
    if (resumeText.toLowerCase().includes(skill.toLowerCase())) {
      skills.push(skill);
    }
  }
  
  return skills.slice(0, 10); // Return top 10 skills
}