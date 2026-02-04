// src/utils/logger.js

function ts() {
  return new Date().toISOString();
}

exports.info = (...args) => console.log(`[INFO ${ts()}]`, ...args);
exports.warn = (...args) => console.warn(`[WARN ${ts()}]`, ...args);
exports.error = (...args) => console.error(`[ERROR ${ts()}]`, ...args);
exports.debug = (...args) => {
  if (process.env.DEBUG === "true") console.log(`[DEBUG ${ts()}]`, ...args);
};
