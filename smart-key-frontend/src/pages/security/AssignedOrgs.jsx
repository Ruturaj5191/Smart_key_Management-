import { useEffect, useState } from "react";
import api from "../../api/client";

function StatusBadge({ status }) {
  const tone =
    status === "ACTIVE"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-rose-100 text-rose-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {status || "-"}
    </span>
  );
}

export default function AssignedOrgs() {
  const [rows, setRows] = useState([]);

  const load = async () => {
    const res = await api.get("/security/orgs");
    setRows(res.data.data);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Assigned Organizations</h2>
            <p className="mt-1 text-sm text-slate-500">
              Organizations assigned to you (Security)
            </p>
          </div>

          <button
            onClick={load}
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
                    <th className="px-4 py-3 text-left font-semibold">Org ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Org Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Address</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <tr key={r.id || r.org_id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {r.org_id ?? r.id}
                      </td>
                      <td className="px-4 py-3">{r.name || r.org_name || "-"}</td>
                      <td className="px-4 py-3 text-slate-700">{r.address || "-"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}

                  {!rows.length ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-slate-500" colSpan={4}>
                        No organizations assigned yet
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          {/* Optional debug */}
          {/* <pre className="mt-4 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs">
            {JSON.stringify(rows, null, 2)}
          </pre> */}
        </div>
      </div>
    </div>
  );
}
