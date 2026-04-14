import { extractTextFromPDF } from "../services/pdfService.js";
import { analyzeResume } from "../services/aiService.js";
import { ContactExtractor } from "../services/contactExtractor.js";
import Analysis from "../models/Analysis.js";
import fs from "fs/promises";

export const analyzeResumeHandler = async (req, res, next) => {
  const startTime = Date.now();
  let filePath = null;
  
  try {
    console.log("📝 Starting resume analysis...");
    
    // Get file and job description
    filePath = req.file.path;
    const { jobDescription } = req.body;
    
    console.log("📄 Extracting text from PDF...");
    // Extract text from PDF
    const resumeText = await extractTextFromPDF(filePath);
    console.log(`✅ Text extracted: ${resumeText.length} characters`);
    
    // Extract contact information
    console.log("🔍 Extracting contact information...");
    const contactInfo = ContactExtractor.extractAll(resumeText);
    
    console.log("🤖 Sending to AI for analysis...");
    // Analyze with AI
    const analysisResult = await analyzeResume(resumeText, jobDescription);
    
    console.log("💾 Saving to database...");
    // Save to database with contact info
    const analysis = await Analysis.create({
      resumeText: resumeText.substring(0, 5000),
      jobDescription,
      contactInfo, // Save contact information
      result: analysisResult,
      metadata: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        processingTime: Date.now() - startTime,
      },
    });
    
    console.log(`✅ Analysis complete! ID: ${analysis._id}`);
    
    // Return success response with contact info
    res.status(200).json({
      success: true,
      analysisId: analysis._id,
      contactInfo, // Include contact info in response
      ...analysisResult,
      metadata: {
        processingTimeMs: Date.now() - startTime,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Analysis failed:", error);
    next(error);
  } finally {
    // Clean up uploaded file
    if (filePath) {
      try {
        await fs.unlink(filePath);
        console.log("🗑️ Temporary file deleted");
      } catch (unlinkError) {
        console.error("Failed to delete temp file:", unlinkError);
      }
    }
  }
};

export const getAnalyses = async (req, res, next) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    
    const analyses = await Analysis.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select("-resumeText");
    
    const total = await Analysis.countDocuments();
    
    res.status(200).json({
      success: true,
      data: analyses,
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

export const getAnalysisById = async (req, res, next) => {
  try {
    const analysis = await Analysis.findById(req.params.id);
    
    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found" });
    }
    
    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
};

// Search candidates by email or phone
export const searchCandidates = async (req, res, next) => {
  try {
    const { email, phone, name } = req.query;
    
    const query = {};
    if (email) query["contactInfo.email"] = { $regex: email, $options: "i" };
    if (phone) query["contactInfo.phone"] = { $regex: phone };
    if (name) query["contactInfo.name"] = { $regex: name, $options: "i" };
    
    const candidates = await Analysis.find(query)
      .select("contactInfo result.score result.skillsMatched createdAt")
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates,
    });
  } catch (error) {
    next(error);
  }
};

// Get candidate by email
export const getCandidateByEmail = async (req, res, next) => {
  try {
    const { email } = req.params;
    
    const candidate = await Analysis.findOne({ "contactInfo.email": email });
    
    if (!candidate) {
      return res.status(404).json({
        error: "Candidate not found",
        message: `No candidate found with email: ${email}`,
      });
    }
    
    res.status(200).json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
};