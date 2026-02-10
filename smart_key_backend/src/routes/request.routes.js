// // routes/requests.routes.js
// const express = require("express");
// const router = express.Router();

// const auth = require("../middleware/auth.middleware");
// const allowRoles = require("../middleware/role.middleware");
// const requestsCtrl = require("../controllers/request.controller");

// router.use(auth);
// router.use(allowRoles([4])); // OWNER

// router.post("/requests", requestsCtrl.createKeyRequest);
// router.post("/requests/:id/verify-otp", requestsCtrl.verifyOtp);



// module.exports = router;

const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const requestsCtrl = require("../controllers/request.controller");

// --------------------
// AUTH REQUIRED
// --------------------
router.use(auth);

// --------------------
// KEY REQUESTS (OWNER)
// --------------------
router.post(
  "/requests",
  allowRoles([4]), // OWNER
  requestsCtrl.createKeyRequest
);

router.post(
  "/requests/:id/verify-otp",
  allowRoles([4]), // OWNER
  requestsCtrl.verifyOtp
);

// --------------------
// FACILITY REQUESTS
// --------------------

// OWNER → create water / cleaning request
router.post(
  "/facility",
  allowRoles([4]), // OWNER
  requestsCtrl.createFacilityRequest
);

// OWNER, ADMIN, SECURITY → view requests
router.get(
  "/facility",
  allowRoles([1, 2, 3, 4]), // SUPER_ADMIN, ADMIN, SECURITY, OWNER
  requestsCtrl.getFacilityRequests
);

// ADMIN, SECURITY → update status
router.put(
  "/facility/:id/status",
  allowRoles([2, 3]), // ADMIN, SECURITY
  requestsCtrl.updateFacilityRequestStatus
);

module.exports = router;
