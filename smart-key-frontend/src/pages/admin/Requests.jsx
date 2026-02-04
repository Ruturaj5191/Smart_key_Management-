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

export default function Requests() {
  const [status, setStatus] = useState("PENDING");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState("");

  const load = async () => {
    setBusy("load");
    try {
      const res = await api.get(`/admin/requests?status=${status}`);
      setRows(res.data.data);
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Failed to load requests");
    } finally {
      setBusy("");
    }
  };

  const approve = async (id) => {
    setBusy(`approve-${id}`);
    try {
      await api.patch(`/admin/requests/${id}/approve`);
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Approve failed");
    } finally {
      setBusy("");
    }
  };

  const reject = async (id) => {
    const reason = prompt("Reason (optional):") || "";
    setBusy(`reject-${id}`);
    try {
      await api.patch(`/admin/requests/${id}/reject`, { reason });
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Reject failed");
    } finally {
      setBusy("");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Key Requests</h2>
            <p className="mt-1 text-sm text-slate-500">
              Approve or reject pending key requests
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            <button
              onClick={load}
              disabled={busy === "load"}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium
                         hover:bg-slate-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy === "load" ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="px-6 py-5">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Key</th>
                    <th className="px-4 py-3 text-left font-semibold">Requested By</th>
                    <th className="px-4 py-3 text-left font-semibold">Approved By</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Actions</th>
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
                        <span className="font-medium text-slate-900">{r.requested_by}</span>{" "}
                        <span className="text-slate-500">({r.requested_by_name})</span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{r.approved_by ?? "-"}</span>{" "}
                        <span className="text-slate-500">({r.approved_by_name ?? "-"})</span>
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>

                      <td className="px-4 py-3">
                        {r.status === "PENDING" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => approve(r.id)}
                              disabled={busy === `approve-${r.id}` || busy === `reject-${r.id}`}
                              className="h-9 rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white
                                         hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {busy === `approve-${r.id}` ? "Approving..." : "Approve"}
                            </button>

                            <button
                              onClick={() => reject(r.id)}
                              disabled={busy === `approve-${r.id}` || busy === `reject-${r.id}`}
                              className="h-9 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700
                                         hover:bg-rose-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {busy === `reject-${r.id}` ? "Rejecting..." : "Reject"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {!rows.length ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                        No requests found for <span className="font-medium">{status}</span>
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
