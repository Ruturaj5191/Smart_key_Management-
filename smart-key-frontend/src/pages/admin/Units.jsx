import { useEffect, useMemo, useState } from "react";
import api from "../../api/client";

function cx(...c) {
  return c.filter(Boolean).join(" ");
}

export default function Units() {
  const [rows, setRows] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [owners, setOwners] = useState([]);

  const [orgId, setOrgId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [unitName, setUnitName] = useState("");
  const [busy, setBusy] = useState(false);

  const loadUnits = async () => {
    const res = await api.get("/admin/units");
    setRows(res.data.data || []);
  };

  const loadOrgs = async () => {
    const res = await api.get("/admin/orgs");
    setOrgs(res.data.data || []);
  };

  // ✅ Owners dropdown needs API
  // Try: /superadmin/users?role_id=4 (recommended)
  // Fallback: /superadmin/users then filter role_id=4
  const loadOwners = async () => {
    try {
      const res = await api.get("/superadmin/users?role_id=4");
      setOwners(res.data.data || []);
      return;
    } catch (e) {
      try {
        const res2 = await api.get("/superadmin/users");
        const all = res2.data.data || [];
        setOwners(all.filter((u) => Number(u.role_id) === 4));
      } catch (e2) {
        // If you don’t have this API yet, dropdown will be empty
        setOwners([]);
      }
    }
  };

  const refreshAll = async () => {
    setBusy(true);
    try {
      await Promise.all([loadUnits(), loadOrgs(), loadOwners()]);
    } finally {
      setBusy(false);
    }
  };

  const create = async () => {
    if (!orgId) return alert("Select organization");
    if (!ownerId) return alert("Select owner");
    if (!unitName.trim()) return alert("Unit name required");

    setBusy(true);
    try {
      await api.post("/admin/units", {
        org_id: Number(orgId),
        owner_id: Number(ownerId),
        unit_name: unitName.trim(),
      });
      setUnitName("");
      await loadUnits();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Create failed");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const orgOptions = useMemo(
    () => [{ id: "", name: "Select organization" }, ...orgs],
    [orgs]
  );

  const ownerOptions = useMemo(() => {
    const base = [{ id: "", name: "Select owner (ROLE=OWNER)" }];
    return base.concat(owners.map((o) => ({ ...o, name: o.name || o.email })));
  }, [owners]);

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Units</h2>
          <p className="text-sm text-slate-500">
            Create units under organizations and assign owners
          </p>
        </div>

        <button
          onClick={refreshAll}
          disabled={busy}
          className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
        >
          {busy ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          {/* Org Select */}
          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Organization
            </label>
            <select
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              {orgOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id ? `${o.id} — ${o.name}` : o.name}
                </option>
              ))}
            </select>
          </div>

          {/* Owner Select */}
          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Owner (Role=OWNER)
            </label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              {ownerOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.id ? `${u.id} — ${u.name}` : u.name}
                </option>
              ))}
            </select>

            {owners.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                Owners list empty. If you don’t have `/superadmin/users` API yet, add it in backend.
              </p>
            )}
          </div>

          {/* Unit Name */}
          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Unit Name
            </label>
            <input
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              placeholder="Office-102"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {/* Button */}
          <div className="md:col-span-1 flex items-end">
            <button
              onClick={create}
              disabled={busy}
              className="h-10 w-full rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              Create Unit
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Organization</th>
                <th className="px-4 py-3 text-left font-semibold">Owner</th>
                <th className="px-4 py-3 text-left font-semibold">Unit Name</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{r.id}</td>
                  <td className="px-4 py-3">
                    {r.org_id} <span className="text-slate-500">({r.org_name})</span>
                  </td>
                  <td className="px-4 py-3">
                    {r.owner_id} <span className="text-slate-500">({r.owner_name})</span>
                  </td>
                  <td className="px-4 py-3">{r.unit_name || "-"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan="5">
                    No units found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
