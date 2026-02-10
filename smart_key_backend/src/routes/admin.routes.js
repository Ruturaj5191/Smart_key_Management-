// src/routes/admin.routes.js
const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin.controller");
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware"); // create this file (code below)

// Protect all admin routes
router.use(auth);

// Only Admin / SuperAdmin should access these (edit role ids as per your roles table)
router.use(allowRoles([1, 2]));
// e.g. 1=SuperAdmin, 2=Admin


// add near other admin routes
router.get("/orgs", adminController.listOrganizations);
router.get("/users", adminController.listUsers);


// -------------------- Organizations --------------------
router.post("/orgs", adminController.createOrganization);
router.put("/orgs/:id", adminController.updateOrganization);

// -------------------- Units --------------------
router.post("/units", adminController.createUnit);
router.get("/units", adminController.listUnits);
router.put("/units/:id", adminController.updateUnit);

// -------------------- Keys --------------------
router.post("/keys", adminController.createKey);
router.get("/keys", adminController.listKeys);
router.put("/keys/:id", adminController.updateKey);

// -------------------- Security Assignments --------------------
router.post("/security/assign", adminController.assignSecurityToOrg);
router.get("/security/assignments", adminController.listSecurityAssignments);

// ✅ ALIAS ROUTES (so frontend /security-assign works)
router.post("/security-assign", adminController.assignSecurityToOrg);
router.get("/security-assignments", adminController.listSecurityAssignments);


// -------------------- Key Requests (approve/reject) --------------------
router.get("/requests", adminController.listKeyRequests);
router.patch("/requests/:id/approve", adminController.approveKeyRequest);
router.patch("/requests/:id/reject", adminController.rejectKeyRequest);

// -------------------- Reports --------------------
router.get("/reports/issued-keys", adminController.listIssuedKeys);
router.get("/reports/audit-logs", adminController.listAuditLogs);

// -------------------- Setup Requests --------------------
router.get("/setup-requests", adminController.listSetupRequests);
router.patch("/setup-requests/:id/approve", adminController.approveSetupRequest);
router.patch("/setup-requests/:id/reject", adminController.rejectSetupRequest);

// -------------------- Key Setup Requests (Owner asks Admin to create Key) --------------------
router.get("/key-setup-requests", adminController.listKeySetupRequests);
router.patch("/key-setup-requests/:id/approve", adminController.approveKeySetupRequest);
router.patch("/key-setup-requests/:id/reject", adminController.rejectKeySetupRequest);





module.exports = router;
