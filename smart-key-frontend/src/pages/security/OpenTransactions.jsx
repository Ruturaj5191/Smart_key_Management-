import { useEffect, useState } from "react";
import api from "../../api/client";

function StatusBadge({ status }) {
  const tone =
    status === "ISSUED"
      ? "bg-amber-100 text-amber-700"
      : status === "RETURNED"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-rose-100 text-rose-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {status}
    </span>
  );
}

export default function Transactions() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const load = async () => {
    setBusy(true);
    try {
      const res = await api.get("/security/transactions", {
        params: { status: statusFilter }, // ✅ sends ?status=
      });
      setRows(res.data.data || []);
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Failed to load transactions");
      setRows([]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter]); // ✅ reload on filter change

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Transactions</h2>
            <p className="mt-1 text-sm text-slate-500">Filter by status</p>
          </div>

          <button
            onClick={load}
            disabled={busy}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium
                       hover:bg-slate-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">ALL</option>
              <option value="ISSUED">ISSUED</option>
              <option value="RETURNED">RETURNED</option>
              <option value="LOST">LOST</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Txn ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Key</th>
                    <th className="px-4 py-3 text-left font-semibold">Issued To</th>
                    <th className="px-4 py-3 text-left font-semibold">Issued By</th>
                    <th className="px-4 py-3 text-left font-semibold">Access</th>
                    <th className="px-4 py-3 text-left font-semibold">Issue Time</th>
                    <th className="px-4 py-3 text-left font-semibold">Return Time</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <tr key={r.transaction_id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-medium text-slate-900">{r.transaction_id}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{r.key_id}</span>{" "}
                        <span className="text-slate-500">({r.key_code})</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{r.issued_to}</span>{" "}
                        <span className="text-slate-500">({r.issued_to_name})</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{r.issued_by}</span>{" "}
                        <span className="text-slate-500">({r.issued_by_name})</span>
                      </td>
                      <td className="px-4 py-3">{r.access_method}</td>
                      <td className="px-4 py-3 text-slate-700">{r.issue_time}</td>
                      <td className="px-4 py-3 text-slate-700">{r.return_time || "-"}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}

                  {!rows.length ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-slate-500" colSpan={8}>
                        No transactions found
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
