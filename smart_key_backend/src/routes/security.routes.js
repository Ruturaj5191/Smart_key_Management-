// src/routes/security.routes.js
const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const { ROLE } = require("../config/constants");
const ctrl = require("../controllers/security.controller");

router.use(auth);
router.use(role([ROLE.SECURITY, ROLE.ADMIN, ROLE.SUPER_ADMIN]));

// existing
router.get("/orgs", ctrl.myAssignedOrgs);
router.get("/transactions/open", ctrl.listOpenIssued);
router.get("/transactions", ctrl.listAllTransactions);

// ✅ list requests for security to issue
router.get("/requests", ctrl.listIssueRequests);

// existing
router.post("/issue", ctrl.issueKey);
router.post("/return", ctrl.returnKey);

module.exports = router;
