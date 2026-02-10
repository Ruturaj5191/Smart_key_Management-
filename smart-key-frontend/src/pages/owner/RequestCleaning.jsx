import { useEffect, useState } from "react";
import api from "../../api/client";
import { createFacilityRequest } from "../../api/facilityRequests";

export default function RequestCleaning() {
  const [units, setUnits] = useState([]);
  const [unitId, setUnitId] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  // Load owner units
  const loadUnits = async () => {
    try {
      const res = await api.get("/owner/units");
      setUnits(res.data.data || []);
    } catch (err) {
      alert("Failed to load units");
    }
  };

  useEffect(() => {
    loadUnits();
  }, []);

  const submit = async () => {
    if (!unitId) return alert("Select a unit first");
    setBusy(true);
    try {
      await createFacilityRequest({
        request_type: "CLEANING",
        unit_id: Number(unitId),
        description: desc,
      });
      alert("Cleaning request sent ✅");
      setUnitId("");
      setDesc("");
    } catch (e) {
      alert(e?.response?.data?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">
        Request Office Cleaning
      </h2>

      {/* Unit Select */}
      <select
        value={unitId}
        onChange={(e) => setUnitId(e.target.value)}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm
                   focus:outline-none focus:ring-2 focus:ring-slate-200"
      >
        <option value="">Select Unit</option>
        {units.map((u) => (
          <option key={u.id} value={u.id}>
            {u.unit_name} ({u.org_name})
          </option>
        ))}
      </select>

      {/* Notes */}
      <textarea
        placeholder="Cleaning details (optional)"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        className="rounded-xl border border-slate-200 p-3 w-full text-sm
                   focus:outline-none focus:ring-2 focus:ring-slate-200"
      />

      {/* Submit */}
      <button
        onClick={submit}
        disabled={busy}
        className="h-10 rounded-xl bg-slate-900 text-white px-4 text-sm font-medium
                   hover:bg-slate-800 disabled:opacity-60"
      >
        {busy ? "Submitting..." : "Submit"}
      </button>
    </div>
  );
}
