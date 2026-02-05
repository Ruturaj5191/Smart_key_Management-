import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ROLE } from "../utils/roles";
import { useEffect, useMemo, useState } from "react";
import api from "../api/client";

function Card({ to, title, desc }) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:bg-slate-50 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-500">{desc}</div>
        </div>
        <span className="text-slate-400">→</span>
      </div>
    </Link>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-bold text-slate-900">{value ?? 0}</div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const roleId = Number(user?.role_id);

  // ---------- SUPER ADMIN OVERVIEW ----------
  const [saOverview, setSaOverview] = useState(null);
  const [saBusy, setSaBusy] = useState(false);

  const loadSuperAdminOverview = async () => {
    setSaBusy(true);
    try {
      const res = await api.get("/superadmin/overview");
      setSaOverview(res.data.data);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || err.message || "Failed to load superadmin overview");
      setSaOverview(null);
    } finally {
      setSaBusy(false);
    }
  };

  // ---------- ADMIN OVERVIEW ----------
  const [adminBusy, setAdminBusy] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [units, setUnits] = useState([]);
  const [owners, setOwners] = useState([]);
  const [securityUsers, setSecurityUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [securityAssignments, setSecurityAssignments] = useState([]);

  const loadAdminOverview = async () => {
    setAdminBusy(true);
    try {
      const [
        orgRes,
        unitRes,
        ownerRes,
        secRes,
        reqRes,
        saRes,
      ] = await Promise.all([
        api.get("/admin/orgs"),
        api.get("/admin/units"),
        api.get("/admin/users", { params: { role_id: ROLE.OWNER } }),
        api.get("/admin/users", { params: { role_id: ROLE.SECURITY } }),
        api.get("/admin/requests", { params: { status: "PENDING" } }),
        api.get("/admin/security-assignments"),
      ]);

      setOrgs(orgRes.data.data || []);
      setUnits(unitRes.data.data || []);
      setOwners(ownerRes.data.data || []);
      setSecurityUsers(secRes.data.data || []);
      setPendingRequests(reqRes.data.data || []);
      setSecurityAssignments(saRes.data.data || []);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || err.message || "Failed to load admin overview");
      setOrgs([]);
      setUnits([]);
      setOwners([]);
      setSecurityUsers([]);
      setPendingRequests([]);
      setSecurityAssignments([]);
    } finally {
      setAdminBusy(false);
    }
  };

  useEffect(() => {
    if (roleId === ROLE.SUPER_ADMIN) loadSuperAdminOverview();
    if (roleId === ROLE.ADMIN) loadAdminOverview();
  }, [roleId]);

  // ---------- ADMIN: build org -> units + security ----------
  const adminOrgCards = useMemo(() => {
    const unitsByOrg = new Map();
    for (const u of units) {
      const k = u.org_id;
      if (!unitsByOrg.has(k)) unitsByOrg.set(k, []);
      unitsByOrg.get(k).push(u);
    }

    const secByOrg = new Map();
    for (const s of securityAssignments) {
      const k = s.org_id;
      if (!secByOrg.has(k)) secByOrg.set(k, []);
      secByOrg.get(k).push(s);
    }

    return (orgs || []).map((o) => {
      const orgUnits = unitsByOrg.get(o.id) || [];
      const uniqueOwners = new Set(orgUnits.map((x) => x.owner_id).filter(Boolean));
      const orgSec = secByOrg.get(o.id) || [];
      return {
        org_id: o.id,
        org_name: o.name,
        address: o.address,
        phone_number: o.phone_number,
        org_status: o.status,
        units: orgUnits.map((x) => ({
          unit_id: x.id,
          unit_name: x.unit_name,
          owner_id: x.owner_id,
          owner_name: x.owner_name,
          unit_status: x.status,
        })),
        security_users: orgSec.map((x) => ({
          security_id: x.user_id,
          security_name: x.user_name,
        })),
        total_units: orgUnits.length,
        total_owners: uniqueOwners.size,
        total_security: orgSec.length,
      };
    });
  }, [orgs, units, securityAssignments]);

  return (
    <div className="space-y-5">
      {/* welcome */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">
          Welcome, <span className="font-semibold text-slate-900">{user?.name}</span>
        </p>
        <div className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          Role ID: {roleId}
        </div>
      </div>

      {/* ================= SUPER ADMIN HOME ================= */}
      {roleId === ROLE.SUPER_ADMIN && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">SuperAdmin Overview</h3>
              <p className="text-sm text-slate-500">Organizations, Units, Owners, Security</p>
            </div>
            <button
              onClick={loadSuperAdminOverview}
              disabled={saBusy}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
            >
              {saBusy ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Organizations" value={saOverview?.totals?.organizations} />
            <Stat label="Units" value={saOverview?.totals?.units} />
            <Stat label="Owners" value={saOverview?.totals?.owners} />
            <Stat label="Security" value={saOverview?.totals?.security} />
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-slate-900">Organizations & Units</div>

            {(saOverview?.organizations || []).map((org) => (
              <div key={org.org_id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-slate-900">
                      {org.org_name}{" "}
                      <span className="text-xs text-slate-500">#{org.org_id}</span>
                    </div>
                    <div className="text-sm text-slate-500">
                      {org.address || "No address"}
                      {org.phone_number ? ` • ${org.phone_number}` : ""}
                    </div>
                  </div>

                  <div className="flex gap-2 text-xs">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                      Units: {org.total_units ?? org.units?.length ?? 0}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                      Owners: {org.total_owners ?? 0}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                      Security: {org.total_security ?? org.security_users?.length ?? 0}
                    </span>
                  </div>
                </div>

                {/* units */}
                <div className="mt-3">
                  <div className="text-xs font-semibold text-slate-700 mb-2">Units</div>
                  {org.units?.length ? (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {org.units.map((u) => (
                        <div key={u.unit_id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="text-sm font-semibold text-slate-900">
                            {u.unit_name || `Unit #${u.unit_id}`}
                          </div>
                          <div className="text-xs text-slate-600">
                            Owner:{" "}
                            <span className="font-medium text-slate-900">{u.owner_name || "—"}</span>{" "}
                            <span className="text-slate-500">({u.owner_id || "-"})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">No units found</div>
                  )}
                </div>

                {/* security */}
                <div className="mt-4">
                  <div className="text-xs font-semibold text-slate-700 mb-2">Assigned Security Users</div>
                  {org.security_users?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {org.security_users.map((s) => (
                        <span
                          key={s.security_id}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700"
                        >
                          {s.security_name} ({s.security_id})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">No security assigned</div>
                  )}
                </div>
              </div>
            ))}

            {!saOverview?.organizations?.length ? (
              <div className="text-sm text-slate-500">No organizations found</div>
            ) : null}
          </div>
        </div>
      )}

      {/* ================= ADMIN HOME ================= */}
      {roleId === ROLE.ADMIN && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Admin Overview</h3>
              <p className="text-sm text-slate-500">Quick stats + pending work</p>
            </div>
            <button
              onClick={loadAdminOverview}
              disabled={adminBusy}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
            >
              {adminBusy ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="Organizations" value={orgs.length} />
            <Stat label="Units" value={units.length} />
            <Stat label="Owners" value={owners.length} />
            <Stat label="Security" value={securityUsers.length} />
            <Stat label="Pending Requests" value={pendingRequests.length} />
          </div>

          {/* Pending requests quick table */}
          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-900">Pending Key Requests (Top 10)</div>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Req ID</th>
                      <th className="px-4 py-3 text-left font-semibold">Key</th>
                      <th className="px-4 py-3 text-left font-semibold">Requested By</th>
                      <th className="px-4 py-3 text-left font-semibold">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(pendingRequests || []).slice(0, 10).map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3">{r.id}</td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-900">{r.key_id}</span>{" "}
                          <span className="text-slate-500">({r.key_code})</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-900">{r.requested_by_name}</span>{" "}
                          <span className="text-slate-500">({r.requested_by})</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{r.requested_at}</td>
                      </tr>
                    ))}
                    {!pendingRequests?.length ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                          No pending requests 🎉
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Orgs & Units */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-slate-900">Organizations & Units</div>

            <div className="space-y-3">
              {(adminOrgCards || []).map((org) => (
                <div key={org.org_id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-slate-900">
                        {org.org_name} <span className="text-xs text-slate-500">#{org.org_id}</span>
                      </div>
                      <div className="text-sm text-slate-500">
                        {org.address || "No address"}
                        {org.phone_number ? ` • ${org.phone_number}` : ""}
                      </div>
                    </div>

                    <div className="flex gap-2 text-xs">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                        Units: {org.total_units}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                        Owners: {org.total_owners}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                        Security: {org.total_security}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="text-xs font-semibold text-slate-700 mb-2">Units</div>
                    {org.units?.length ? (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {org.units.map((u) => (
                          <div key={u.unit_id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="text-sm font-semibold text-slate-900">
                              {u.unit_name || `Unit #${u.unit_id}`}
                            </div>
                            <div className="text-xs text-slate-600">
                              Owner:{" "}
                              <span className="font-medium text-slate-900">{u.owner_name || "—"}</span>{" "}
                              <span className="text-slate-500">({u.owner_id || "-"})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">No units found</div>
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="text-xs font-semibold text-slate-700 mb-2">Assigned Security Users</div>
                    {org.security_users?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {org.security_users.map((s) => (
                          <span
                            key={`${org.org_id}-${s.security_id}`}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700"
                          >
                            {s.security_name} ({s.security_id})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">No security assigned</div>
                    )}
                  </div>
                </div>
              ))}

              {!adminOrgCards?.length ? (
                <div className="text-sm text-slate-500">No organizations found</div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Cards (tools) */}
      {(roleId === ROLE.ADMIN || roleId === ROLE.SUPER_ADMIN) && (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-900">Admin Tools</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card to="/admin/requests" title="Approve / Reject Requests" desc="Manage all key requests." />
            <Card to="/admin/orgs" title="Organizations" desc="Create and manage organizations." />
            <Card to="/admin/units" title="Units" desc="Create units and assign owners." />
            <Card to="/admin/keys" title="Keys" desc="Register and manage keys." />
            <Card to="/admin/reports" title="Reports" desc="Issued keys and audit logs." />
          </div>
        </div>
      )}

      {roleId === ROLE.SUPER_ADMIN && (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-900">Super Admin Tools</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card to="/superadmin/users" title="Users" desc="Create/manage users." />
            <Card to="/superadmin/roles" title="Roles" desc="View role list." />
            <Card to="/superadmin/security-assign" title="Security Assign" desc="Assign security to orgs." />
          </div>
        </div>
      )}

      {roleId === ROLE.OWNER && (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-900">Owner Tools</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card to="/owner/units" title="My Units" desc="View your units." />
            <Card to="/owner/keys" title="My Keys" desc="View keys in your units." />
            <Card to="/owner/requests" title="My Requests" desc="Create and track requests." />
            <Card to="/owner/notifications" title="Notifications" desc="View alerts and updates." />
          </div>
        </div>
      )}

      {roleId === ROLE.SECURITY && (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-900">Security Tools</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card to="/security/orgs" title="Assigned Orgs" desc="View your assigned orgs." />
            <Card to="/security/open" title="Open Transactions" desc="Keys issued and not returned." />
            <Card to="/security/issue" title="Issue Key" desc="Issue approved key to user." />
            <Card to="/security/return" title="Return Key" desc="Return by key or transaction id." />
          </div>
        </div>
      )}
    </div>
  );
}
