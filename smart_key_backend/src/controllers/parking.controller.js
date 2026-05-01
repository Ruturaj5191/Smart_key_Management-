// src/controllers/parking.controller.js
const exe = require("../config/db");
const { ok, fail } = require("../utils/response");
const logger = require("../utils/logger");

// ── helpers ───────────────────────────────────────────────────────────────────

async function audit(userId, action, entity, entityId, ip) {
  try {
    await exe(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, ip_address)
       VALUES (?, ?, ?, ?, ?)`,
      [userId || null, action, entity, entityId || null, ip || null]
    );
  } catch (_) {}
}

function getIp(req) {
  return (
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    null
  );
}

// ── GET /api/parking/slots/:orgId — list all slots with status ────────────────

exports.listSlots = async (req, res, next) => {
  try {
    const orgId = Number(req.params.orgId);
    if (!orgId) return fail(res, "Invalid orgId", 400);

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    // optional filters
    const slotType = req.query.slot_type ? String(req.query.slot_type).toUpperCase() : null;
    const status = req.query.status ? String(req.query.status).toUpperCase() : null;
    const floor = req.query.floor || null;

    let sql = `SELECT id, org_id, slot_number, slot_type, floor, status, created_at
               FROM parking_slots
               WHERE org_id = ?`;
    const params = [orgId];

    if (slotType && ["TWO_WHEELER", "FOUR_WHEELER"].includes(slotType)) {
      sql += ` AND slot_type = ?`;
      params.push(slotType);
    }
    if (status && ["AVAILABLE", "OCCUPIED", "RESERVED"].includes(status)) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    if (floor) {
      sql += ` AND floor = ?`;
      params.push(floor);
    }

    // total count
    const countSql = sql.replace(/SELECT .+? FROM/, "SELECT COUNT(*) AS total FROM");
    const countRows = await exe(countSql, params);
    const total = countRows[0]?.total || 0;

    sql += ` ORDER BY floor ASC, slot_number ASC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = await exe(sql, params);

    return ok(res, { slots: rows, total, page, limit }, "Parking slots");
  } catch (e) {
    logger.error("parking.listSlots:", e.message);
    next(e);
  }
};

// ── POST /api/parking/slots — admin adds new slot ─────────────────────────────

exports.createSlot = async (req, res, next) => {
  try {
    const { org_id, slot_number, slot_type, floor } = req.body;

    // verify org exists
    const org = await exe(`SELECT id FROM organizations WHERE id = ? LIMIT 1`, [org_id]);
    if (!org.length) return fail(res, "Organization not found", 404);

    // check duplicate
    const dup = await exe(
      `SELECT id FROM parking_slots WHERE org_id = ? AND slot_number = ? LIMIT 1`,
      [org_id, slot_number.trim()]
    );
    if (dup.length) return fail(res, "Slot number already exists in this organization", 409);

    const result = await exe(
      `INSERT INTO parking_slots (org_id, slot_number, slot_type, floor)
       VALUES (?, ?, ?, ?)`,
      [org_id, slot_number.trim(), slot_type, floor || "G"]
    );

    await audit(req.user.id, "PARKING_SLOT_CREATED", "parking_slots", result.insertId, getIp(req));

    logger.info(`Parking slot #${result.insertId} created by user #${req.user.id}`);

    return ok(
      res,
      {
        id: result.insertId,
        org_id,
        slot_number: slot_number.trim(),
        slot_type,
        floor: floor || "G",
        status: "AVAILABLE",
      },
      "Parking slot created",
      201
    );
  } catch (e) {
    logger.error("parking.createSlot:", e.message);
    next(e);
  }
};

// ── POST /api/parking/entry — security logs vehicle entry ─────────────────────

