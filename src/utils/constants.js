export const FILE_CONSTANTS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ["application/pdf"],
  UPLOAD_DIR: "uploads/",
};

export const AI_CONSTANTS = {
  MODEL: "gpt-3.5-turbo",
  MAX_TOKENS: 500,
  TEMPERATURE: 0.3,
  MAX_RESUME_LENGTH: 3000,
  MAX_JOB_LENGTH: 1000,
};

export const API_CONSTANTS = {
  VERSION: "v1",
  BASE_PATH: "/api",
};