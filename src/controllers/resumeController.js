import { extractTextFromPDF } from "../services/pdfService.js";
import { analyzeResume } from "../services/aiService.js";
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
    
    console.log("🤖 Sending to AI for analysis...");
    // Analyze with AI
    const analysisResult = await analyzeResume(resumeText, jobDescription);
    
    console.log("💾 Saving to database...");
    // Save to database
    const analysis = await Analysis.create({
      resumeText: resumeText.substring(0, 5000),
      jobDescription,
      result: analysisResult,
      metadata: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        processingTime: Date.now() - startTime,
      },
    });
    
    console.log(`✅ Analysis complete! ID: ${analysis._id}`);
    
    // Return success response
    res.status(200).json({
      success: true,
      analysisId: analysis._id,
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