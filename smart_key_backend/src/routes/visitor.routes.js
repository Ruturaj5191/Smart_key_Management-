// src/routes/visitor.routes.js
const express = require("express");
const router = express.Router();

const visitorController = require("../controllers/visitor.controller");
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const validate = require("../middleware/validate");
const {
  preApproveVisitorSchema,
  verifyOtpSchema,
} = require("../validations/visitor.validation");

// All visitor routes are protected
router.use(auth);

// ── Owner routes ──────────────────────────────────────────────────────────────

// POST /api/visitors/pre-approve — owner creates visitor with OTP
router.post(
  "/pre-approve",
  allowRoles([1, 2, 4]),       // SuperAdmin, Admin, Owner
  validate({ body: preApproveVisitorSchema }),
  visitorController.preApproveVisitor
);

// GET /api/visitors/my/:unitId — owner sees visitor list
router.get(
  "/my/:unitId",
  allowRoles([1, 2, 4]),       // SuperAdmin, Admin, Owner
  visitorController.listMyVisitors
);

// DELETE /api/visitors/:id — owner cancels visitor
router.delete(
  "/:id",
  allowRoles([1, 2, 4]),       // SuperAdmin, Admin, Owner
  visitorController.cancelVisitor
);

// ── Security routes ───────────────────────────────────────────────────────────

// POST /api/visitors/verify-otp — security verifies OTP at gate
router.post(
  "/verify-otp",
  allowRoles([1, 2, 3]),       // SuperAdmin, Admin, Security
  validate({ body: verifyOtpSchema }),
  visitorController.verifyOtp
);

// PUT /api/visitors/exit/:logId — security marks exit
router.put(
  "/exit/:logId",
  allowRoles([1, 2, 3]),       // SuperAdmin, Admin, Security
  visitorController.markExit
);

// ── Admin routes ──────────────────────────────────────────────────────────────

// GET /api/visitors/logs/:orgId — admin sees all visitor logs
router.get(
  "/logs/:orgId",
  allowRoles([1, 2]),          // SuperAdmin, Admin
  visitorController.listVisitorLogs
);

module.exports = router;
