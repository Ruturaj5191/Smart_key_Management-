import { useEffect, useState } from "react";
import api from "../../api/client";
import { createFacilityRequest } from "../../api/facilityRequests";

export default function RequestTea() {
  const [units, setUnits] = useState([]);
  const [unitId, setUnitId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  const [prices, setPrices] = useState({ TEA: 10 });

  // load owner units
  const loadUnits = async () => {
    try {
      const res = await api.get("/owner/units");
      setUnits(res.data.data || []);
    } catch (err) {
      alert("Failed to load units");
    }
  };

  const loadPrices = async () => {
    try {
      const res = await api.get("/prices");
      setPrices(res.data.data);
    } catch (err) {
      console.error("Failed to load prices");
    }
  };

  useEffect(() => {
    loadUnits();
    loadPrices();
  }, []);

  const submit = async () => {
    if (!unitId) return alert("Select a unit first");
    if (quantity < 1) return alert("Quantity must be at least 1");
    
    setBusy(true);
    try {
      await api.post("/requests/facility", {
        request_type: "TEA",
        unit_id: Number(unitId),
        quantity: Number(quantity),
        description: desc,
      });
      alert("Tea request sent ✅");
      setDesc("");
      setUnitId("");
      setQuantity(1);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
        <span>🍵</span> Request Tea
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Unit Select */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 ml-1">Select Unit</label>
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="h-10 w-full rounded-xl text-slate-900 border border-slate-200 bg-white px-3 text-sm
                       focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Select Unit</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.unit_name} ({u.org_name})
              </option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 ml-1">Quantity (Cups)</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="h-10 w-full rounded-xl text-slate-900 border border-slate-200 bg-white px-3 text-sm
                       focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 ml-1">Special Instructions (Optional)</label>
        <textarea
          placeholder="e.g. Less sugar, Without milk..."
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="rounded-xl border text-slate-900 border-slate-200 p-3 w-full text-sm min-h-[100px]
                     focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
      </div>

      <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
        <div className="text-sm text-amber-800">
          <span className="font-semibold">Estimated Cost:</span> ₹{(quantity || 0) * (prices.TEA || 0)}
        </div>
        <p className="text-[10px] text-amber-600 font-medium tracking-tight uppercase">Base price: ₹{prices.TEA || 0}/cup</p>
      </div>

      {/* Submit */}
      <button
        onClick={submit}
        disabled={busy}
        className="h-12 w-full rounded-xl bg-slate-900 text-white px-4 text-sm font-semibold
                   hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-60"
      >
        {busy ? "Sending Request..." : "Order Tea Now"}
      </button>
    </div>
  );
}
