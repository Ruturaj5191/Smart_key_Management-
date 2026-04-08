// src/middleware/error.middleware.js
const { fail } = require("../utils/response");
const logger = require("../utils/logger");

module.exports = (err, req, res, next) => {
  // If headers already sent
  if (res.headersSent) return next(err);

  // Joi validation (if your validate middleware throws Joi errors)
  if (err && (err.isJoi || err.name === "ValidationError")) {
    return fail(res, err.message, 400);
  }

  // MySQL common errors (best-effort)
  const msg = err?.message || "Internal Server Error";
  if (msg.includes("ER_DUP_ENTRY")) return fail(res, "Duplicate entry", 409);
  if (msg.includes("ER_NO_REFERENCED_ROW") || msg.includes("foreign key")) {
    return fail(res, "Invalid reference (foreign key constraint)", 400);
  }

  logger.error("GLOBAL_ERROR:", msg);
  return fail(res, msg, err?.statusCode || 500);
};
