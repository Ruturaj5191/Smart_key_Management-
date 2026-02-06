const express = require("express");
const router = express.Router();

const ownerController = require("../controllers/owner.controller");
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const requestCtrl =require("../controllers/request.controller");

// protect owner routes
router.use(auth);
router.use(allowRoles([4])); // OWNER role_id=4

router.get("/units", ownerController.getMyUnits);
router.get("/keys", ownerController.getMyKeys);
router.get("/notifications", ownerController.getMyNotifications);

// setup requests
router.post("/setup-requests", ownerController.createSetupRequest);
router.get("/setup-requests", ownerController.listMySetupRequests);

// key setup requests
router.post("/key-setup-requests", ownerController.createKeySetupRequest);
router.get("/key-setup-requests", ownerController.listMyKeySetupRequests);

// ✅ ADD THIS (Owner key requests for existing keys)
router.post("/requests", ownerController.createKeyRequest);
router.get("/requests", ownerController.listMyKeyRequests);

router.post("/requests/:id/send-otp", requestCtrl.sendOtp);
router.post("/requests/:id/verify-otp", requestCtrl.verifyOtp);

module.exports = router;
