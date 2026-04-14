import express from "express";
import upload from "../middleware/fileUpload.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import { 
  validateFileUpload, 
  validateAnalysisRequest 
} from "../middleware/validation.js";
import { 
  analyzeResumeHandler, 
  getAnalyses, 
  getAnalysisById,
  searchCandidates,
  getCandidateByEmail,
} from "../controllers/resumeController.js";

const router = express.Router();

// PUBLIC ROUTES (No authentication required)
// Anyone can upload and analyze a resume
router.post(
  "/analyze",
  upload.single("resume"),
  validateFileUpload,
  validateAnalysisRequest,
  analyzeResumeHandler
);

// PROTECTED ROUTES (Authentication required)
// All routes below this require authentication
router.use(authenticate);

// Get all analyses (authenticated users only)
router.get("/analyses", getAnalyses);

// Get specific analysis by ID (authenticated users only)
router.get("/analyses/:id", getAnalysisById);

// CANDIDATE SEARCH ROUTES (Authenticated users only)
// Search candidates by email, phone, or name
router.get("/candidates/search", searchCandidates);

// Get candidate by email
router.get("/candidates/email/:email", getCandidateByEmail);

export default router;