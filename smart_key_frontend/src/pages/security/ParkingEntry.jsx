import { useEffect, useState } from "react";
import api from "../../api/client";

function TypeBadge({ type }) {
  const tone =
    type === "RESIDENT" ? "bg-blue-100 text-blue-700" :
    type === "VISITOR"  ? "bg-purple-100 text-purple-700" :
    "bg-orange-100 text-orange-700";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {type}
    </span>
  );
}

export default function ParkingEntry() {
  const [orgs, setOrgs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [slots, setSlots] = useState([]);
  const [activeLogs, setActiveLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // entry form
  const [form, setForm] = useState({
    slot_id: "",
    vehicle_number: "",
    driver_name: "",
    unit_id: "",
    type: "VISITOR",
  });

  const loadOrgs = async () => {
    try {
      const res = await api.get("/security/assigned-orgs");
      setOrgs(res.data.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load organizations");
    }
  };

  const loadSlots = async (orgId) => {
    if (!orgId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/parking/slots/${orgId}?limit=100`);
      const allSlots = res.data.data?.slots || [];
      setSlots(allSlots);

      // load active logs (vehicles currently parked)
      const dashRes = await api.get(`/parking/dashboard/${orgId}`);
      const logs = dashRes.data.data?.recent_logs?.filter(l => !l.exit_time) || [];
      setActiveLogs(logs);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load slots");
    } finally {
      setLoading(false);
    }
  };

  const handleEntry = async (e) => {
    e.preventDefault();
    if (!form.slot_id || !form.vehicle_number || !form.type) {
      setError("Slot, vehicle number, and type are required");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.post("/parking/entry", {
        ...form,
        slot_id: Number(form.slot_id),
        unit_id: form.unit_id ? Number(form.unit_id) : null,
      });
      alert("✅ Vehicle entry logged successfully");
      setForm({ slot_id: "", vehicle_number: "", driver_name: "", unit_id: "", type: "VISITOR" });
      loadSlots(selectedOrg);
    } catch (err) {
      setError(err?.response?.data?.message || "Entry failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExit = async (logId) => {
    if (!confirm("Confirm vehicle exit?")) return;
    setSubmitting(true);
    setError("");
    try {
      await api.put(`/parking/exit/${logId}`);
      alert("✅ Vehicle exit recorded");
      loadSlots(selectedOrg);
    } catch (err) {
      setError(err?.response?.data?.message || "Exit failed");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => { loadOrgs(); }, []);
  useEffect(() => { if (selectedOrg) loadSlots(selectedOrg); }, [selectedOrg]);

  const availableSlots = slots.filter(s => s.status === "AVAILABLE");

  return (
    <div className="space-y-5">
      {/* ── Org Selector ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-xl font-semibold text-slate-900">🚗 Parking Entry / Exit</h2>
          <p className="mt-1 text-sm text-slate-500">Select organization, log vehicle entry or mark exit</p>
        </div>
        <div className="px-6 py-5">
          <label className="text-sm font-medium text-slate-700">Organization</label>
          <select
            className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
          >
            <option value="">-- Select Organization --</option>
            {orgs.map(o => (
              <option key={o.org_id || o.id} value={o.org_id || o.id}>
                {o.org_name || o.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500">
          Loading parking data…
        </div>
      )}

      {/* ── Entry Form ───────────────────────────────────────── */}
      {selectedOrg && !loading && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h3 className="text-lg font-semibold text-slate-900">Log Vehicle Entry</h3>
            <p className="mt-1 text-sm text-slate-500">
              {availableSlots.length} slot(s) available
            </p>
          </div>
          <form onSubmit={handleEntry} className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Parking Slot *</label>
                <select
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  value={form.slot_id}
                  onChange={(e) => setForm({...form, slot_id: e.target.value})}
                  required
                >
                  <option value="">-- Select Slot --</option>
                  {availableSlots.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.slot_number} (Floor {s.floor}, {s.slot_type})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Vehicle Number *</label>
                <input
                  type="text"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  value={form.vehicle_number}
                  onChange={(e) => setForm({...form, vehicle_number: e.target.value.toUpperCase()})}
                  placeholder="e.g. MH12AB1234"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Driver Name</label>
                <input
                  type="text"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  value={form.driver_name}
                  onChange={(e) => setForm({...form, driver_name: e.target.value})}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Type *</label>
                <select
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  value={form.type}
                  onChange={(e) => setForm({...form, type: e.target.value})}
                >
                  <option value="VISITOR">Visitor</option>
                  <option value="RESIDENT">Resident</option>
                  <option value="DELIVERY">Delivery</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="h-10 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? "Logging…" : "Log Entry"}
            </button>
          </form>
        </div>
      )}

      {/* ── Active Vehicles (mark exit) ──────────────────────── */}
      {selectedOrg && !loading && activeLogs.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h3 className="text-lg font-semibold text-slate-900">Vehicles Currently Parked</h3>
            <p className="mt-1 text-sm text-slate-500">{activeLogs.length} vehicle(s) inside</p>
          </div>
          <div className="px-6 py-5">
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Slot</th>
                      <th className="px-4 py-3 text-left font-semibold">Vehicle</th>
                      <th className="px-4 py-3 text-left font-semibold">Driver</th>
                      <th className="px-4 py-3 text-left font-semibold">Type</th>
                      <th className="px-4 py-3 text-left font-semibold">Entry Time</th>
                      <th className="px-4 py-3 text-left font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeLogs.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {l.slot_number} <span className="text-slate-500">(F{l.floor})</span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">{l.vehicle_number}</td>
                        <td className="px-4 py-3 text-slate-700">{l.driver_name || "-"}</td>
                        <td className="px-4 py-3"><TypeBadge type={l.type} /></td>
                        <td className="px-4 py-3 text-slate-700">
                          {new Date(l.entry_time).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            disabled={submitting}
                            onClick={() => handleExit(l.id)}
                            className="h-9 rounded-xl bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                          >
                            Mark Exit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
