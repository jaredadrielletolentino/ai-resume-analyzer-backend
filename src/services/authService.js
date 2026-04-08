import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this";
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";

export class AuthService {
  static generateToken(userId, email, role) {
    return jwt.sign(
      { id: userId, email: email, role: role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  static async loginUser(email, password) {
    // Find user with password field included
    const user = await User.findOne({ email }).select("+password");
    
    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (!user.isActive) {
      throw new Error("Account is deactivated. Please contact admin.");
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = this.generateToken(user._id, user.email, user.role);

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    return {
      user: userResponse,
      token,
    };
  }

  static async getUserById(userId) {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  static async getAllUsers(filters = {}) {
    const { role, isActive, page = 1, limit = 50 } = filters;
    
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === "true";
    
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    return {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    };
  }

  static async updateUser(userId, updateData, adminId) {
    const { role, isActive, metadata } = updateData;
    
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (metadata) user.metadata = { ...user.metadata, ...metadata };
    
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    return userResponse;
  }

  static async deleteUser(userId) {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  static async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findById(userId).select("+password");
    
    if (!user) {
      throw new Error("User not found");
    }
    
    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
      throw new Error("Current password is incorrect");
    }
    
    const bcrypt = await import('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    return true;
  }
}