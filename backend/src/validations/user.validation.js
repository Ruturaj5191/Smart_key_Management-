// src/validations/user.validation.js
const Joi = require("joi");

exports.createUserSchema = Joi.object({
  role_id: Joi.number().integer().required(),
  name: Joi.string().trim().min(2).max(100).required(),
  mobile: Joi.string().trim().max(15).allow(null, ""),
  email: Joi.string().trim().email().max(100).allow(null, ""),
  password: Joi.string().trim().max(255).allow(null, ""),
});

exports.updateUserStatusSchema = Joi.object({
  status: Joi.string().valid("ACTIVE", "INACTIVE").required(),
});
