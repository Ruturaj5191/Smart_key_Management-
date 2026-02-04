import { useEffect, useMemo, useState } from "react";
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
  // ---- setup request (org+unit) ----
  const [setupRows, setSetupRows] = useState([]);
  const [orgName, setOrgName] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [unitName, setUnitName] = useState("");
  const [busySetup, setBusySetup] = useState(false);

  // ---- units dropdown (owner units) ----
  const [units, setUnits] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState("");

  // ---- key setup request (admin creates new key) ----
  const [keySetupRows, setKeySetupRows] = useState([]);
  const [keyCode, setKeyCode] = useState("");
  const [keyType, setKeyType] = useState("MAIN");
  const [lockerNo, setLockerNo] = useState("");
  const [busyKeySetup, setBusyKeySetup] = useState(false);

  // ---- my normal key requests (/requests) ----
  const [myKeyRequests, setMyKeyRequests] = useState([]);

  const unitOptions = useMemo(
    () =>
      units.map((u) => ({
        id: u.id,
        label: `${u.unit_name} (${u.org_name})`,
      })),
    [units]
  );

  // ---------------- LOADERS ----------------
  const loadSetupRequests = async () => {
    const res = await api.get("/owner/setup-requests");
    setSetupRows(res.data.data || []);
  };

  const loadUnits = async () => {
    const res = await api.get("/owner/units");
    setUnits(res.data.data || []);
  };

  const loadKeySetupRequests = async () => {
    const res = await api.get("/owner/key-setup-requests");
    setKeySetupRows(res.data.data || []);
  };

  const loadMyKeyRequests = async () => {
    // this depends on your /requests controller (existing-key issue flow)
    const res = await api.get("/requests");
    setMyKeyRequests(res.data.data || []);
  };

  const refreshAll = async () => {
    await Promise.allSettled([
      loadSetupRequests(),
      loadUnits(),
      loadKeySetupRequests(),
      loadMyKeyRequests(),
    ]);
  };

  // ---------------- ACTIONS ----------------

  // ✅ Owner sends Org + Unit request to admin
  const submitSetup = async () => {
    if (!orgName.trim() || !unitName.trim()) {
      return alert("Organization name and Unit name are required");
    }

    setBusySetup(true);
    try {
      // ✅ FIX: correct API
      await api.post("/owner/setup-requests", {
        org_name: orgName.trim(),
        org_address: orgAddress?.trim() || null,
        unit_name: unitName.trim(),

        // OPTIONAL: if you want key created during setup approval
        key_code: keyCode?.trim() || null,
        key_type: keyType || "MAIN",
        locker_no: lockerNo?.trim() || null,
      });

      setOrgName("");
      setOrgAddress("");
      setUnitName("");

      await loadSetupRequests();
      alert("Setup request sent ✅");
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Failed");
    } finally {
      setBusySetup(false);
    }
  };

  // ✅ Owner asks admin to CREATE a NEW KEY
  const submitKeySetup = async () => {
    if (!selectedUnitId) return alert("Please select a unit");
    if (!keyCode.trim()) return alert("Please enter key code / key name");

    setBusyKeySetup(true);
    try {
      await api.post("/owner/key-setup-requests", {
        unit_id: Number(selectedUnitId),
        key_code: keyCode.trim(),
        key_type: keyType,
        locker_no: lockerNo?.trim() || null,
      });

      setSelectedUnitId("");
      setKeyCode("");
      setKeyType("MAIN");
      setLockerNo("");

      await loadKeySetupRequests();
      alert("Key setup request sent to admin ✅");
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Key setup request failed");
    } finally {
      setBusyKeySetup(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  return (
    <div className="space-y-6">
      {/* ---------- Setup Request (Org + Unit) ---------- */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Setup Request</h2>
            <p className="mt-1 text-sm text-slate-500">
              Ask admin to add Organization + Unit for you
            </p>
          </div>

          <button
            onClick={refreshAll}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50"
          >
            Refresh All
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm
                         placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="Organization name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
            <input
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm
                         placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="Organization address (optional)"
              value={orgAddress}
              onChange={(e) => setOrgAddress(e.target.value)}
            />
            <input
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm
                         placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="Unit name (example: Office-101)"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
            />
          </div>

          <div className="mt-3 flex gap-3">
            <button
              onClick={submitSetup}
              disabled={busySetup}
              className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white
                         hover:bg-slate-800 disabled:opacity-60"
            >
              {busySetup ? "Sending..." : "Send Setup Request"}
            </button>

            <button
              onClick={loadSetupRequests}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50"
            >
              Refresh Setup
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Organization</th>
                    <th className="px-4 py-3 text-left font-semibold">Unit</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {setupRows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">{r.id}</td>
                      <td className="px-4 py-3">{r.org_name}</td>
                      <td className="px-4 py-3">{r.unit_name}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">{r.note || "-"}</td>
                    </tr>
                  ))}

                  {!setupRows.length ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
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

      {/* ---------- NEW: Request Admin to Create Key ---------- */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-semibold text-slate-900">Request Admin to Add a Key</h3>
          <p className="mt-1 text-sm text-slate-500">
            Select unit and enter key code. Admin will approve/reject. After approval, key will be created.
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-5">
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Select Unit</option>
              {unitOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>

            <input
              value={keyCode}
              onChange={(e) => setKeyCode(e.target.value)}
              placeholder="Key code (unique)"
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm
                         placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />

            <select
              value={keyType}
              onChange={(e) => setKeyType(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="MAIN">MAIN</option>
              <option value="SPARE">SPARE</option>
              <option value="EMERGENCY">EMERGENCY</option>
            </select>

            <input
              value={lockerNo}
              onChange={(e) => setLockerNo(e.target.value)}
              placeholder="Locker no (optional)"
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm
                         placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />

            <button
              onClick={submitKeySetup}
              disabled={busyKeySetup}
              className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white
                         hover:bg-slate-800 disabled:opacity-60"
            >
              {busyKeySetup ? "Sending..." : "Send to Admin"}
            </button>
          </div>

          <div className="flex justify-end">
            <button
              onClick={loadKeySetupRequests}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium hover:bg-slate-50"
            >
              Refresh Key Setup Requests
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Unit</th>
                    <th className="px-4 py-3 text-left font-semibold">Key Code</th>
                    <th className="px-4 py-3 text-left font-semibold">Type</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {keySetupRows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">{r.id}</td>
                      <td className="px-4 py-3">
                        {r.unit_name} <span className="text-slate-500">({r.org_name})</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{r.key_code}</td>
                      <td className="px-4 py-3">{r.key_type}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">{r.note || "-"}</td>
                    </tr>
                  ))}

                  {!keySetupRows.length ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No key setup requests
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- My Key Requests (Existing /requests) ---------- */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">My Key Requests</h3>
            <p className="mt-1 text-sm text-slate-500">
              These are requests for existing keys (created already).
            </p>
          </div>

          <button
            onClick={loadMyKeyRequests}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Key</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Requested At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myKeyRequests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">{r.id}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{r.key_id}</span>{" "}
                        <span className="text-slate-500">({r.key_code})</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-700">{r.requested_at}</td>
                    </tr>
                  ))}

                  {!myKeyRequests.length ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        No key requests
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
