import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
  {
    resumeText: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    jobDescription: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    result: {
      skillsMatched: {
        type: [String],
        default: []
      },
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      summary: {
        type: String,
        default: ""
      },
      missingSkills: {
        type: [String],
        default: []
      },
      recommendations: {
        type: [String],
        default: []
      },
    },
    metadata: {
      fileName: String,
      fileSize: Number,
      processingTime: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient queries
analysisSchema.index({ createdAt: -1 });
analysisSchema.index({ "result.score": -1 });

export default mongoose.model("Analysis", analysisSchema);