exports.vehicleEntry = async (req, res, next) => {
  try {
    const { slot_id, vehicle_number, driver_name, unit_id, type } = req.body;

    // verify slot exists and is AVAILABLE
    const slot = await exe(
      `SELECT id, org_id, status FROM parking_slots WHERE id = ? LIMIT 1`,
      [slot_id]
    );
    if (!slot.length) return fail(res, "Parking slot not found", 404);
    if (slot[0].status !== "AVAILABLE") {
      return fail(res, `Slot is currently ${slot[0].status}`, 400);
    }

    // verify security is assigned to this org
    const assignment = await exe(
      `SELECT id FROM security_assignments WHERE org_id = ? AND user_id = ? LIMIT 1`,
      [slot[0].org_id, req.user.id]
    );
    if (!assignment.length) {
      return fail(res, "You are not assigned to this organization", 403);
    }

    // create parking log
    const result = await exe(
      `INSERT INTO parking_logs (slot_id, vehicle_number, driver_name, unit_id, security_id, type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [slot_id, vehicle_number.trim().toUpperCase(), driver_name || null, unit_id || null, req.user.id, type]
    );

    // update slot status to OCCUPIED
    await exe(`UPDATE parking_slots SET status = 'OCCUPIED' WHERE id = ?`, [slot_id]);

    await audit(req.user.id, "PARKING_VEHICLE_ENTRY", "parking_logs", result.insertId, getIp(req));

    logger.info(`Vehicle ${vehicle_number} entered slot #${slot_id} — log #${result.insertId}`);

    return ok(
      res,
      {
        log_id: result.insertId,
        slot_id,
        vehicle_number: vehicle_number.trim().toUpperCase(),
        type,
        entry_time: new Date().toISOString(),
      },
      "Vehicle entry logged",
      201
    );
  } catch (e) {
    logger.error("parking.vehicleEntry:", e.message);
    next(e);
  }
};

// ── PUT /api/parking/exit/:logId — security logs vehicle exit ─────────────────

exports.vehicleExit = async (req, res, next) => {
  try {
    const logId = Number(req.params.logId);
    if (!logId) return fail(res, "Invalid logId", 400);

    // verify log exists and exit_time is null
    const logs = await exe(
      `SELECT pl.id, pl.slot_id, pl.exit_time, ps.org_id
       FROM parking_logs pl
       JOIN parking_slots ps ON ps.id = pl.slot_id
       WHERE pl.id = ? LIMIT 1`,
      [logId]
    );
    if (!logs.length) return fail(res, "Parking log not found", 404);

    const log = logs[0];
    if (log.exit_time) return fail(res, "Vehicle already exited", 400);

    // verify security assignment
    const assignment = await exe(
      `SELECT id FROM security_assignments WHERE org_id = ? AND user_id = ? LIMIT 1`,
      [log.org_id, req.user.id]
    );
    if (!assignment.length) {
      return fail(res, "You are not assigned to this organization", 403);
    }

    // update parking log
    await exe(`UPDATE parking_logs SET exit_time = NOW() WHERE id = ?`, [logId]);

    // free the slot
    await exe(`UPDATE parking_slots SET status = 'AVAILABLE' WHERE id = ?`, [log.slot_id]);

    await audit(req.user.id, "PARKING_VEHICLE_EXIT", "parking_logs", logId, getIp(req));

    logger.info(`Vehicle exited — log #${logId}, slot #${log.slot_id} freed`);

    return ok(res, { log_id: logId, slot_id: log.slot_id }, "Vehicle exit logged");
  } catch (e) {
    logger.error("parking.vehicleExit:", e.message);
    next(e);
  }
};

// ── POST /api/parking/book — owner books a slot ───────────────────────────────

exports.bookSlot = async (req, res, next) => {
  try {
    const { slot_id, unit_id, vehicle_number, booking_date, start_time, end_time } = req.body;

    // verify unit belongs to this owner
    const unit = await exe(
      `SELECT id, org_id FROM units WHERE id = ? AND owner_id = ? LIMIT 1`,
      [unit_id, req.user.id]
    );
    if (!unit.length) return fail(res, "This unit is not yours", 403);

    // verify slot belongs to same org
    const slot = await exe(
      `SELECT id, org_id, status FROM parking_slots WHERE id = ? LIMIT 1`,
      [slot_id]
    );
    if (!slot.length) return fail(res, "Parking slot not found", 404);
    if (Number(slot[0].org_id) !== Number(unit[0].org_id)) {
      return fail(res, "Slot does not belong to your organization", 400);
    }

    // check for overlapping confirmed bookings on the same slot + date
    const overlap = await exe(
      `SELECT id FROM parking_bookings
       WHERE slot_id = ? AND booking_date = ?
         AND status IN ('PENDING', 'CONFIRMED')
         AND (
           (start_time < ? AND end_time > ?)
         )
       LIMIT 1`,
      [slot_id, booking_date, end_time, start_time]
    );
    if (overlap.length) {
      return fail(res, "Slot already booked for the selected time window", 409);
    }

    const result = await exe(
      `INSERT INTO parking_bookings (slot_id, unit_id, owner_id, vehicle_number, booking_date, start_time, end_time, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')`,
      [slot_id, unit_id, req.user.id, vehicle_number.trim().toUpperCase(), booking_date, start_time, end_time]
    );

    await audit(req.user.id, "PARKING_SLOT_BOOKED", "parking_bookings", result.insertId, getIp(req));

    logger.info(`Slot #${slot_id} booked by owner #${req.user.id} — booking #${result.insertId}`);

    return ok(
      res,
      {
        id: result.insertId,
        slot_id,
        unit_id,
        vehicle_number: vehicle_number.trim().toUpperCase(),
        booking_date,
        start_time,
        end_time,
        status: "CONFIRMED",
      },
      "Slot booked successfully",
      201
    );
  } catch (e) {
    logger.error("parking.bookSlot:", e.message);
    next(e);
  }
};

// ── GET /api/parking/bookings/:unitId — owner sees own bookings ───────────────

exports.listBookings = async (req, res, next) => {
  try {
    const unitId = Number(req.params.unitId);
    if (!unitId) return fail(res, "Invalid unitId", 400);

    // verify unit belongs to this owner
    const unit = await exe(
      `SELECT id FROM units WHERE id = ? AND owner_id = ? LIMIT 1`,
      [unitId, req.user.id]
    );
    if (!unit.length) return fail(res, "This unit is not yours", 403);

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countRows = await exe(
      `SELECT COUNT(*) AS total FROM parking_bookings WHERE unit_id = ?`,
      [unitId]
    );
    const total = countRows[0]?.total || 0;

    const rows = await exe(
      `SELECT pb.id, pb.slot_id, ps.slot_number, ps.slot_type, ps.floor,
              pb.vehicle_number, pb.booking_date, pb.start_time, pb.end_time,
              pb.status, pb.created_at
       FROM parking_bookings pb
       JOIN parking_slots ps ON ps.id = pb.slot_id
       WHERE pb.unit_id = ?
       ORDER BY pb.booking_date DESC, pb.start_time DESC
       LIMIT ? OFFSET ?`,
      [unitId, limit, offset]
    );

    return ok(res, { bookings: rows, total, page, limit }, "Your parking bookings");
  } catch (e) {
    logger.error("parking.listBookings:", e.message);
    next(e);
  }
};

// ── GET /api/parking/dashboard/:orgId — admin sees occupancy stats ────────────

exports.dashboard = async (req, res, next) => {
  try {
    const orgId = Number(req.params.orgId);
    if (!orgId) return fail(res, "Invalid orgId", 400);

    // slot summary
    const slotSummary = await exe(
      `SELECT
         COUNT(*) AS total_slots,
         SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available,
         SUM(CASE WHEN status = 'OCCUPIED'  THEN 1 ELSE 0 END) AS occupied,
         SUM(CASE WHEN status = 'RESERVED'  THEN 1 ELSE 0 END) AS reserved
       FROM parking_slots
       WHERE org_id = ?`,
      [orgId]
    );

    // type breakdown
    const typeBreakdown = await exe(
      `SELECT slot_type,
              COUNT(*) AS total,
              SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available,
              SUM(CASE WHEN status = 'OCCUPIED'  THEN 1 ELSE 0 END) AS occupied
       FROM parking_slots
       WHERE org_id = ?
       GROUP BY slot_type`,
      [orgId]
    );

    // floor breakdown
    const floorBreakdown = await exe(
      `SELECT floor,
              COUNT(*) AS total,
              SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available,
              SUM(CASE WHEN status = 'OCCUPIED'  THEN 1 ELSE 0 END) AS occupied
       FROM parking_slots
       WHERE org_id = ?
       GROUP BY floor
       ORDER BY floor ASC`,
      [orgId]
    );

    // today's entries
    const todayEntries = await exe(
      `SELECT COUNT(*) AS count
       FROM parking_logs pl
       JOIN parking_slots ps ON ps.id = pl.slot_id
       WHERE ps.org_id = ? AND DATE(pl.entry_time) = CURDATE()`,
      [orgId]
    );

    // today's exits
    const todayExits = await exe(
      `SELECT COUNT(*) AS count
       FROM parking_logs pl
       JOIN parking_slots ps ON ps.id = pl.slot_id
       WHERE ps.org_id = ? AND DATE(pl.exit_time) = CURDATE()`,
      [orgId]
    );

    // today's bookings
    const todayBookings = await exe(
      `SELECT COUNT(*) AS count
       FROM parking_bookings pb
       JOIN parking_slots ps ON ps.id = pb.slot_id
       WHERE ps.org_id = ? AND pb.booking_date = CURDATE()`,
      [orgId]
    );

    // recent logs (last 20)
    const recentLogs = await exe(
      `SELECT pl.id, pl.slot_id, ps.slot_number, ps.floor,
              pl.vehicle_number, pl.driver_name, pl.type,
              pl.entry_time, pl.exit_time,
              u.name AS security_name
       FROM parking_logs pl
       JOIN parking_slots ps ON ps.id = pl.slot_id
       LEFT JOIN users u ON u.id = pl.security_id
       WHERE ps.org_id = ?
       ORDER BY pl.id DESC
       LIMIT 20`,
      [orgId]
    );

    return ok(res, {
      summary: slotSummary[0] || { total_slots: 0, available: 0, occupied: 0, reserved: 0 },
      type_breakdown: typeBreakdown,
      floor_breakdown: floorBreakdown,
      today: {
        entries: todayEntries[0]?.count || 0,
        exits: todayExits[0]?.count || 0,
        bookings: todayBookings[0]?.count || 0,
      },
      recent_logs: recentLogs,
    }, "Parking dashboard");
  } catch (e) {
    logger.error("parking.dashboard:", e.message);
    next(e);
  }
};
