import { useEffect, useState } from "react";
import api from "../../api/client";

function Badge({ status }) {
  const tone = status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : status === "EXPIRED" ? "bg-slate-100 text-slate-600" : status === "REJECTED" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{status}</span>;
}

export default function VisitorPreApprove() {
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ visitor_name: "", visitor_phone: "", purpose: "", expected_date: "" });

  const loadUnits = async () => {
    try { const res = await api.get("/owner/units"); setUnits(res.data.data || []); }
    catch (err) { setError(err?.response?.data?.message || "Failed to load units"); }
  };

  const loadVisitors = async (unitId) => {
    if (!unitId) return;
    setLoading(true); setError("");
    try { const res = await api.get(`/visitors/my/${unitId}?limit=50`); setVisitors(res.data.data?.visitors || []); }
    catch (err) { setError(err?.response?.data?.message || "Failed to load visitors"); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUnit) { setError("Select a unit first"); return; }
    if (!form.visitor_name || !form.visitor_phone || !form.expected_date) { setError("Name, phone, and date are required"); return; }
    setSubmitting(true); setError(""); setSuccess("");
    try {
      const res = await api.post("/visitors/pre-approve", { unit_id: Number(selectedUnit), ...form });
      const d = res.data.data;
      setSuccess(`✅ Visitor pre-approved! OTP: ${d.otp} (valid 10 min). Share with ${d.visitor_name}.`);
      setForm({ visitor_name: "", visitor_phone: "", purpose: "", expected_date: "" });
      loadVisitors(selectedUnit);
    } catch (err) { setError(err?.response?.data?.message || "Failed to pre-approve"); }
    finally { setSubmitting(false); }
  };

  const handleCancel = async (id) => {
    if (!confirm("Cancel this visitor?")) return;
    setSubmitting(true); setError(""); setSuccess("");
    try {
      await api.delete(`/visitors/${id}`);
      setSuccess("✅ Visitor cancelled");
      loadVisitors(selectedUnit);
    } catch (err) { setError(err?.response?.data?.message || "Cancel failed"); }
    finally { setSubmitting(false); }
  };

  useEffect(() => { loadUnits(); }, []);
  useEffect(() => { if (selectedUnit) loadVisitors(selectedUnit); }, [selectedUnit]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-xl font-semibold text-slate-900">👤 Pre-Approve Visitor</h2>
          <p className="mt-1 text-sm text-slate-500">Add expected visitors and share OTP with them</p>
        </div>
        <div className="px-6 py-5">
          <label className="text-sm font-medium text-slate-700">Your Unit</label>
          <select className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)}>
            <option value="">-- Select Unit --</option>
            {units.map(u => <option key={u.id} value={u.id}>{u.unit_name} ({u.org_name})</option>)}
          </select>
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      {selectedUnit && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5"><h3 className="text-lg font-semibold text-slate-900">Add Visitor</h3></div>
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Visitor Name *</label>
                <input type="text" className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" value={form.visitor_name} onChange={e => setForm({...form, visitor_name: e.target.value})} required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Phone *</label>
                <input type="text" className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" value={form.visitor_phone} onChange={e => setForm({...form, visitor_phone: e.target.value.replace(/\D/g,"")})} placeholder="9876543210" maxLength={15} required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Purpose</label>
                <input type="text" className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} placeholder="Optional" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Expected Date *</label>
                <input type="date" className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" value={form.expected_date} onChange={e => setForm({...form, expected_date: e.target.value})} min={new Date().toISOString().split("T")[0]} required />
              </div>
            </div>
            <button type="submit" disabled={submitting} className="h-10 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">{submitting ? "Saving…" : "Pre-Approve & Get OTP"}</button>
          </form>
        </div>
      )}

      {loading && <div className="rounded-xl border border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500">Loading visitors…</div>}

      {selectedUnit && !loading && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5 flex items-start justify-between">
            <div><h3 className="text-lg font-semibold text-slate-900">Your Visitors</h3><p className="mt-1 text-sm text-slate-500">{visitors.length} visitor(s)</p></div>
            <button onClick={() => loadVisitors(selectedUnit)} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50">Refresh</button>
          </div>
          <div className="px-6 py-5">
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Phone</th>
                      <th className="px-4 py-3 text-left font-semibold">Date</th>
                      <th className="px-4 py-3 text-left font-semibold">OTP</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visitors.map(v => (
                      <tr key={v.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-medium text-slate-900">{v.visitor_name}</td>
                        <td className="px-4 py-3 text-slate-700">{v.visitor_phone}</td>
                        <td className="px-4 py-3 text-slate-700">{new Date(v.expected_date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-mono tracking-widest text-slate-900">{v.otp || "—"}</td>
                        <td className="px-4 py-3"><Badge status={v.status} /></td>
                        <td className="px-4 py-3">
                          {["PENDING","APPROVED"].includes(v.status) && (
                            <button disabled={submitting} onClick={() => handleCancel(v.id)} className="h-9 rounded-xl border border-rose-200 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60">Cancel</button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!visitors.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No visitors</td></tr>}
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
