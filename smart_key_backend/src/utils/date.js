// src/utils/date.js

function pad(n) {
  return String(n).padStart(2, "0");
}

exports.nowSQL = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

exports.addHours = (date, hours) => {
  const d = new Date(date);
  d.setHours(d.getHours() + Number(hours || 0));
  return d;
};

exports.diffHours = (a, b) => {
  const ms = Math.abs(new Date(a).getTime() - new Date(b).getTime());
  return ms / (1000 * 60 * 60);
};
