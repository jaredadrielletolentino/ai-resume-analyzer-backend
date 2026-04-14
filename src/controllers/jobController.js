import Job from "../models/Job.js";
import JobMatch from "../models/JobMatch.js";
import { JobMatchingService } from "../services/jobMatchingService.js";
import Analysis from "../models/Analysis.js";

// Only authenticated users can create jobs
export const createJob = async (req, res, next) => {
  try {
    const jobData = req.body;
    
    // Add created by info
    jobData.metadata = {
      ...jobData.metadata,
      createdBy: req.user.id,
      createdByEmail: req.user.email,
      createdByRole: req.user.role,
    };
    
    // Process skills from description if not provided
    if (!jobData.skills && jobData.description) {
      const commonSkills = [
        "JavaScript", "Python", "Java", "Node.js", "React", "Angular",
        "MongoDB", "SQL", "AWS", "Docker", "Kubernetes", "Git"
      ];
      jobData.skills = commonSkills.filter(skill => 
        jobData.description.toLowerCase().includes(skill.toLowerCase())
      );
    }

    const job = new Job(jobData);
    await job.save();

    res.status(201).json({
      success: true,
      data: job,
      message: "Job created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getAllJobs = async (req, res, next) => {
  try {
    const { page = 1, limit = 100, active = true, experienceLevel, employmentType } = req.query;

    const query = { isActive: active === "true" };
    if (experienceLevel) query.experienceLevel = experienceLevel;
    if (employmentType) query.employmentType = employmentType;

    console.log(`📊 Fetching jobs with query:`, query); // Debug log

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Job.countDocuments(query);

    console.log(`✅ Found ${jobs.length} active jobs out of ${total} total`); // Debug log

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.status(200).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
};

// updateJob - Only authenticated users can update
export const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    // Add updated by info
    req.body.metadata = {
      ...job.metadata,
      updatedBy: req.user.id,
      updatedByEmail: req.user.email,
      updatedAt: new Date(),
    };
    
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({ 
      success: true, 
      data: updatedJob,
      message: "Job updated successfully"
    });
  } catch (error) {
    next(error);
  }
};

// deleteJob - Only authenticated users can delete
export const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.status(200).json({ 
      success: true, 
      message: "Job deleted successfully" 
    });
  } catch (error) {
    next(error);
  }
};

// matchResumeWithJobs - Only authenticated users can match
export const matchResumeWithJobs = async (req, res, next) => {
  const startTime = Date.now();
  try {
    const { resumeId, jobIds } = req.body;

    if (!resumeId) {
      return res.status(400).json({ error: "resumeId is required" });
    }

    // Get resume text from database (public - anyone can view submitted resumes)
    const analysis = await Analysis.findById(resumeId);
    if (!analysis) {
      return res.status(404).json({ error: "Resume analysis not found" });
    }

    console.log(`🔍 User ${req.user.email} (${req.user.role}) matching resume: ${resumeId}`);

    // Perform matching
    const matches = await JobMatchingService.matchResumeWithJobs(
      analysis.resumeText,
      jobIds
    );

    // Save matches to database with user info
    const savedMatches = await JobMatchingService.saveMatches(resumeId, matches, req.user.id);

    res.status(200).json({
      success: true,
      totalJobsMatched: matches.length,
      matchedBy: req.user.email,
      topMatches: matches.slice(0, 5).map(m => ({
        jobTitle: m.job.title,
        company: m.job.company,
        matchScore: m.match.matchScore,
        matchPercentage: `${Math.round(m.match.matchScore)}%`,
        skillsMatched: m.match.skillsMatched,
        missingSkills: m.match.missingSkills,
        summary: m.match.analysis.summary,
      })),
      allMatches: matches,
      metadata: {
        processingTimeMs: Date.now() - startTime,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// getJobMatchesForResume - Only authenticated users can view matches
export const getJobMatchesForResume = async (req, res, next) => {
  try {
    const { resumeId } = req.params;
    const { limit = 10, minScore = 0 } = req.query;

    const matches = await JobMatch.find({
      resumeId,
      matchScore: { $gte: parseInt(minScore) },
    })
      .populate("jobId")
      .populate("matchedBy", "name email") // Show who matched
      .sort({ matchScore: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: matches.length,
      data: matches,
    });
  } catch (error) {
    next(error);
  }
};

// getMatchDetails - Only authenticated users can view
export const getMatchDetails = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const match = await JobMatch.findById(matchId)
      .populate("resumeId")
      .populate("jobId")
      .populate("matchedBy", "name email");

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    res.status(200).json({ success: true, data: match });
  } catch (error) {
    next(error);
  }
};

// updateMatchStatus - Only authenticated users can update status
export const updateMatchStatus = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { status } = req.body;

    const match = await JobMatch.findByIdAndUpdate(
      matchId,
      { 
        status,
        statusUpdatedBy: req.user.id,
        statusUpdatedAt: new Date(),
        statusUpdatedByEmail: req.user.email,
      },
      { new: true }
    );

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    res.status(200).json({
      success: true,
      data: match,
      message: `Match status updated to ${status} by ${req.user.email}`,
    });
  } catch (error) {
    next(error);
  }
};


// bulkCreateJobs - Only authenticated users can bulk create
export const bulkCreateJobs = async (req, res, next) => {
  try {
    const { jobs } = req.body;
    
    if (!jobs || !Array.isArray(jobs)) {
      return res.status(400).json({ error: "jobs array is required" });
    }

    const createdJobs = [];
    for (const jobData of jobs) {
      jobData.metadata = {
        ...jobData.metadata,
        createdBy: req.user.id,
        createdByEmail: req.user.email,
      };
      const job = new Job(jobData);
      await job.save();
      createdJobs.push(job);
    }

    res.status(201).json({
      success: true,
      count: createdJobs.length,
      data: createdJobs,
    });
  } catch (error) {
    next(error);
  }
};