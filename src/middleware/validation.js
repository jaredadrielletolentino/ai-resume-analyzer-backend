import { body, validationResult } from "express-validator";

// Validate resume analysis request
export const validateAnalysisRequest = [
  body("jobDescription")
    .trim()
    .notEmpty()
    .withMessage("Job description is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Job description must be between 10 and 2000 characters"),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }
    next();
  },
];

// Validate file upload
export const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: "Resume file is required" });
  }
  
  if (req.file.mimetype !== "application/pdf") {
    return res.status(400).json({ error: "Only PDF files are allowed" });
  }
  
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;
  if (req.file.size > maxSize) {
    return res.status(400).json({ 
      error: `File too large. Max size is ${maxSize / (1024 * 1024)}MB` 
    });
  }
  
  next();
};