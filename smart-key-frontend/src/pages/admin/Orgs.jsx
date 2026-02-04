import { useEffect, useState } from "react";
import api from "../../api/client";

function StatusBadge({ status }) {
  const tone =
    status === "ACTIVE"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-rose-100 text-rose-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {status}
    </span>
  );
}

export default function Orgs() {
  const [rows, setRows] = useState([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await api.get("/admin/orgs");
    setRows(res.data.data);
  };

  const create = async () => {
    if (!name.trim()) return alert("name required");

    setBusy(true);
    try {
      await api.post("/admin/orgs", { name: name.trim(), address: address || null });
      setName("");
      setAddress("");
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Create organization failed");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-5">
      {/* Header + Form */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Organizations</h2>
            <p className="mt-1 text-sm text-slate-500">Create and manage organizations</p>
          </div>

          <button
            onClick={load}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm
                         placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="Org name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm
                         placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="Address (optional)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <button
              onClick={create}
              disabled={busy}
              className="h-10 w-full rounded-xl bg-slate-900 text-white text-sm font-medium
                         hover:bg-slate-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? "Creating..." : "Create Org"}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Address</th>

                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Created</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">{r.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{r.address}</td>

                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-700">{r.created_at}</td>
                </tr>
              ))}

              {!rows.length ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={4}>
                    No organizations found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
