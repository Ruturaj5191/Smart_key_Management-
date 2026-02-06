import { useEffect, useMemo, useState } from "react";
import api from "../../api/client";

function StatusBadge({ status }) {
  const s = String(status || "").toUpperCase();

  const tone =
    s === "OTP_VERIFIED"
      ? "bg-emerald-100 text-emerald-700"
      : s === "REJECTED"
      ? "bg-rose-100 text-rose-700"
      : s === "ISSUED"
      ? "bg-slate-100 text-slate-700"
      : s === "APPROVED"
      ? "bg-blue-100 text-blue-700"
      : s === "OTP_SENT"
      ? "bg-amber-100 text-amber-700"
      : s === "PENDING"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {s || "-"}
    </span>
  );
}

export default function MyRequests() {
  const [units, setUnits] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);

  // per-request OTP input
  const [otpById, setOtpById] = useState({});
  // action loading per row
  const [busyId, setBusyId] = useState(null);

  const loadUnits = async () => {
    const res = await api.get("/owner/units");
    setUnits(res.data.data || []);
  };

  const loadRequests = async () => {
    const res = await api.get("/owner/requests");
    setRows(res.data.data || []);
  };

  const create = async () => {
    if (!selectedUnitId) return alert("Select a unit first");

    setBusy(true);
    try {
      await api.post("/owner/requests", { unit_id: Number(selectedUnitId) });
      setSelectedUnitId("");
      await loadRequests();
      alert("Request created ✅");
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  const sendOtp = async (requestId) => {
    setBusyId(requestId);
    try {
      await api.post(`/owner/requests/${requestId}/send-otp`);
      alert("OTP sent ✅ (check notifications/email)");
      await loadRequests();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Send OTP failed");
    } finally {
      setBusyId(null);
    }
  };

  const verifyOtp = async (requestId) => {
    const otp = String(otpById[requestId] || "").trim();
    if (!otp) return alert("Enter OTP");
    if (otp.length < 4) return alert("OTP looks too short");

    setBusyId(requestId);
    try {
      await api.post(`/owner/requests/${requestId}/verify-otp`, { otp });
      alert("OTP verified ✅ Now security can issue the key.");
      setOtpById((p) => ({ ...p, [requestId]: "" }));
      await loadRequests();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Verify OTP failed");
    } finally {
      setBusyId(null);
    }
  };

  const prettyDate = useMemo(() => {
    return (d) => {
      if (!d) return "-";
      // If backend sends ISO date string
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return String(d);
      return dt.toLocaleString();
    };
  }, []);

  useEffect(() => {
    loadUnits();
    loadRequests();
  }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-xl font-semibold text-slate-900">My Requests</h2>
          <p className="mt-1 text-sm text-slate-500">
            Flow: <b>PENDING</b> → <b>APPROVED</b> → <b>Send OTP</b> → <b>OTP_SENT</b> →{" "}
            <b>Verify</b> → <b>OTP_VERIFIED</b> → Security issues → <b>ISSUED</b>
          </p>
        </div>

        <div className="px-6 py-5">
          <div className="grid gap-3 md:grid-cols-3">
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Select Unit</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unit_name} ({u.org_name})
                </option>
              ))}
            </select>

            <button
              onClick={create}
              disabled={busy}
              className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white
                         hover:bg-slate-800 disabled:opacity-60"
            >
              {busy ? "Creating..." : "Create Request"}
            </button>

            <button
              onClick={() => {
                loadUnits();
                loadRequests();
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Key</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Requested At</th>
                    <th className="px-4 py-3 text-left font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => {
                    const st = String(r.status || "").toUpperCase();
                    const isRowBusy = busyId === r.id;

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 align-top">
                        <td className="px-4 py-3">{r.id}</td>

                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-900">{r.key_id}</span>{" "}
                          <span className="text-slate-500">({r.key_code || "-"})</span>
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge status={st} />
                        </td>

                        <td className="px-4 py-3 text-slate-700">{prettyDate(r.requested_at)}</td>

                        <td className="px-4 py-3">
                          {/* ACTIONS BY STATUS */}
                          {st === "APPROVED" ? (
                            <button
                              onClick={() => sendOtp(r.id)}
                              disabled={isRowBusy}
                              className="h-9 rounded-xl bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                              {isRowBusy ? "Sending..." : "Send OTP"}
                            </button>
                          ) : st === "OTP_SENT" ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex gap-2">
                                <input
                                  value={otpById[r.id] || ""}
                                  onChange={(e) =>
                                    setOtpById((p) => ({ ...p, [r.id]: e.target.value }))
                                  }
                                  placeholder="Enter OTP"
                                  className="h-9 w-36 rounded-xl border border-slate-200 bg-white px-3 text-xs
                                             focus:outline-none focus:ring-2 focus:ring-slate-200"
                                />

                                <button
                                  onClick={() => verifyOtp(r.id)}
                                  disabled={isRowBusy}
                                  className="h-9 rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                >
                                  {isRowBusy ? "Verifying..." : "Verify"}
                                </button>
                              </div>

                              <button
                                onClick={() => sendOtp(r.id)}
                                disabled={isRowBusy}
                                className="text-xs text-slate-600 underline hover:text-slate-900 disabled:opacity-60 text-left"
                              >
                                Resend OTP
                              </button>
                            </div>
                          ) : st === "OTP_VERIFIED" ? (
                            <span className="text-xs font-semibold text-emerald-700">
                              Verified ✅ Waiting for Security
                            </span>
                          ) : st === "ISSUED" ? (
                            <span className="text-xs font-semibold text-slate-700">Issued ✅</span>
                          ) : st === "REJECTED" ? (
                            <span className="text-xs font-semibold text-rose-700">
                              Rejected ❌
                            </span>
                          ) : st === "PENDING" ? (
                            <span className="text-xs font-semibold text-amber-700">
                              Waiting for approval…
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {!rows.length ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No requests found
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
