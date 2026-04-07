import express from "express";
import upload from "../middleware/fileUpload.js";
import { 
  validateFileUpload, 
  validateAnalysisRequest 
} from "../middleware/validation.js";
import { 
  analyzeResumeHandler, 
  getAnalyses, 
  getAnalysisById 
} from "../controllers/resumeController.js";

const router = express.Router();

// POST /api/resume/analyze - Analyze a resume
router.post(
  "/analyze",
  upload.single("resume"),
  validateFileUpload,
  validateAnalysisRequest,
  analyzeResumeHandler
);

// GET /api/resume/analyses - Get all analyses (with pagination)
router.get("/analyses", getAnalyses);

// GET /api/resume/analyses/:id - Get specific analysis
router.get("/analyses/:id", getAnalysisById);

export default router;