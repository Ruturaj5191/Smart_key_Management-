import { useEffect, useState } from "react";
import api from "../../api/client";

function Badge({ channel }) {
  const tone =
    channel === "EMAIL" ? "bg-sky-100 text-sky-700" :
    channel === "SMS" ? "bg-amber-100 text-amber-700" :
    "bg-emerald-100 text-emerald-700"; // WHATSAPP
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{channel}</span>;
}

export default function Notifications() {
  const [rows, setRows] = useState([]);

  const load = async () => {
    const res = await api.get("/owner/notifications");
    setRows(res.data.data);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Notifications</h2>
            <p className="mt-1 text-sm text-slate-500">Messages sent to you</p>
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
                    <th className="px-4 py-3 text-left font-semibold">ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Title</th>
                    <th className="px-4 py-3 text-left font-semibold">Message</th>
                    <th className="px-4 py-3 text-left font-semibold">Channel</th>
                    <th className="px-4 py-3 text-left font-semibold">Sent At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">{r.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{r.title || "-"}</td>
                      <td className="px-4 py-3 text-slate-700">{r.message || "-"}</td>
                      <td className="px-4 py-3"><Badge channel={r.channel} /></td>
                      <td className="px-4 py-3 text-slate-700">{r.sent_at}</td>
                    </tr>
                  ))}

                  {!rows.length ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                        No notifications found
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          {/* optional debug */}
          {/* <pre className="mt-4 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs">
            {JSON.stringify(rows, null, 2)}
          </pre> */}
        </div>
      </div>
    </div>
  );
}
