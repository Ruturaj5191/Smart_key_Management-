const express = require('express');
const router = express.Router();

const keyController = require('../controllers/key.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validate = require('../middleware/validate');
const { createKeySchema, updateKeySchema } = require('../validations/key.validation');

/**
 * CREATE KEY
 * POST /api/keys
 * Roles: SUPER_ADMIN (1), ADMIN (2)
 */
router.post(
  '/',
  authMiddleware,
  roleMiddleware([1, 2]),
  validate(createKeySchema),
  keyController.createKey
);

/**
 * GET ALL KEYS
 * GET /api/keys
 * Roles: SUPER_ADMIN (1), ADMIN (2)
 */
router.get(
  '/',
  authMiddleware,
  roleMiddleware([1, 2]),
  keyController.getAllKeys
);

/**
 * UPDATE KEY
 * PATCH /api/keys/:id
 * Roles: SUPER_ADMIN (1), ADMIN (2)
 */
router.patch(
  '/:id',
  authMiddleware,
  roleMiddleware([1, 2]),
  validate(updateKeySchema),
  keyController.updateKey
);

module.exports = router;
