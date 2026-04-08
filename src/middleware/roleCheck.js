export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied",
        message: `This action requires one of these roles: ${allowedRoles.join(", ")}`,
      });
    }
    
    next();
  };
};

export const requireAdmin = requireRole("admin");