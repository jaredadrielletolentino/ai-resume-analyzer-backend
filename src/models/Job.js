import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    requirements: [String],
    location: {
      type: String,
      default: "Remote",
    },
    salary: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: "USD",
      },
    },
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Remote", "Hybrid"],
      default: "Full-time",
    },
    experienceLevel: {
      type: String,
      enum: ["Entry", "Junior", "Mid-Level", "Senior", "Lead"],
      default: "Junior",
    },
    skills: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
    metadata: {
      postedBy: String,
      postedDate: {
        type: Date,
        default: Date.now,
      },
      source: String, // e.g., "manual", "api", "csv"
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
jobSchema.index({ title: "text", description: "text", company: "text" });
jobSchema.index({ isActive: 1, createdAt: -1 });
jobSchema.index({ experienceLevel: 1, employmentType: 1 });

export default mongoose.model("Job", jobSchema);