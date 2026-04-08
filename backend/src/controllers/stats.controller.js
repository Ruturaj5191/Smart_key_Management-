const exe = require("../config/db");
const { ROLE } = require("../utils/roles");

exports.getNavbarCounts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const roleId = Number(req.user.role_id);
    const counts = {};

    // 1. ADMIN / SUPER_ADMIN
    if (roleId === 1 || roleId === 2) {
      const kr = await exe(`SELECT COUNT(*) as count FROM key_requests WHERE status = 'PENDING'`);
      counts.keyRequests = kr[0].count;

      const fr = await exe(`SELECT COUNT(*) as count FROM facility_requests WHERE status = 'PENDING' OR status = 'IN_PROGRESS'`);
      counts.facilityRequests = fr[0].count;

      const sr = await exe(`SELECT COUNT(*) as count FROM setup_requests WHERE status = 'PENDING'`);
      const ksr = await exe(`SELECT COUNT(*) as count FROM key_setup_requests WHERE status = 'PENDING'`);
      counts.setupRequests = sr[0].count + ksr[0].count;
    }

    // 2. SECURITY
    if (roleId === 3) {
      // Pending facility requests in assigned orgs
      const fr = await exe(`
        SELECT COUNT(*) as count 
        FROM facility_requests fr
        JOIN units u ON fr.unit_id = u.id
        JOIN security_assignments sa ON u.org_id = sa.org_id
        WHERE sa.user_id = ? AND (fr.status = 'PENDING' OR fr.status = 'IN_PROGRESS')
      `, [userId]);
      counts.facilityRequests = fr[0].count;

      // Keys approved but not yet issued (Ready to Issue)
      // We look for status 'APPROVED' or 'OTP_VERIFIED' depending on the flow
      const ik = await exe(`
        SELECT COUNT(*) as count 
        FROM key_requests kr
        JOIN keyss k ON kr.key_id = k.id
        JOIN units u ON k.unit_id = u.id
        JOIN security_assignments sa ON u.org_id = sa.org_id
        WHERE sa.user_id = ? AND (kr.status = 'APPROVED' OR kr.status = 'OTP_VERIFIED')
      `, [userId]);
      counts.issueKey = ik[0].count;
    }

    // 3. OWNER
    if (roleId === 4) {
      const kr = await exe(`SELECT COUNT(*) as count FROM key_requests WHERE requested_by = ? AND (status = 'APPROVED' OR status = 'OTP_SENT')`, [userId]);
      counts.myRequests = kr[0].count;

      const fr = await exe(`SELECT COUNT(*) as count FROM facility_requests WHERE user_id = ? AND (status = 'PENDING' OR status = 'IN_PROGRESS')`, [userId]);
      counts.myFacility = fr[0].count;
    }

    return res.json({ success: true, data: counts });
  } catch (err) {
    next(err);
  }
};
