// src/middleware/role.middleware.js
module.exports = (allowedRoles = []) => {
  return (req, res, next) => {
    const userRoleId = req.user?.role_id;

    if (!userRoleId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized (token missing or invalid)"
      });
    }

    if (!allowedRoles.includes(Number(userRoleId))) {
      return res.status(403).json({
        success: false,
        message: "Access denied: insufficient permissions"
      });
    }

    next();
  };
};
