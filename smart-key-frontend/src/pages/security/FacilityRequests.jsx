import { useEffect, useState } from "react";
import {
  getFacilityRequests,
  updateFacilityRequestStatus,
} from "../../api/facilityRequests";

/* Status Badge */
function StatusBadge({ status }) {
  const tone =
    status === "COMPLETED"
      ? "bg-emerald-100 text-emerald-700"
      : status === "IN_PROGRESS"
      ? "bg-blue-100 text-blue-700"
      : "bg-amber-100 text-amber-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
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
            Facility Requests (Water / Cleaning)
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

            <tbody className="divide-y divide-slate-100">
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
                    {r.status !== "COMPLETED" ? (
                      <div className="flex gap-2">
                        <button
                          disabled={busyId === r.id}
                          onClick={() => update(r.id, "IN_PROGRESS")}
                          className="
                            h-8 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white
                            hover:bg-blue-700 transition
                            disabled:opacity-60 disabled:cursor-not-allowed
                          "
                        >
                          {busyId === r.id ? "Updating..." : "In Progress"}
                        </button>

                        <button
                          disabled={busyId === r.id}
                          onClick={() => update(r.id, "COMPLETED")}
                          className="
                            h-8 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white
                            hover:bg-emerald-700 transition
                            disabled:opacity-60 disabled:cursor-not-allowed
                          "
                        >
                          {busyId === r.id ? "Updating..." : "Complete"}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
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
