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

// Validate job creation/update request
export const validateJobRequest = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Job title is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Job title must be between 3 and 100 characters"),
  
  body("company")
    .trim()
    .notEmpty()
    .withMessage("Company name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Company name must be between 2 and 100 characters"),
  
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Job description is required")
    .isLength({ min: 50, max: 5000 })
    .withMessage("Job description must be between 50 and 5000 characters"),
  
  body("location")
    .optional()
    .trim()
    .isLength({ max: 100 }),
  
  body("experienceLevel")
    .optional()
    .isIn(["Entry", "Junior", "Mid-Level", "Senior", "Lead"])
    .withMessage("Invalid experience level"),
  
  body("employmentType")
    .optional()
    .isIn(["Full-time", "Part-time", "Contract", "Remote", "Hybrid"])
    .withMessage("Invalid employment type"),
  
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

// Validate login
export const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email"),
  
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  
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

// Validate user registration
export const validateRegistration = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email"),
  
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  
  body("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("Role must be either 'user' or 'admin'"),
  
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