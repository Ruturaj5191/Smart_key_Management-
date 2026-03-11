const express = require("express");
const router = express.Router();
const statsController = require("../controllers/stats.controller");
const auth = require("../middleware/auth.middleware");

router.get("/counts", auth, statsController.getNavbarCounts);

module.exports = router;
