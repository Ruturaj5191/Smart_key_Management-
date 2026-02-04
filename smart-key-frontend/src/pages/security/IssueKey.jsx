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

export default function IssueKey() {
  const [requests, setRequests] = useState([]);
  const [accessMethod, setAccessMethod] = useState("OTP");
  const [busy, setBusy] = useState(false);

  const loadRequests = async () => {
    try {
      const res = await api.get("/security/requests?status=APPROVED");
      setRequests(res.data.data || []);
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Failed to load requests");
      setRequests([]);
    }
  };

  const issueFromRequest = async (r) => {
    setBusy(true);
    try {
      const res = await api.post("/security/issue", {
        key_id: Number(r.key_id),
        issued_to: Number(r.requested_by),
        access_method: accessMethod,
        request_id: Number(r.id),
      });

      alert("Issued ✅\n\n" + JSON.stringify(res.data.data || res.data, null, 2));
      await loadRequests();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Issue failed");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Approved Requests</h2>
            <p className="mt-1 text-sm text-slate-500">
              Only APPROVED + AVAILABLE + not-issued requests are shown.
            </p>
          </div>

          <button
            onClick={loadRequests}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex gap-3 items-center">
            <label className="text-sm font-medium text-slate-700">Access Method</label>
            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={accessMethod}
              onChange={(e) => setAccessMethod(e.target.value)}
            >
              <option value="OTP">OTP</option>
              <option value="QR">QR</option>
              <option value="RFID">RFID</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Request ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Key</th>
                    <th className="px-4 py-3 text-left font-semibold">Org / Unit</th>
                    <th className="px-4 py-3 text-left font-semibold">Requested By</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {requests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">{r.id}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{r.key_id}</span>{" "}
                        <span className="text-slate-500">({r.key_code})</span>
                      </td>
                      <td className="px-4 py-3">
                        {r.org_name} <span className="text-slate-500">/ {r.unit_name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{r.requested_by}</span>{" "}
                        <span className="text-slate-500">({r.requested_by_name})</span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3">
                        <button
                          disabled={busy}
                          onClick={() => issueFromRequest(r)}
                          className="h-9 rounded-xl bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                        >
                          Issue
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!requests.length ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No approved requests found
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
