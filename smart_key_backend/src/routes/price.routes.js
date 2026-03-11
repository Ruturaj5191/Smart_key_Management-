const express = require("express");
const router = express.Router();
const priceController = require("../controllers/price.controller");
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

// Public (authenticated) GET
router.get("/", auth, priceController.getPrices);

// Admin only UPDATE
router.put("/:type", auth, allowRoles([1, 2]), priceController.updatePrice);

module.exports = router;
