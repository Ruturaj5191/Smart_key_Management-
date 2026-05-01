import { useEffect, useState } from "react";
import api from "../../api/client";

export default function VisitorGateCheck() {
  const [orgs, setOrgs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [activeLogs, setActiveLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ visitor_phone: "", otp: "", vehicle_number: "" });

  const loadOrgs = async () => {
    try {
      const res = await api.get("/security/assigned-orgs");
      setOrgs(res.data.data || []);
    } catch (err) { setError(err?.response?.data?.message || "Failed to load orgs"); }
  };

  const loadActiveLogs = async (orgId) => {
    if (!orgId) return;
    setLoading(true);
    try {
      const res = await api.get(`/visitors/logs/${orgId}?limit=50`);
      setActiveLogs((res.data.data?.logs || []).filter(l => !l.exit_time));
    } catch { setActiveLogs([]); }
    finally { setLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!form.visitor_phone || !form.otp) { setError("Phone and OTP required"); return; }
    setSubmitting(true); setError(""); setSuccess("");
    try {
      const res = await api.post("/visitors/verify-otp", {
        visitor_phone: form.visitor_phone.trim(), otp: form.otp.trim(),
        vehicle_number: form.vehicle_number?.trim() || null,
      });
      const d = res.data.data;
      setSuccess(`✅ "${d.visitor_name}" verified! Log #${d.log_id}`);
      setForm({ visitor_phone: "", otp: "", vehicle_number: "" });
      if (selectedOrg) loadActiveLogs(selectedOrg);
    } catch (err) { setError(err?.response?.data?.message || "Verification failed"); }
    finally { setSubmitting(false); }
  };

  const handleExit = async (logId) => {
    if (!confirm("Confirm visitor exit?")) return;
    setSubmitting(true); setError(""); setSuccess("");
    try {
      await api.put(`/visitors/exit/${logId}`);
      setSuccess("✅ Visitor exit recorded");
      if (selectedOrg) loadActiveLogs(selectedOrg);
    } catch (err) { setError(err?.response?.data?.message || "Exit failed"); }
    finally { setSubmitting(false); }
  };

  useEffect(() => { loadOrgs(); }, []);
  useEffect(() => { if (selectedOrg) loadActiveLogs(selectedOrg); }, [selectedOrg]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-xl font-semibold text-slate-900">👤 Visitor Gate Check</h2>
          <p className="mt-1 text-sm text-slate-500">Verify visitor OTP, log entry & exit</p>
        </div>
        <div className="px-6 py-5">
          <label className="text-sm font-medium text-slate-700">Organization</label>
          <select className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}>
            <option value="">-- Select --</option>
            {orgs.map(o => <option key={o.org_id||o.id} value={o.org_id||o.id}>{o.org_name||o.name}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-semibold text-slate-900">Verify Visitor OTP</h3>
        </div>
        <form onSubmit={handleVerify} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Phone *</label>
              <input type="text" className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" value={form.visitor_phone} onChange={e => setForm({...form, visitor_phone: e.target.value.replace(/\D/g,"")})} placeholder="9876543210" maxLength={15} required />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">OTP *</label>
              <input type="text" className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm tracking-widest font-mono" value={form.otp} onChange={e => setForm({...form, otp: e.target.value.replace(/\D/g,"").slice(0,6)})} placeholder="••••••" maxLength={6} required />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Vehicle</label>
              <input type="text" className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" value={form.vehicle_number} onChange={e => setForm({...form, vehicle_number: e.target.value.toUpperCase()})} placeholder="Optional" />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="h-10 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">{submitting ? "Verifying…" : "Verify & Log Entry"}</button>
        </form>
      </div>

      {loading && <div className="rounded-xl border border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500">Loading…</div>}

      {!loading && activeLogs.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h3 className="text-lg font-semibold text-slate-900">Visitors Inside ({activeLogs.length})</h3>
          </div>
          <div className="px-6 py-5">
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Visitor</th>
                      <th className="px-4 py-3 text-left font-semibold">Phone</th>
                      <th className="px-4 py-3 text-left font-semibold">Unit</th>
                      <th className="px-4 py-3 text-left font-semibold">Entry</th>
                      <th className="px-4 py-3 text-left font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeLogs.map(l => (
                      <tr key={l.log_id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-medium text-slate-900">{l.visitor_name}</td>
                        <td className="px-4 py-3 text-slate-700">{l.visitor_phone}</td>
                        <td className="px-4 py-3 text-slate-700">{l.unit_name||"-"}</td>
                        <td className="px-4 py-3 text-slate-700">{new Date(l.entry_time).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <button disabled={submitting} onClick={() => handleExit(l.log_id)} className="h-9 rounded-xl bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60">Mark Exit</button>
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
