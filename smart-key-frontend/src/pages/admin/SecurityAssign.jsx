import { useEffect, useState } from "react";
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
    id === 2 ? "bg-indigo-100 text-indigo-700" :
    id === 1 ? "bg-slate-200 text-slate-800" :
    id === 4 ? "bg-emerald-100 text-emerald-700" :
    "bg-slate-100 text-slate-600";

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

  const load = async () => {
    const res = await api.get("/admin/security/assignments");
    setRows(res.data.data);
  };

  const assign = async () => {
    if (!orgId || !userId) return alert("org_id and user_id are required");

    setBusy(true);
    try {
      await api.post("/admin/security/assign", {
        org_id: Number(orgId),
        user_id: Number(userId),
      });
      setOrgId("");
      setUserId("");
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Assign failed");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-5">
      {/* Header + Form */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Security Assignments</h2>
            <p className="mt-1 text-sm text-slate-500">
              Assign a Security user (role_id = 3) to an Organization
            </p>
          </div>

          <button
            onClick={load}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm
                         placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="org_id (example: 1)"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
            />

            <input
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm
                         placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="security user_id (role_id=3)"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />

            <button
              onClick={assign}
              disabled={busy}
              className="h-10 w-full rounded-xl bg-slate-900 text-white text-sm font-medium
                         hover:bg-slate-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? "Assigning..." : "Assign"}
            </button>
          </div>

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
                        <span className="font-medium text-slate-900">{r.org_id}</span>{" "}
                        <span className="text-slate-500">({r.org_name})</span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{r.user_id}</span>{" "}
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
                      <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                        No security assignments found
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
