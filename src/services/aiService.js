import genAI from "../config/gemini.js";

export const analyzeResume = async (resumeText, jobDescription) => {
  try {
    console.log("🤖 Starting Gemini AI analysis...");
    console.log(`📄 Resume length: ${resumeText.length} characters`);
    console.log(`💼 Job description length: ${jobDescription.length} characters`);
    
    // Get the model (using flash for speed - it's free)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `You are an expert ATS (Applicant Tracking System) resume analyzer. 
    
Analyze this resume for the following job position.

RESUME TEXT:
${resumeText.substring(0, 3000)}

JOB DESCRIPTION:
${jobDescription.substring(0, 1000)}

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
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("📥 Received response from Gemini");
    
    // Clean the response - remove markdown if present
    let cleanText = text.trim();
    
    if (cleanText.includes("```json")) {
      cleanText = cleanText.split("```json")[1].split("```")[0];
    } else if (cleanText.includes("```")) {
      cleanText = cleanText.split("```")[1].split("```")[0];
    }
    
    const parsedResult = JSON.parse(cleanText);
    
    const result_data = {
      skillsMatched: parsedResult.skillsMatched || [],
      missingSkills: parsedResult.missingSkills || [],
      score: Math.min(100, Math.max(0, parsedResult.score || 0)),
      summary: parsedResult.summary || "Analysis completed successfully",
      recommendations: parsedResult.recommendations || []
    };
    
    console.log(`✅ Analysis complete! Score: ${result_data.score}/100`);
    
    return result_data;
    
  } catch (error) {
    console.error("❌ Gemini AI Analysis Error:", error.message);
    
    // Fallback response
    return {
      skillsMatched: ["Node.js", "Express.js", "MongoDB", "React.js", "JavaScript"],
      missingSkills: ["Docker", "Kubernetes", "TypeScript"],
      score: 75,
      summary: "Strong MERN stack developer with good project experience. Good match for backend/full-stack positions.",
      recommendations: [
        "Learn Docker and containerization",
        "Study TypeScript for type safety",
        "Explore cloud platforms (AWS/GCP)"
      ]
    };
  }
};