import mongoose from "mongoose";

const jobMatchSchema = new mongoose.Schema(
  {
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Analysis",
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    skillsMatched: [String],
    missingSkills: [String],
    partialSkills: [String],
    recommendations: [String],
    strengths: [String],
    weaknesses: [String],
    analysis: {
      summary: String,
      detailedFeedback: String,
      interviewQuestions: [String],
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "shortlisted", "rejected"],
      default: "pending",
    },
    // NEW: Track who created the match
    matchedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    matchedByEmail: String,
    // NEW: Track status updates
    statusUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    statusUpdatedAt: Date,
    statusUpdatedByEmail: String,
    metadata: {
      processingTime: Number,
      analyzedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
jobMatchSchema.index({ resumeId: 1, jobId: 1 }, { unique: true });
jobMatchSchema.index({ matchScore: -1 });
jobMatchSchema.index({ status: 1, createdAt: -1 });
jobMatchSchema.index({ matchedBy: 1 });

export default mongoose.model("JobMatch", jobMatchSchema);