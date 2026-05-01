import { useEffect, useState } from "react";
import api from "../../api/client";

function SeverityBadge({ severity }) {
  const tone = severity === "HIGH" ? "bg-rose-100 text-rose-700" : severity === "MEDIUM" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{severity}</span>;
}
function TypeBadge({ type }) {
  const labels = { OVERDUE_KEY: "🔑 Overdue Key", SUSPICIOUS_ACCESS: "⚠️ Suspicious", PARKING_ANOMALY: "🚗 Parking", UNUSUAL_VISITOR: "👤 Visitor" };
  return <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{labels[type] || type}</span>;
}

export default function AIAlerts() {
  const [orgs, setOrgs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState({ alert_type: "", severity: "", is_read: "" });
  const limit = 20;

  const loadOrgs = async () => {
    try { const res = await api.get("/admin/orgs"); setOrgs(res.data.data || []); }
    catch (err) { setError(err?.response?.data?.message || "Failed to load orgs"); }
  };

  const loadAlerts = async (orgId, p = 1) => {
    if (!orgId) return;
    setLoading(true); setError("");
    try {
      let url = `/ai/alerts/${orgId}?page=${p}&limit=${limit}`;
      if (filter.alert_type) url += `&alert_type=${filter.alert_type}`;
      if (filter.severity) url += `&severity=${filter.severity}`;
      if (filter.is_read !== "") url += `&is_read=${filter.is_read}`;
      const res = await api.get(url);
      const d = res.data.data;
      setAlerts(d?.alerts || []); setTotal(d?.total || 0); setUnread(d?.unread || 0); setPage(p);
    } catch (err) { setError(err?.response?.data?.message || "Failed to load alerts"); }
    finally { setLoading(false); }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/ai/alerts/${id}/read`);
      loadAlerts(selectedOrg, page);
    } catch (err) { setError(err?.response?.data?.message || "Failed"); }
  };

  useEffect(() => { loadOrgs(); }, []);
  useEffect(() => { if (selectedOrg) loadAlerts(selectedOrg, 1); }, [selectedOrg]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-xl font-semibold text-slate-900">🤖 AI Alerts</h2>
          <p className="mt-1 text-sm text-slate-500">Automated security & anomaly alerts</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
            <div>
              <label className="text-sm font-medium text-slate-700">Organization</label>
              <select className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}>
                <option value="">-- Select --</option>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Type</label>
              <select className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={filter.alert_type} onChange={e => setFilter({...filter, alert_type: e.target.value})}>
                <option value="">All</option>
                <option value="OVERDUE_KEY">Overdue Key</option>
                <option value="SUSPICIOUS_ACCESS">Suspicious Access</option>
                <option value="PARKING_ANOMALY">Parking Anomaly</option>
                <option value="UNUSUAL_VISITOR">Unusual Visitor</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Severity</label>
              <select className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={filter.severity} onChange={e => setFilter({...filter, severity: e.target.value})}>
                <option value="">All</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Read</label>
              <select className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={filter.is_read} onChange={e => setFilter({...filter, is_read: e.target.value})}>
                <option value="">All</option>
                <option value="false">Unread</option>
                <option value="true">Read</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={() => loadAlerts(selectedOrg, 1)} disabled={!selectedOrg} className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">Filter</button>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {selectedOrg && unread > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 font-medium">
          ⚠️ {unread} unread alert(s) require attention
        </div>
      )}

      {loading && <div className="rounded-xl border border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500">Loading…</div>}

      {!loading && selectedOrg && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-6 py-5">
            <div className="space-y-3">
              {alerts.map(a => (
                <div key={a.id} className={`rounded-xl border p-4 ${a.is_read ? "border-slate-200 bg-white" : "border-amber-200 bg-amber-50/50"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <TypeBadge type={a.alert_type} />
                        <SeverityBadge severity={a.severity} />
                        {!a.is_read && <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" />}
                      </div>
                      <p className="text-sm text-slate-800">{a.message}</p>
                      <p className="mt-1 text-xs text-slate-500">{new Date(a.created_at).toLocaleString()}</p>
                    </div>
                    {!a.is_read && (
                      <button onClick={() => markRead(a.id)} className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 shrink-0">Mark Read</button>
                    )}
                  </div>
                </div>
              ))}
              {!alerts.length && <div className="py-8 text-center text-sm text-slate-500">No alerts found</div>}
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button disabled={page <= 1} onClick={() => loadAlerts(selectedOrg, page - 1)} className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-medium disabled:opacity-40">Prev</button>
                <span className="text-sm text-slate-600">{page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => loadAlerts(selectedOrg, page + 1)} className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-medium disabled:opacity-40">Next</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
