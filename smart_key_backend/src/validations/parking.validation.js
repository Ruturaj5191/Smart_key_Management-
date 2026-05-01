// src/validations/parking.validation.js
const Joi = require("joi");

exports.createSlotSchema = Joi.object({
  org_id: Joi.number().integer().required(),
  slot_number: Joi.string().trim().min(1).max(20).required(),
  slot_type: Joi.string().valid("TWO_WHEELER", "FOUR_WHEELER").required(),
  floor: Joi.string().trim().max(10).default("G"),
});

exports.vehicleEntrySchema = Joi.object({
  slot_id: Joi.number().integer().required(),
  vehicle_number: Joi.string().trim().min(1).max(20).required(),
  driver_name: Joi.string().trim().max(100).allow(null, ""),
  unit_id: Joi.number().integer().allow(null),
  type: Joi.string().valid("VISITOR", "RESIDENT", "DELIVERY").required(),
});

exports.bookSlotSchema = Joi.object({
  slot_id: Joi.number().integer().required(),
  unit_id: Joi.number().integer().required(),
  vehicle_number: Joi.string().trim().min(1).max(20).required(),
  booking_date: Joi.date().iso().required(),
  start_time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .required()
    .messages({ "string.pattern.base": "start_time must be HH:MM or HH:MM:SS" }),
  end_time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .required()
    .messages({ "string.pattern.base": "end_time must be HH:MM or HH:MM:SS" }),
});
