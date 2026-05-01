// src/routes/parking.routes.js
const express = require("express");
const router = express.Router();

const parkingController = require("../controllers/parking.controller");
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const validate = require("../middleware/validate");
const {
  createSlotSchema,
  vehicleEntrySchema,
  bookSlotSchema,
} = require("../validations/parking.validation");

// All parking routes are protected
router.use(auth);

// ── Admin / SuperAdmin routes ─────────────────────────────────────────────────

// POST /api/parking/slots — admin adds a new slot
router.post(
  "/slots",
  allowRoles([1, 2]),       // SuperAdmin, Admin
  validate({ body: createSlotSchema }),
  parkingController.createSlot
);

// GET /api/parking/dashboard/:orgId — admin sees occupancy stats
router.get(
  "/dashboard/:orgId",
  allowRoles([1, 2]),       // SuperAdmin, Admin
  parkingController.dashboard
);

// ── Security routes ───────────────────────────────────────────────────────────

// POST /api/parking/entry — security logs vehicle entry
router.post(
  "/entry",
  allowRoles([1, 2, 3]),    // SuperAdmin, Admin, Security
  validate({ body: vehicleEntrySchema }),
  parkingController.vehicleEntry
);

// PUT /api/parking/exit/:logId — security logs vehicle exit
router.put(
  "/exit/:logId",
  allowRoles([1, 2, 3]),    // SuperAdmin, Admin, Security
  parkingController.vehicleExit
);

// ── Owner routes ──────────────────────────────────────────────────────────────

// POST /api/parking/book — owner books a slot
router.post(
  "/book",
  allowRoles([1, 2, 4]),    // SuperAdmin, Admin, Owner
  validate({ body: bookSlotSchema }),
  parkingController.bookSlot
);

// GET /api/parking/bookings/:unitId — owner sees own bookings
router.get(
  "/bookings/:unitId",
  allowRoles([1, 2, 4]),    // SuperAdmin, Admin, Owner
  parkingController.listBookings
);

// ── Shared routes (all roles) ─────────────────────────────────────────────────

// GET /api/parking/slots/:orgId — list all slots with status
router.get(
  "/slots/:orgId",
  allowRoles([1, 2, 3, 4]), // All authenticated roles
  parkingController.listSlots
);

module.exports = router;
