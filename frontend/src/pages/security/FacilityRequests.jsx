import { useEffect, useState } from "react";
import {
  getFacilityRequests,
  updateFacilityRequestStatus,
} from "../../api/facilityRequests";

/* Status Badge */
function StatusBadge({ status }) {
  const tone =
    status === "COMPLETED"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-100"
      : status === "IN_PROGRESS"
        ? "bg-blue-100 text-blue-700 border-blue-200 shadow-sm shadow-blue-100 animate-pulse"
        : status === "REJECTED"
        ? "bg-rose-100 text-rose-700 border-rose-200"
        : "bg-amber-100 text-amber-700 border-amber-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-tight ${tone}`}>
      {status === "IN_PROGRESS" && (
        <span className="mr-1.5 flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-1.5 w-1.5 animate-ping rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-500"></span>
        </span>
      )}
      {status}
    </span>
  );
}

export default function FacilityRequests() {
  const [rows, setRows] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    const res = await getFacilityRequests();
    setRows(res.data.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const update = async (id, status) => {
    setBusyId(id);
    try {
      await updateFacilityRequestStatus(id, status);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-xl font-semibold text-slate-900">
            Facility Requests (Water / Cleaning / Tea)
          </h2>
        </div>

        {/* Table */}
        <div className="px-6 py-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Requested By</th>
                <th className="px-4 py-3 text-left">Unit</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-900">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 align-top">
                  <td className="px-4 py-3">{r.id}</td>

                  <td className="px-4 py-3 font-medium">
                    {r.request_type}
                  </td>

                  <td className="px-4 py-3">
                    {r.user_name}
                  </td>

                  {/* ✅ Unit + Org */}
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {r.unit_name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {r.org_name}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-slate-700">
                    {r.description || "-"}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {r.status === "PENDING" && (
                        <button
                          disabled={busyId === r.id}
                          onClick={() => update(r.id, "IN_PROGRESS")}
                          className="
                            h-8 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white
                            hover:bg-blue-700 transition shadow-sm active:scale-95
                            disabled:opacity-60 disabled:cursor-not-allowed
                          "
                        >
                          {busyId === r.id ? "..." : "In Progress"}
                        </button>
                      )}

                      {(r.status === "PENDING" || r.status === "IN_PROGRESS") && (
                        <button
                          disabled={busyId === r.id}
                          onClick={() => update(r.id, "COMPLETED")}
                          className="
                            h-8 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white
                            hover:bg-emerald-700 transition shadow-sm active:scale-95
                            disabled:opacity-60 disabled:cursor-not-allowed
                          "
                        >
                          {busyId === r.id ? "..." : "Complete"}
                        </button>
                      )}

                      {r.status === "COMPLETED" && (
                        <span className="text-xs text-slate-400 italic">No action</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!rows.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No facility requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
