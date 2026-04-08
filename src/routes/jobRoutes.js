import express from "express";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  matchResumeWithJobs,
  getJobMatchesForResume,
  getMatchDetails,
  updateMatchStatus,
  bulkCreateJobs,
} from "../controllers/jobController.js";
import { validateJobRequest } from "../middleware/validation.js";

const router = express.Router();

// All job routes require authentication
router.use(authenticate);

// Job CRUD routes (authenticated users)
router.post("/jobs", validateJobRequest, createJob);
router.get("/jobs", getAllJobs);  // Public read, but authenticated
router.get("/jobs/:id", getJobById);
router.put("/jobs/:id", validateJobRequest, updateJob);
router.delete("/jobs/:id", deleteJob);

// Job matching routes (authenticated users)
router.post("/match", matchResumeWithJobs);
router.get("/resume/:resumeId/matches", getJobMatchesForResume);
router.get("/matches/:matchId", getMatchDetails);
router.patch("/matches/:matchId/status", updateMatchStatus);

// Bulk operations (authenticated users)
router.post("/jobs/bulk", bulkCreateJobs);

export default router;