// src/config/constants.js

const ROLE = Object.freeze({
  SUPER_ADMIN: 1,
  ADMIN: 2,
  SECURITY: 3,
  OWNER: 4,
});

const TABLES = Object.freeze({
  KEYS: "keyss", // keep "keyss" as per your DB (rename later if you want)
});

const STATUS = Object.freeze({
  USER: ["ACTIVE", "INACTIVE"],
  ORG: ["ACTIVE", "INACTIVE"],
  UNIT: ["ACTIVE", "INACTIVE"],
  KEY: ["AVAILABLE", "ISSUED", "LOST"],
  REQUEST: ["PENDING", "APPROVED", "REJECTED"],
  TXN: ["ISSUED", "RETURNED", "LOST"],
});

const ACCESS_METHOD = Object.freeze(["OTP", "QR", "RFID"]);
const NOTIFICATION_CHANNEL = Object.freeze(["SMS", "EMAIL", "WHATSAPP"]);

// Overdue check (until you add expected_return_time)
const OVERDUE_HOURS = Number(process.env.OVERDUE_HOURS || 24);
const CRON_INTERVAL_MIN = Number(process.env.CRON_INTERVAL_MIN || 5);

module.exports = {
  ROLE,
  TABLES,
  STATUS,
  ACCESS_METHOD,
  NOTIFICATION_CHANNEL,
  OVERDUE_HOURS,
  CRON_INTERVAL_MIN,
};
