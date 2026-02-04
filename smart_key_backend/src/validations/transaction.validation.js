// src/validations/transaction.validation.js
const Joi = require("joi");

exports.issueKeySchema = Joi.object({
  key_id: Joi.number().integer().required(),
  issued_to: Joi.number().integer().required(),
  access_method: Joi.string().valid("OTP", "QR", "RFID").required(),
  request_id: Joi.number().integer().optional(),
});

exports.returnKeySchema = Joi.object({
  transaction_id: Joi.number().integer().optional(),
  key_id: Joi.number().integer().optional(),
}).or("transaction_id", "key_id");

exports.markLostSchema = Joi.object({
  // empty body allowed; id comes from params
});
