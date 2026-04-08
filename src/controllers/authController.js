import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { AuthService } from "../services/authService.js";

/**
 * Register new user (Admin only)
 */
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, metadata } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Name, email, and password are required",
      });
    }
    
    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        error: "Invalid password",
        message: "Password must be at least 6 characters",
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: "Duplicate email",
        message: "User with this email already exists",
      });
    }
    
    // Manually hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user with pre-hashed password
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
      isActive: true,
      metadata: {
        ...metadata,
        createdBy: req.user?.id,
        createdByEmail: req.user?.email,
      },
    });
    
    await user.save();
    
    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: userResponse,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        error: "Duplicate email",
        message: "User with this email already exists",
      });
    }
    next(error);
  }
};

/**
 * Login user
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: "Missing credentials",
        message: "Email and password are required",
      });
    }
    
    // Find user with password field
    const user = await User.findOne({ email }).select("+password");
    
    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Invalid email or password",
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        error: "Account deactivated",
        message: "Please contact administrator",
      });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Invalid email or password",
      });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate token
    const token = AuthService.generateToken(user._id, user.email, user.role);
    
    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users (Admin only)
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const { role, isActive, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === "true";
    
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID (Admin only)
 */
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "No user exists with this ID",
      });
    }
    
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user (Admin only)
 */
export const updateUser = async (req, res, next) => {
  try {
    const { role, isActive, metadata } = req.body;
    const userId = req.params.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "No user exists with this ID",
      });
    }
    
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (metadata) {
      user.metadata = {
        ...user.metadata,
        ...metadata,
        updatedBy: req.user.id,
        updatedByEmail: req.user.email,
        updatedAt: new Date(),
      };
    }
    
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (Admin only)
 */
export const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({
        error: "Cannot delete self",
        message: "You cannot delete your own account",
      });
    }
    
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "No user exists with this ID",
      });
    }
    
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: {
        id: userId,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        error: "Missing passwords",
        message: "Both old and new passwords are required",
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "Invalid password",
        message: "New password must be at least 6 characters",
      });
    }
    
    const user = await User.findById(userId).select("+password");
    
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "User account not found",
      });
    }
    
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid password",
        message: "Current password is incorrect",
      });
    }
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user statistics (Admin only)
 */
export const getUserStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: "admin" });
    const regularUsers = await User.countDocuments({ role: "user" });
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const newUsersLastWeek = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });
    
    res.status(200).json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        roles: {
          admin: adminUsers,
          user: regularUsers,
        },
        recent: {
          last7Days: newUsersLastWeek,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile (self)
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, metadata } = req.body;
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "User account not found",
      });
    }
    
    if (name) user.name = name;
    if (metadata) {
      user.metadata = {
        ...user.metadata,
        ...metadata,
      };
    }
    
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Activate/deactivate user (Admin only)
 */
export const toggleUserStatus = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { isActive } = req.body;
    
    if (isActive === undefined) {
      return res.status(400).json({
        error: "Missing field",
        message: "isActive field is required",
      });
    }
    
    if (userId === req.user.id && !isActive) {
      return res.status(400).json({
        error: "Cannot deactivate self",
        message: "You cannot deactivate your own account",
      });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select("-password");
    
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "No user exists with this ID",
      });
    }
    
    res.status(200).json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};