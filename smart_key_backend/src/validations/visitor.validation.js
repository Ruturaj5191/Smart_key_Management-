// src/validations/visitor.validation.js
const Joi = require("joi");

exports.preApproveVisitorSchema = Joi.object({
  unit_id: Joi.number().integer().required(),
  visitor_name: Joi.string().trim().min(1).max(100).required(),
  visitor_phone: Joi.string()
    .trim()
    .pattern(/^[0-9]{10,15}$/)
    .required()
    .messages({ "string.pattern.base": "visitor_phone must be 10-15 digits" }),
  purpose: Joi.string().trim().max(255).allow(null, ""),
  expected_date: Joi.date().iso().required(),
});

exports.verifyOtpSchema = Joi.object({
  visitor_phone: Joi.string()
    .trim()
    .pattern(/^[0-9]{10,15}$/)
    .required()
    .messages({ "string.pattern.base": "visitor_phone must be 10-15 digits" }),
  otp: Joi.string()
    .trim()
    .length(6)
    .pattern(/^[0-9]{6}$/)
    .required()
    .messages({ "string.pattern.base": "OTP must be exactly 6 digits" }),
  vehicle_number: Joi.string().trim().max(20).allow(null, ""),
  photo_url: Joi.string().trim().max(500).allow(null, ""),
});
