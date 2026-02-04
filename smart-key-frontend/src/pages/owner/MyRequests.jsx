import { useEffect, useState } from "react";
import api from "../../api/client";

function StatusBadge({ status }) {
  const tone =
    status === "APPROVED"
      ? "bg-emerald-100 text-emerald-700"
      : status === "REJECTED"
      ? "bg-rose-100 text-rose-700"
      : "bg-amber-100 text-amber-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {status}
    </span>
  );
}

export default function MyRequests() {
  const [units, setUnits] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);

  const loadUnits = async () => {
    const res = await api.get("/owner/units");
    setUnits(res.data.data || []);
  };

  // ✅ FIX: use /owner/requests
  const loadRequests = async () => {
    const res = await api.get("/owner/requests");
    setRows(res.data.data || []);
  };

  const create = async () => {
    if (!selectedUnitId) return alert("Select a unit first");

    setBusy(true);
    try {
      // ✅ FIX: use /owner/requests
      await api.post("/owner/requests", { unit_id: Number(selectedUnitId) });

      setSelectedUnitId("");
      await loadRequests();
      alert("Request created ✅");
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadUnits();
    loadRequests();
  }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-xl font-semibold text-slate-900">My Requests</h2>
          <p className="mt-1 text-sm text-slate-500">
            Create request by selecting unit (office). System picks an AVAILABLE key automatically.
          </p>
        </div>

        <div className="px-6 py-5">
          <div className="grid gap-3 md:grid-cols-3">
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Select Unit</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unit_name} ({u.org_name})
                </option>
              ))}
            </select>

            <button
              onClick={create}
              disabled={busy}
              className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white
                         hover:bg-slate-800 disabled:opacity-60"
            >
              {busy ? "Creating..." : "Create Request"}
            </button>

            <button
              onClick={() => {
                loadUnits();
                loadRequests();
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Key</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Requested At</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">{r.id}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{r.key_id}</span>{" "}
                        <span className="text-slate-500">({r.key_code})</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-700">{r.requested_at}</td>
                    </tr>
                  ))}

                  {!rows.length ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        No requests found
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
