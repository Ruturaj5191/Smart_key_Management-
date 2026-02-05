// const express = require("express");
// const router = express.Router();

// const auth = require("../middleware/auth.middleware");
// const allowRoles = require("../middleware/role.middleware");
// const superAdminController = require("../controllers/superAdmin.controller");
// const { route } = require("./admin.routes");

// router.use(auth);

// // ✅ Read-only users list can be used by ADMIN too (for dropdowns)
// router.get("/users", allowRoles([1, 2]), superAdminController.listUsers);

// // ✅ SuperAdmin-only management
// router.get("/roles", allowRoles([1]), superAdminController.listRoles);
// router.post("/users", allowRoles([1]), superAdminController.createUser);
// router.patch("/users/:id", allowRoles([1]), superAdminController.updateUser);
// router.patch("/users/:id/status", allowRoles([1]), superAdminController.updateUserStatus);
// router.get("/overview", allowRoles([1]), superAdminController.overview);

// module.exports = router;


const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const superAdminController = require("../controllers/superAdmin.controller");

router.use(auth);

// ✅ Admin + SuperAdmin can read users list
router.get("/users", allowRoles([1, 2]), superAdminController.listUsers);

// ✅ SuperAdmin-only
router.get("/roles", allowRoles([1]), superAdminController.listRoles);
router.post("/users", allowRoles([1]), superAdminController.createUser);
router.patch("/users/:id", allowRoles([1]), superAdminController.updateUser);
router.patch("/users/:id/status", allowRoles([1]), superAdminController.updateUserStatus);
router.get("/overview", allowRoles([1]), superAdminController.overview);

module.exports = router;
