import { useState } from "react";
import api from "../../api/client";

function JsonBlock({ value }) {
  return (
    <pre className="overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-800">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function Reports() {
  const [issued, setIssued] = useState([]);
  const [audit, setAudit] = useState([]);
  const [busy, setBusy] = useState("");

  const loadIssued = async () => {
    setBusy("issued");
    try {
      // const res = await api.get("/admin/reports/issued-keys");
  const res=await api.get("/admin/reports/issued-keys", { params: { open_only: 0, status: "ALL" } })

      setIssued(res.data.data);
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Failed to load issued keys");
    } finally {
      setBusy("");
    }
  };

  const loadAudit = async () => {
    setBusy("audit");
    try {
      const res = await api.get("/admin/reports/audit-logs");
      setAudit(res.data.data);
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Failed to load audit logs");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Reports</h2>
            <p className="mt-1 text-sm text-slate-500">
              Issued keys and audit logs
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadIssued}
              disabled={busy === "issued"}
              className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white
                         hover:bg-slate-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy === "issued" ? "Loading..." : "Load Issued Keys"}
            </button>

            <button
              onClick={loadAudit}
              disabled={busy === "audit"}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium
                         hover:bg-slate-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy === "audit" ? "Loading..." : "Load Audit Logs"}
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Issued */}
            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="text-sm font-semibold text-slate-900">Issued Keys</div>
                <div className="mt-1 text-xs text-slate-500">
                  Current issued transactions (not returned)
                </div>
              </div>
              <div className="p-4">
                <JsonBlock value={issued} />
              </div>
            </div>

            {/* Audit */}
            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="text-sm font-semibold text-slate-900">Audit Logs</div>
                <div className="mt-1 text-xs text-slate-500">
                  Showing latest 50 records
                </div>
              </div>
              <div className="p-4">
                <JsonBlock value={audit.slice(0, 50)} />
              </div>
            </div>
          </div>

          {/* Empty hints */}
          {!issued.length && !audit.length ? (
            <div className="mt-4 text-sm text-slate-500">
              Click a button above to load reports.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
