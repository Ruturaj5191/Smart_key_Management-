// src/routes/ai.routes.js
const express = require("express");
const router = express.Router();

const aiController = require("../controllers/ai.controller");
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

// All AI routes are protected
router.use(auth);

// ── Owner route ───────────────────────────────────────────────────────────────

// POST /api/ai/chat — owner chatbot
router.post(
  "/chat",
  allowRoles([1, 2, 4]),       // SuperAdmin, Admin, Owner
  aiController.chat
);

// ── Admin routes ──────────────────────────────────────────────────────────────

// GET /api/ai/alerts/:orgId — get all AI alerts for an org
router.get(
  "/alerts/:orgId",
  allowRoles([1, 2]),          // SuperAdmin, Admin
  aiController.listAlerts
);

// PUT /api/ai/alerts/:id/read — mark alert as read
router.put(
  "/alerts/:id/read",
  allowRoles([1, 2]),          // SuperAdmin, Admin
  aiController.markAlertRead
);

module.exports = router;
