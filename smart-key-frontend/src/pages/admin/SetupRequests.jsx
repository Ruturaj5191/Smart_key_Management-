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

export default function SetupRequests() {
  // ----- Setup Requests -----
  const [setupStatus, setSetupStatus] = useState("PENDING");
  const [setupRows, setSetupRows] = useState([]);

  // ----- Key Setup Requests (admin creates key in keyss) -----
  const [keyStatus, setKeyStatus] = useState("PENDING");
  const [keyRows, setKeyRows] = useState([]);

  const loadSetup = async () => {
    const res = await api.get(`/admin/setup-requests?status=${setupStatus}`);
    setSetupRows(res.data.data || []);
  };

  const approveSetup = async (id) => {
    const note = prompt("Note (optional):") || "";
    await api.patch(`/admin/setup-requests/${id}/approve`, { note });
    await loadSetup();
  };

  const rejectSetup = async (id) => {
    const note = prompt("Reason (optional):") || "";
    await api.patch(`/admin/setup-requests/${id}/reject`, { note });
    await loadSetup();
  };

  // ✅ FIX: use /admin/key-setup-requests (not /admin/requests)
  const loadKeyRequests = async () => {
    const res = await api.get(`/admin/key-setup-requests?status=${keyStatus}`);
    setKeyRows(res.data.data || []);
  };

  const approveKeyRequest = async (id) => {
    const note = prompt("Note (optional):") || "";
    await api.patch(`/admin/key-setup-requests/${id}/approve`, { note });
    await loadKeyRequests();
  };

  const rejectKeyRequest = async (id) => {
    const note = prompt("Reason (optional):") || "";
    await api.patch(`/admin/key-setup-requests/${id}/reject`, { note });
    await loadKeyRequests();
  };

  const refreshAll = async () => {
    await Promise.all([loadSetup(), loadKeyRequests()]);
  };

  useEffect(() => {
    loadSetup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupStatus]);

  useEffect(() => {
    loadKeyRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyStatus]);

  return (
    <div className="space-y-6">
      {/* ---------------- Setup Requests ---------------- */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Setup Requests</h2>
            <p className="mt-1 text-sm text-slate-500">Owners request Org + Unit creation</p>
          </div>

          <div className="flex gap-3">
            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={setupStatus}
              onChange={(e) => setSetupStatus(e.target.value)}
            >
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>

            <button
              onClick={refreshAll}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50"
            >
              Refresh All
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Owner</th>
                    <th className="px-4 py-3 text-left font-semibold">Org</th>
                    <th className="px-4 py-3 text-left font-semibold">Unit</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {setupRows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">{r.id}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{r.requested_by}</span>{" "}
                        <span className="text-slate-500">({r.requested_by_name})</span>
                      </td>
                      <td className="px-4 py-3">{r.org_name}</td>
                      <td className="px-4 py-3">{r.unit_name}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        {r.status === "PENDING" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => approveSetup(r.id)}
                              className="h-9 rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-500"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectSetup(r.id)}
                              className="h-9 rounded-xl bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-500"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {!setupRows.length ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No setup requests
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- Key Setup Requests ---------------- */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Key Setup Requests</h2>
            <p className="mt-1 text-sm text-slate-500">Owners ask admin to create keys in keyss</p>
          </div>

          <div className="flex gap-3">
            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={keyStatus}
              onChange={(e) => setKeyStatus(e.target.value)}
            >
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>

            <button
              onClick={loadKeyRequests}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Org</th>
                    <th className="px-4 py-3 text-left font-semibold">Unit</th>
                    <th className="px-4 py-3 text-left font-semibold">Key Code</th>
                    <th className="px-4 py-3 text-left font-semibold">Requested By</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {keyRows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">{r.id}</td>
                      <td className="px-4 py-3">{r.org_name}</td>
                      <td className="px-4 py-3">
                        {r.unit_name} <span className="text-slate-500">(unit_id={r.unit_id})</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{r.key_code}</span>{" "}
                        <span className="text-slate-500">({r.key_type || "MAIN"})</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{r.requested_by}</span>{" "}
                        <span className="text-slate-500">({r.requested_by_name})</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>

                      <td className="px-4 py-3">
                        {r.status === "PENDING" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => approveKeyRequest(r.id)}
                              className="h-9 rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-500"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectKeyRequest(r.id)}
                              className="h-9 rounded-xl bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-500"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {!keyRows.length ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        No key setup requests
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            Note: This section reads from <code>/admin/key-setup-requests</code>.
          </div>
        </div>
      </div>
    </div>
  );
}
