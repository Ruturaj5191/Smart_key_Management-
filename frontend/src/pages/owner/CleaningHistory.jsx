import { useEffect, useState } from "react";
import api from "../../api/client";

function StatusBadge({ status }) {
  const tone =
    status === "COMPLETED"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : status === "REJECTED"
        ? "bg-rose-100 text-rose-700 border-rose-200"
        : "bg-amber-100 text-amber-700 border-amber-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
      {status}
    </span>
  );
}

export default function CleaningHistory() {
  const [history, setHistory] = useState([]);
  const [bill, setBill] = useState({ total_requests: 0, total_quantity: 0, total_amount: 0 });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [histRes, billRes] = await Promise.all([
        api.get("/owner/cleaning-history"),
        api.get("/owner/cleaning-bill")
      ]);
      setHistory(histRes.data.data || []);
      setBill(billRes.data.data || { total_requests: 0, total_quantity: 0, total_amount: 0 });
    } catch (err) {
      console.error("Failed to load cleaning data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Cleaning Sessions</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{bill.total_requests}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Total Cleaning Bill</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">₹{bill.total_amount || 0}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-semibold text-slate-900">Cleaning Request History</h3>
          <button 
            onClick={loadData}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            Refresh History
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-900">
              {history.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString()}
                    <span className="ml-2 text-[10px] text-slate-400">
                      {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{r.unit_name}</div>
                    <div className="text-[10px] text-slate-500">{r.org_name}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">₹{r.amount}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}

              {!history.length && !loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No cleaning requests found.
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
