import express from "express";
import {
  registerUser,
  login,
  getCurrentUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  changePassword,
  getUserStats,
  updateProfile,
  toggleUserStatus,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/roleCheck.js";

const router = express.Router();

// Public routes
router.post("/login", login);

// Protected routes (require authentication)
router.use(authenticate);

// User self-service
router.get("/me", getCurrentUser);
router.put("/profile", updateProfile);
router.post("/change-password", changePassword);

// Admin only routes
router.post("/register", requireAdmin, registerUser);
router.get("/users", requireAdmin, getAllUsers);
router.get("/users/stats", requireAdmin, getUserStats);
router.get("/users/:id", requireAdmin, getUserById);
router.put("/users/:id", requireAdmin, updateUser);
router.delete("/users/:id", requireAdmin, deleteUser);
router.patch("/users/:id/toggle", requireAdmin, toggleUserStatus);

export default router;