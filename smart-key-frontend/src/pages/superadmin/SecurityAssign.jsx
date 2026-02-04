import { useEffect, useMemo, useState } from "react";
import api from "../../api/client";

function RoleBadge({ roleId }) {
  const id = Number(roleId);
  const label =
    id === 1 ? "SUPER_ADMIN" :
    id === 2 ? "ADMIN" :
    id === 3 ? "SECURITY" :
    id === 4 ? "OWNER" : `ROLE_${id}`;

  const tone =
    id === 3 ? "bg-sky-100 text-sky-700" :
    "bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {label}
    </span>
  );
}

export default function SecurityAssign() {
  const [orgId, setOrgId] = useState("");
  const [userId, setUserId] = useState("");

  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);

  // ✅ NEW: dropdown data
  const [orgs, setOrgs] = useState([]);
  const [securityUsers, setSecurityUsers] = useState([]);

  // ---------------- LOADERS ----------------
  const loadAssignments = async () => {
    const res = await api.get("/admin/security/assignments");
    setRows(res.data.data || []);
  };

  // ✅ NEW: load org list for dropdown
  // Backend should return: [{id, name}] or [{id, org_name/name}]
  const loadOrgs = async () => {
    // change endpoint if your project uses a different org list route
    const res = await api.get("/admin/orgs");
    setOrgs(res.data.data || []);
  };

  // ✅ NEW: load only SECURITY users for dropdown
  // Backend should return: [{id, name, role_id}] where role_id=3
  const loadSecurityUsers = async () => {
    // change endpoint if your project uses a different user list route
    const res = await api.get("/admin/users?role_id=3");
    setSecurityUsers(res.data.data || []);
  };

  const refreshAll = async () => {
    await Promise.allSettled([loadAssignments(), loadOrgs(), loadSecurityUsers()]);
  };

  // ---------------- ACTION ----------------
  const assign = async () => {
    if (!orgId || !userId) return alert("org_id and user_id required");

    setBusy(true);
    try {
      await api.post("/admin/security/assign", {
        org_id: Number(orgId),
        user_id: Number(userId),
      });

      setOrgId("");
      setUserId("");
      await loadAssignments();
      alert("Assigned ✅");
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Assign failed");
    } finally {
      setBusy(false);
    }
  };

  // ---------------- OPTIONS ----------------
  const orgOptions = useMemo(
    () =>
      orgs.map((o) => ({
        id: o.id,
        label: `${o.name || o.org_name || "ORG"} (ID: ${o.id})`,
      })),
    [orgs]
  );

  const userOptions = useMemo(
    () =>
      securityUsers.map((u) => ({
        id: u.id,
        label: `${u.name || u.user_name || "Security"} (ID: ${u.id})`,
      })),
    [securityUsers]
  );

  useEffect(() => {
    refreshAll();
  }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Security Assignments</h2>
            <p className="mt-1 text-sm text-slate-500">
              Assign Security user (role_id=3) to organizations
            </p>
          </div>

          <button
            onClick={refreshAll}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        <div className="px-6 py-5">
          {/* ✅ Dropdowns */}
          <div className="grid gap-3 md:grid-cols-3">
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-slate-200"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
            >
              <option value="">Select Organization</option>
              {orgOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-slate-200"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              <option value="">Select Security User</option>
              {userOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>

            <button
              onClick={assign}
              disabled={busy}
              className="h-10 w-full rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800
                         disabled:opacity-60"
            >
              {busy ? "Assigning..." : "Assign"}
            </button>
          </div>

          {/* ✅ Assignments table */}
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Org</th>
                    <th className="px-4 py-3 text-left font-semibold">User</th>
                    <th className="px-4 py-3 text-left font-semibold">Role</th>
                    <th className="px-4 py-3 text-left font-semibold">Assigned At</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">{r.id}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{r.org_id}</span>{" "}
                        <span className="text-slate-500">({r.org_name})</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{r.user_id}</span>{" "}
                        <span className="text-slate-500">({r.user_name})</span>
                      </td>
                      <td className="px-4 py-3">
                        <RoleBadge roleId={r.role_id} />
                      </td>
                      <td className="px-4 py-3 text-slate-700">{r.assigned_at}</td>
                    </tr>
                  ))}

                  {!rows.length ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No assignments found
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            If dropdown is empty: ensure backend has <code>/admin/orgs</code> and <code>/admin/users?role_id=3</code>.
          </div>
        </div>
      </div>
    </div>
  );
}
