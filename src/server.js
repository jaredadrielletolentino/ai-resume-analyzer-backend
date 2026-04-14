import "./config/env.js";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectDB from "./config/database.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import authRoutes from "./routes/authRoutes.js"; 
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Updated Rate limiting - 600 requests per 30 minutes
const limiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 600, // 600 requests per windowMs
  message: { 
    error: "Too many requests", 
    message: "Please try again after 30 minutes" 
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health check endpoint
    return req.path === '/health';
  }
});

app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database
connectDB();

// Routes
app.use("/api/auth", authRoutes);        
app.use("/api/resume", resumeRoutes);     
app.use("/api/jobs", jobRoutes);          

// Health check endpoint (public) - bypasses rate limiting
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`⏱️  Rate limit: 600 requests per 30 minutes`);
});