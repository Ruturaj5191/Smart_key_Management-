import { useEffect, useState } from "react";
import api from "../../api/client";

export default function Roles() {
  const [rows, setRows] = useState([]);
  const [mode, setMode] = useState("STATIC"); // STATIC if no API

  const loadStatic = () => {
    setRows([
      { id: 1, name: "SUPER_ADMIN" },
      { id: 2, name: "ADMIN" },
      { id: 3, name: "SECURITY" },
      { id: 4, name: "OWNER" },
    ]);
  };

  const loadFromApi = async () => {
    // ✅ only if your backend has this endpoint
    const res = await api.get("/superadmin/roles");
    setRows(res.data.data);
  };

  useEffect(() => {
    // if you make API later switch mode to API
    if (mode === "STATIC") loadStatic();
    else loadFromApi();
  }, [mode]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Roles</h2>
            <p className="mt-1 text-sm text-slate-500">System roles</p>
          </div>

          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm
                       focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="STATIC">Static</option>
            <option value="API">API</option>
          </select>
        </div>

        <div className="px-6 py-5">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-900">{r.id}</td>
                    <td className="px-4 py-3">{r.name}</td>
                  </tr>
                ))}
                {!rows.length ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-slate-500">
                      No roles found
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {mode === "API" ? (
            <p className="mt-3 text-xs text-slate-500">
              If API mode fails, create backend route: <code>/api/superadmin/roles</code>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
