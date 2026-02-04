// src/validations/key.validation.js
const Joi = require("joi");

exports.createKeySchema = Joi.object({
  unit_id: Joi.number().integer().required(),
  key_code: Joi.string().trim().min(3).max(50).required(),
  key_type: Joi.string().valid("MAIN", "SPARE", "EMERGENCY").default("MAIN"),
  locker_no: Joi.string().trim().max(50).allow(null, ""),
});

exports.updateKeySchema = Joi.object({
  key_type: Joi.string().valid("MAIN", "SPARE", "EMERGENCY"),
  locker_no: Joi.string().trim().max(50).allow(null, ""),
  status: Joi.string().valid("AVAILABLE", "ISSUED", "LOST"),
}).min(1);
