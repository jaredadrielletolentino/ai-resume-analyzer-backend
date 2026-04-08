import { AuthService } from "../services/authService.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required",
        message: "No token provided",
      });
    }
    
    const token = authHeader.split(" ")[1];
    const decoded = AuthService.verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "Invalid or expired token",
      });
    }
    
    const user = await AuthService.getUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "User not found",
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        error: "Account deactivated",
        message: "Please contact administrator",
      });
    }
    
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      error: "Authentication error",
      message: "Internal server error",
    });
  }
};