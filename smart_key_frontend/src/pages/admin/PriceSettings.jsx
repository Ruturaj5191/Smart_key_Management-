import { useEffect, useState } from "react";
import api from "../../api/client";

export default function PriceSettings() {
  const [prices, setPrices] = useState({ WATER: 0, TEA: 0, CLEANING: 0 });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPrices = async () => {
    try {
      const res = await api.get("/prices");
      setPrices(res.data.data);
    } catch (err) {
      console.error("Failed to load prices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrices();
  }, []);

  const updatePrice = async (type) => {
    setBusy(true);
    try {
      await api.put(`/prices/${type}`, { price: prices[type] });
      alert(`${type} price updated successfully!`);
      loadPrices(); // Refresh data
    } catch (err) {
      alert("Failed to update price");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Configuration...</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Manage Facility Prices</h2>
        <p className="text-sm text-slate-500 mb-6">Update the rates charged to owners for facility services.</p>

        <div className="grid gap-6 md:grid-cols-3 text-slate-900">
          {/* Water */}
          <div className="space-y-3 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
            <div className="text-sm font-semibold text-blue-900 tracking-tight uppercase">Water (Per Bottle)</div>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400">₹</span>
              <input
                type="number"
                value={prices.WATER}
                onChange={(e) => setPrices({ ...prices, WATER: Number(e.target.value) })}
                className="h-10 w-full rounded-lg border border-slate-200 pl-7 pr-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              disabled={busy}
              onClick={() => updatePrice("WATER")}
              className="w-full h-9 rounded-lg bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Update Rate
            </button>
          </div>

          {/* Tea */}
          <div className="space-y-3 p-4 rounded-xl bg-orange-50/50 border border-orange-100">
            <div className="text-sm font-semibold text-orange-900 tracking-tight uppercase">Tea (Per Cup)</div>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400">₹</span>
              <input
                type="number"
                value={prices.TEA}
                onChange={(e) => setPrices({ ...prices, TEA: Number(e.target.value) })}
                className="h-10 w-full rounded-lg border border-slate-200 pl-7 pr-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
            <button
              disabled={busy}
              onClick={() => updatePrice("TEA")}
              className="w-full h-9 rounded-lg bg-orange-600 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              Update Rate
            </button>
          </div>

          {/* Cleaning */}
          <div className="space-y-3 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <div className="text-sm font-semibold text-emerald-900 tracking-tight uppercase">Cleaning (Flat)</div>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400">₹</span>
              <input
                type="number"
                value={prices.CLEANING}
                onChange={(e) => setPrices({ ...prices, CLEANING: Number(e.target.value) })}
                className="h-10 w-full rounded-lg border border-slate-200 pl-7 pr-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <button
              disabled={busy}
              onClick={() => updatePrice("CLEANING")}
              className="w-full h-9 rounded-lg bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              Update Rate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
