// src/routes/transaction.routes.js
const express = require("express");
const router = express.Router();

const transactionController = require("../controllers/transaction.controller");
const auth = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// Roles (change these IDs if your roles table differs)
// Typically: 1=SUPER_ADMIN, 2=ADMIN, 3=SECURITY/KEY_HANDLER
const STAFF_ROLES = [1, 2, 3];

// Issue a key (Security/Admin staff)
router.post(
  "/issue",
  auth,
  roleMiddleware(STAFF_ROLES),
  transactionController.issueKey
);

// Return a key (Security/Admin staff)
router.post(
  "/return",
  auth,
  roleMiddleware(STAFF_ROLES),
  transactionController.returnKey
);

// Mark key as lost (Admin/SuperAdmin only)
router.patch(
  "/:id/lost",
  auth,
  roleMiddleware([1, 2]),
  transactionController.markLost
);

// List open issued transactions (Admin/Security)
router.get(
  "/open",
  auth,
  roleMiddleware(STAFF_ROLES),
  transactionController.listOpenIssued
);

module.exports = router;
