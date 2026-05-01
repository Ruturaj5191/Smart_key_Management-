// src/utils/response.js

exports.ok = (res, data = null, message = "Success", status = 200) => {
  return res.status(status).json({ success: true, message, data });
};

exports.fail = (res, message = "Failed", status = 400, extra = {}) => {
  return res.status(status).json({ success: false, message, ...extra });
};
