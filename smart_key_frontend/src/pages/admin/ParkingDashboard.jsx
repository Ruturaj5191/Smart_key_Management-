import { useEffect, useState } from "react";
import api from "../../api/client";

function StatusBadge({ status }) {
  const tone = status === "AVAILABLE" ? "bg-emerald-100 text-emerald-700" : status === "OCCUPIED" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{status}</span>;
}

export default function ParkingDashboard() {
  const [orgs, setOrgs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // slot creation form
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ slot_number: "", slot_type: "FOUR_WHEELER", floor: "G" });

  const loadOrgs = async () => {
    try { const res = await api.get("/admin/orgs"); setOrgs(res.data.data || []); }
    catch (err) { setError(err?.response?.data?.message || "Failed to load orgs"); }
  };

  const loadDashboard = async (orgId) => {
    if (!orgId) return;
    setLoading(true); setError("");
    try { const res = await api.get(`/parking/dashboard/${orgId}`); setDashboard(res.data.data); }
    catch (err) { setError(err?.response?.data?.message || "Failed to load dashboard"); }
    finally { setLoading(false); }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!form.slot_number) { setError("Slot number required"); return; }
    setSubmitting(true); setError("");
    try {
      await api.post("/parking/slots", { org_id: Number(selectedOrg), slot_number: form.slot_number.trim(), slot_type: form.slot_type, floor: form.floor || "G" });
      alert("✅ Slot created!");
      setForm({ slot_number: "", slot_type: "FOUR_WHEELER", floor: "G" }); setShowForm(false);
      loadDashboard(selectedOrg);
    } catch (err) { setError(err?.response?.data?.message || "Failed to create slot"); }
    finally { setSubmitting(false); }
  };

  useEffect(() => { loadOrgs(); }, []);
  useEffect(() => { if (selectedOrg) loadDashboard(selectedOrg); }, [selectedOrg]);

  const s = dashboard?.summary || {};

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5 flex items-start justify-between">
          <div><h2 className="text-xl font-semibold text-slate-900">🅿️ Parking Dashboard</h2><p className="mt-1 text-sm text-slate-500">Occupancy, stats & slot management</p></div>
          {selectedOrg && <button onClick={() => setShowForm(!showForm)} className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800">{showForm ? "Cancel" : "+ Add Slot"}</button>}
        </div>
        <div className="px-6 py-5">
          <label className="text-sm font-medium text-slate-700">Organization</label>
          <select className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}>
            <option value="">-- Select --</option>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {/* ── Add Slot Form ─── */}
      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <form onSubmit={handleCreateSlot} className="px-6 py-5 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Add Parking Slot</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div><label className="text-sm font-medium text-slate-700">Slot Number *</label><input type="text" className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" value={form.slot_number} onChange={e => setForm({...form, slot_number: e.target.value})} placeholder="A-01" required /></div>
              <div><label className="text-sm font-medium text-slate-700">Type *</label><select className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={form.slot_type} onChange={e => setForm({...form, slot_type: e.target.value})}><option value="FOUR_WHEELER">Four Wheeler</option><option value="TWO_WHEELER">Two Wheeler</option></select></div>
              <div><label className="text-sm font-medium text-slate-700">Floor</label><input type="text" className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" value={form.floor} onChange={e => setForm({...form, floor: e.target.value})} placeholder="G" /></div>
            </div>
            <button type="submit" disabled={submitting} className="h-10 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">{submitting ? "Creating…" : "Create Slot"}</button>
          </form>
        </div>
      )}

      {loading && <div className="rounded-xl border border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500">Loading dashboard…</div>}

      {dashboard && !loading && (
        <>
          {/* ── Stats Cards ─── */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Total Slots", value: s.total_slots || 0, color: "text-slate-900" },
              { label: "Available", value: s.available || 0, color: "text-emerald-600" },
              { label: "Occupied", value: s.occupied || 0, color: "text-rose-600" },
              { label: "Reserved", value: s.reserved || 0, color: "text-amber-600" },
            ].map(c => (
              <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">{c.label}</p>
                <p className={`mt-1 text-2xl font-bold ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Today's Entries</p><p className="mt-1 text-2xl font-bold text-slate-900">{dashboard.today?.entries || 0}</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Today's Exits</p><p className="mt-1 text-2xl font-bold text-slate-900">{dashboard.today?.exits || 0}</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Today's Bookings</p><p className="mt-1 text-2xl font-bold text-slate-900">{dashboard.today?.bookings || 0}</p></div>
          </div>

          {/* ── Recent Logs ─── */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5"><h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3></div>
            <div className="px-6 py-5">
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Slot</th>
                        <th className="px-4 py-3 text-left font-semibold">Vehicle</th>
                        <th className="px-4 py-3 text-left font-semibold">Type</th>
                        <th className="px-4 py-3 text-left font-semibold">Entry</th>
                        <th className="px-4 py-3 text-left font-semibold">Exit</th>
                        <th className="px-4 py-3 text-left font-semibold">Guard</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(dashboard.recent_logs || []).map(l => (
                        <tr key={l.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-medium text-slate-900">{l.slot_number}</td>
                          <td className="px-4 py-3 text-slate-900">{l.vehicle_number}</td>
                          <td className="px-4 py-3 text-slate-700">{l.type}</td>
                          <td className="px-4 py-3 text-slate-700 text-xs">{new Date(l.entry_time).toLocaleString()}</td>
                          <td className="px-4 py-3 text-slate-700 text-xs">{l.exit_time ? new Date(l.exit_time).toLocaleString() : <span className="text-emerald-600 font-medium">Inside</span>}</td>
                          <td className="px-4 py-3 text-slate-700">{l.security_name || "-"}</td>
                        </tr>
                      ))}
                      {!(dashboard.recent_logs || []).length && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No activity yet</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
