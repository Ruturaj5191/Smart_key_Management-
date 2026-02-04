const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate'); // 👈 correct
const auth = require("../middleware/auth.middleware");
const { registerSchema, loginSchema } = require('../validations/auth.validation');

router.post(
  '/register',
  validate(registerSchema),
  authController.register
);

router.post(
  '/login',
  validate(loginSchema),
  authController.login
);


router.get("/profile", auth, authController.getProfile);

module.exports = router;
