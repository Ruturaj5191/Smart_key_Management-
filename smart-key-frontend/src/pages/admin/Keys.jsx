import { useEffect, useMemo, useState } from "react";
import api from "../../api/client";

function StatusBadge({ status }) {
  const tone =
    status === "AVAILABLE"
      ? "bg-emerald-100 text-emerald-700"
      : status === "ISSUED"
      ? "bg-amber-100 text-amber-700"
      : "bg-rose-100 text-rose-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {status}
    </span>
  );
}

export default function Keys() {
  const [rows, setRows] = useState([]);
  const [units, setUnits] = useState([]);

  const [unitId, setUnitId] = useState("");
  const [unitSearch, setUnitSearch] = useState("");

  const [keyCode, setKeyCode] = useState("");
  const [keyType, setKeyType] = useState("MAIN");
  const [lockerNo, setLockerNo] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [keysRes, unitsRes] = await Promise.all([
      api.get("/admin/keys"),
      api.get("/admin/units"),
    ]);

    setRows(keysRes.data.data || []);
    setUnits(unitsRes.data.data || []);
  };

  const create = async () => {
    if (!unitId || !keyCode.trim()) return alert("unit is required and key_code is required");

    setBusy(true);
    try {
      await api.post("/admin/keys", {
        unit_id: Number(unitId),
        key_code: keyCode.trim(),
        key_type: keyType,
        locker_no: lockerNo.trim() || null,
      });

      setKeyCode("");
      setLockerNo("");
      setKeyType("MAIN");
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Create key failed");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ✅ Filter units list for dropdown search
  const unitOptions = useMemo(() => {
    const q = unitSearch.trim().toLowerCase();
    const base = units;

    if (!q) return base;

    return base.filter((u) => {
      const s = `${u.id} ${u.unit_name || ""} ${u.org_name || ""} ${u.owner_name || ""}`.toLowerCase();
      return s.includes(q);
    });
  }, [units, unitSearch]);

  // ✅ Show selected unit label
  const selectedUnitLabel = useMemo(() => {
    const u = units.find((x) => String(x.id) === String(unitId));
    if (!u) return "";
    return `${u.id} — ${u.unit_name || "-"} (Org: ${u.org_name || u.org_id}, Owner: ${u.owner_name || u.owner_id})`;
  }, [units, unitId]);

  return (
    <div className="space-y-5">
      {/* Header + Form */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Keys</h2>
            <p className="mt-1 text-sm text-slate-500">Register and manage keys</p>
          </div>

          <button
            onClick={load}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          {/* Unit search + select */}
          <div className="grid gap-3 md:grid-cols-5">
            <input
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm
                         placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 md:col-span-2"
              placeholder="Search unit (office / org / owner / id)"
              value={unitSearch}
              onChange={(e) => setUnitSearch(e.target.value)}
            />

            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-slate-200 md:col-span-3"
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
            >
              <option value="">Select Unit</option>
              {unitOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.id} — {u.unit_name || "-"} (Org: {u.org_name || u.org_id})
                </option>
              ))}
            </select>
          </div>

          {unitId ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <span className="font-medium">Selected:</span> {selectedUnitLabel}
            </div>
          ) : null}

          {/* Key create form */}
          <div className="grid gap-3 md:grid-cols-5">
            <input
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm
                         placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 md:col-span-2"
              placeholder="key_code (unique)"
              value={keyCode}
              onChange={(e) => setKeyCode(e.target.value)}
            />

            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-slate-200"
              value={keyType}
              onChange={(e) => setKeyType(e.target.value)}
            >
              <option value="MAIN">MAIN</option>
              <option value="SPARE">SPARE</option>
              <option value="EMERGENCY">EMERGENCY</option>
            </select>

            <input
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm
                         placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="locker_no (optional)"
              value={lockerNo}
              onChange={(e) => setLockerNo(e.target.value)}
            />

            <button
              onClick={create}
              disabled={busy}
              className="h-10 w-full rounded-xl bg-slate-900 text-white text-sm font-medium
                         hover:bg-slate-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? "Creating..." : "Create Key"}
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Tip: Use the search box to quickly find the unit by name or organization.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Key Code</th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-left font-semibold">Locker</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Org</th>
                <th className="px-4 py-3 text-left font-semibold">Unit</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">{r.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{r.key_code}</td>
                  <td className="px-4 py-3">{r.key_type}</td>
                  <td className="px-4 py-3">{r.locker_no || "-"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-900">{r.org_id}</span>{" "}
                    <span className="text-slate-500">({r.org_name})</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-900">{r.unit_id}</span>{" "}
                    <span className="text-slate-500">({r.unit_name})</span>
                  </td>
                </tr>
              ))}

              {!rows.length ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>
                    No keys found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
