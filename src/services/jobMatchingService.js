import genAI from "../config/gemini.js";
import Job from "../models/Job.js";
import JobMatch from "../models/JobMatch.js";

export class JobMatchingService {
  /**
   * Match a single resume against multiple jobs
   */
  static async matchResumeWithJobs(resumeText, jobIds = null) {
    try {
      // Get jobs to match against
      let jobs;
      if (jobIds && jobIds.length > 0) {
        jobs = await Job.find({ _id: { $in: jobIds }, isActive: true });
      } else {
        jobs = await Job.find({ isActive: true }).limit(20); // Limit for performance
      }

      if (jobs.length === 0) {
        throw new Error("No active jobs found for matching");
      }

      console.log(`📊 Matching resume against ${jobs.length} jobs...`);

      const matches = [];
      for (const job of jobs) {
        const matchResult = await this.analyzeSingleMatch(resumeText, job);
        matches.push({
          job: job,
          match: matchResult,
        });
        
        // Add delay to avoid rate limiting (1 second between requests)
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Sort by match score descending
      matches.sort((a, b) => b.match.matchScore - a.match.matchScore);

      return matches;
    } catch (error) {
      console.error("Job matching error:", error);
      throw error;
    }
  }

  /**
   * Analyze match between resume and a single job
   */
  static async analyzeSingleMatch(resumeText, job) {
    try {
      console.log(`🤖 Analyzing match for: ${job.title} at ${job.company}`);

      // Try multiple models in order of preference
      const model = await this.getWorkingModel();
      
      const prompt = `You are an expert ATS (Applicant Tracking System) and recruitment specialist. Analyze how well this resume matches the job description.

RESUME:
${resumeText.substring(0, 2500)}

JOB TITLE: ${job.title}
COMPANY: ${job.company}
JOB DESCRIPTION:
${job.description.substring(0, 1500)}

REQUIRED SKILLS:
${job.skills.join(", ") || "Not specified"}

EXPERIENCE LEVEL: ${job.experienceLevel}
EMPLOYMENT TYPE: ${job.employmentType}

Return ONLY a valid JSON object with this exact structure:

{
  "matchScore": 75,
  "skillsMatched": ["skill1", "skill2"],
  "missingSkills": ["skill3", "skill4"],
  "partialSkills": ["skill5"],
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1"],
  "recommendations": ["recommendation1", "recommendation2"],
  "analysis": {
    "summary": "2-3 sentence overview",
    "detailedFeedback": "Paragraph with detailed analysis",
    "interviewQuestions": ["Question1", "Question2"]
  }
}

Guidelines:
- Score from 0-100 (70+ = good fit, 85+ = excellent fit)
- Be specific with technical and soft skills
- Provide actionable recommendations for improvement
- Highlight unique strengths from the resume
- Suggest interview questions based on gaps`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Clean and parse JSON
      let cleanText = text.trim();
      if (cleanText.includes("```json")) {
        cleanText = cleanText.split("```json")[1].split("```")[0];
      } else if (cleanText.includes("```")) {
        cleanText = cleanText.split("```")[1].split("```")[0];
      }

      const parsedResult = JSON.parse(cleanText);

      return {
        matchScore: Math.min(100, Math.max(0, parsedResult.matchScore || 0)),
        skillsMatched: parsedResult.skillsMatched || [],
        missingSkills: parsedResult.missingSkills || [],
        partialSkills: parsedResult.partialSkills || [],
        strengths: parsedResult.strengths || [],
        weaknesses: parsedResult.weaknesses || [],
        recommendations: parsedResult.recommendations || [],
        analysis: {
          summary: parsedResult.analysis?.summary || "Analysis completed",
          detailedFeedback: parsedResult.analysis?.detailedFeedback || "",
          interviewQuestions: parsedResult.analysis?.interviewQuestions || [],
        },
      };
    } catch (error) {
      console.error(`Error matching job ${job.title}:`, error.message);
      return this.getFallbackMatchResult(job);
    }
  }

  /**
   * Get a working Gemini model by trying multiple options
   */
  static async getWorkingModel() {
    const modelCandidates = [
      "gemini-2.0-flash-exp",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-pro",
    ];
    
    for (const modelName of modelCandidates) {
      try {
        console.log(`Attempting to use model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        // Quick test to verify model works
        const testResult = await model.generateContent("test");
        await testResult.response;
        console.log(`✅ Using model: ${modelName}`);
        return model;
      } catch (error) {
        console.log(`Model ${modelName} failed:`, error.message);
      }
    }
    
    throw new Error("No working Gemini models found");
  }

  /**
   * Fallback match result when AI fails
   */
  static getFallbackMatchResult(job) {
    return {
      matchScore: 50,
      skillsMatched: [],
      missingSkills: ["Unable to analyze due to technical issue"],
      partialSkills: [],
      strengths: ["Resume submitted for review"],
      weaknesses: ["Automated analysis temporarily unavailable"],
      recommendations: ["Please try again later or contact support"],
      analysis: {
        summary: "Automated analysis temporarily unavailable",
        detailedFeedback: "Our AI service is currently experiencing issues. Please try again later.",
        interviewQuestions: ["Can you tell us about your relevant experience?"],
      },
    };
  }

  /**
   * Save match results to database
   * UPDATED: Now includes userId to track who created the match
   */
  static async saveMatches(resumeId, matches, userId) {
    const savedMatches = [];
    for (const match of matches) {
      const jobMatch = new JobMatch({
        resumeId: resumeId,
        jobId: match.job._id,
        matchScore: match.match.matchScore,
        skillsMatched: match.match.skillsMatched,
        missingSkills: match.match.missingSkills,
        partialSkills: match.match.partialSkills,
        recommendations: match.match.recommendations,
        strengths: match.match.strengths,
        weaknesses: match.match.weaknesses,
        analysis: match.match.analysis,
        matchedBy: userId,  // ← Track which user created this match
        metadata: {
          processingTime: 0,
          analyzedAt: new Date(),
        },
      });

      await jobMatch.save();
      savedMatches.push(jobMatch);
    }
    return savedMatches;
  }

  /**
   * Get top job matches for a resume
   */
  static async getTopMatches(resumeId, limit = 5) {
    const matches = await JobMatch.find({ resumeId })
      .populate("jobId")
      .populate("matchedBy", "name email")  // ← Include user info
      .sort({ matchScore: -1 })
      .limit(limit);

    return matches;
  }

  /**
   * Rule-based fallback matching (no AI required)
   */
  static fallbackMatch(resumeText, job) {
    console.log(`⚠️ Using fallback matching for ${job.title}`);
    
    // Extract skills from resume
    const resumeLower = resumeText.toLowerCase();
    const matchedSkills = [];
    const missingSkills = [];
    
    // Check each job skill
    for (const skill of job.skills) {
      if (resumeLower.includes(skill.toLowerCase())) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    }
    
    // Calculate score based on matched skills percentage
    const score = job.skills.length > 0 
      ? Math.round((matchedSkills.length / job.skills.length) * 100)
      : 50;
    
    return {
      matchScore: Math.min(100, score),
      skillsMatched: matchedSkills,
      missingSkills: missingSkills,
      partialSkills: [],
      strengths: [
        "Resume submitted for position",
        `${matchedSkills.length} relevant skills identified`
      ],
      weaknesses: missingSkills.length > 0 
        ? [`Missing ${missingSkills.length} key skills`]
        : [],
      recommendations: missingSkills.slice(0, 3).map(skill => 
        `Consider learning ${skill}`
      ),
      analysis: {
        summary: `${matchedSkills.length} out of ${job.skills.length} required skills matched. ${score}% compatibility.`,
        detailedFeedback: `Based on skill matching, the candidate shows ${score}% alignment with the job requirements. ${matchedSkills.length} matching skills found.`,
        interviewQuestions: [
          "Can you describe your experience with the technologies listed in your resume?",
          "What projects have you worked on recently?"
        ]
      }
    };
  }
}