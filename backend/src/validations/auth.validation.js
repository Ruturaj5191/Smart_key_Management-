const Joi = require('joi');

exports.registerSchema = {
  body: Joi.object({
    name: Joi.string().min(2).required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().min(10).max(15).required(),
    password: Joi.string().min(6).required(),
    role_id: Joi.number().required()
  })
};

exports.loginSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
};
