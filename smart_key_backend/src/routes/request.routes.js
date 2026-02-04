// routes/requests.routes.js
const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const requestsCtrl = require("../controllers/request.controller");

router.use(auth);
router.use(allowRoles([4])); // OWNER

router.post("/requests", requestsCtrl.createKeyRequest);

module.exports = router;
