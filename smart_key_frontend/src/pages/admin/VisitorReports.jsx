import { useEffect, useState } from "react";
import api from "../../api/client";

export default function VisitorReports() {
  const [orgs, setOrgs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const limit = 20;

  const loadOrgs = async () => {
    try { const res = await api.get("/admin/orgs"); setOrgs(res.data.data || []); }
    catch (err) { setError(err?.response?.data?.message || "Failed to load orgs"); }
  };

  const loadLogs = async (orgId, p = 1) => {
    if (!orgId) return;
    setLoading(true); setError("");
    try {
      let url = `/visitors/logs/${orgId}?page=${p}&limit=${limit}`;
      if (dateFrom) url += `&date_from=${dateFrom}`;
      if (dateTo) url += `&date_to=${dateTo}`;
      const res = await api.get(url);
      setLogs(res.data.data?.logs || []);
      setTotal(res.data.data?.total || 0);
      setPage(p);
    } catch (err) { setError(err?.response?.data?.message || "Failed to load logs"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadOrgs(); }, []);
  useEffect(() => { if (selectedOrg) loadLogs(selectedOrg, 1); }, [selectedOrg]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-xl font-semibold text-slate-900">📋 Visitor Reports</h2>
          <p className="mt-1 text-sm text-slate-500">View all visitor entry/exit history</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Organization</label>
              <select className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}>
                <option value="">-- Select --</option>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">From</label>
              <input type="date" className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">To</label>
              <input type="date" className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button onClick={() => loadLogs(selectedOrg, 1)} disabled={!selectedOrg} className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">Filter</button>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {loading && <div className="rounded-xl border border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500">Loading…</div>}

      {!loading && selectedOrg && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h3 className="text-lg font-semibold text-slate-900">Logs ({total})</h3>
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
                      <th className="px-4 py-3 text-left font-semibold">Purpose</th>
                      <th className="px-4 py-3 text-left font-semibold">Entry</th>
                      <th className="px-4 py-3 text-left font-semibold">Exit</th>
                      <th className="px-4 py-3 text-left font-semibold">Guard</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map(l => (
                      <tr key={l.log_id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-medium text-slate-900">{l.visitor_name}</td>
                        <td className="px-4 py-3 text-slate-700">{l.visitor_phone}</td>
                        <td className="px-4 py-3 text-slate-700">{l.unit_name}</td>
                        <td className="px-4 py-3 text-slate-700">{l.purpose || "-"}</td>
                        <td className="px-4 py-3 text-slate-700 text-xs">{new Date(l.entry_time).toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs">{l.exit_time ? new Date(l.exit_time).toLocaleString() : <span className="text-emerald-600 font-medium">Inside</span>}</td>
                        <td className="px-4 py-3 text-slate-700">{l.security_name || "-"}</td>
                      </tr>
                    ))}
                    {!logs.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No visitor logs</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button disabled={page <= 1} onClick={() => loadLogs(selectedOrg, page - 1)} className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-medium disabled:opacity-40">Prev</button>
                <span className="text-sm text-slate-600">{page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => loadLogs(selectedOrg, page + 1)} className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-medium disabled:opacity-40">Next</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
