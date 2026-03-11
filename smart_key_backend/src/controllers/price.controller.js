const exe = require("../config/db");

// ✅ GET /api/prices
exports.getPrices = async (req, res, next) => {
  try {
    const rows = await exe(`SELECT service_type, price FROM service_prices`);
    // Convert to object for easier frontend use
    const prices = {};
    rows.forEach(r => {
      prices[r.service_type] = r.price;
    });
    return res.json({ success: true, data: prices });
  } catch (err) {
    next(err);
  }
};

// ✅ PUT /api/prices/:type
exports.updatePrice = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { price } = req.body;

    if (!['WATER', 'TEA', 'CLEANING'].includes(type.toUpperCase())) {
      return res.status(400).json({ success: false, message: "Invalid service type" });
    }

    await exe(
      `UPDATE service_prices SET price = ? WHERE service_type = ?`,
      [price, type.toUpperCase()]
    );

    return res.json({ success: true, message: `Price updated for ${type}` });
  } catch (err) {
    next(err);
  }
};
