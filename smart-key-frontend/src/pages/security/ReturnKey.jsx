import { useEffect, useMemo, useState } from "react";
import api from "../../api/client";

export default function ReturnKey() {
  const [openTxns, setOpenTxns] = useState([]);
  const [selectedTxnId, setSelectedTxnId] = useState("");

  const [keyId, setKeyId] = useState("");
  const [txnId, setTxnId] = useState("");
  const [busy, setBusy] = useState("");

  // ✅ Load open issued transactions for dropdown
  const loadOpenTxns = async () => {
    const res = await api.get("/security/transactions/open");
    setOpenTxns(res.data.data || []);
  };

  // Build select options (safe even if backend fields differ slightly)
  const txnOptions = useMemo(() => {
    return openTxns.map((t) => {
      const id = t.transaction_id ?? t.id; // backend might return transaction_id or id
      const key_code = t.key_code ? ` (${t.key_code})` : "";
      const key_id = t.key_id ?? "";
      const issued_to_name = t.issued_to_name ? ` → ${t.issued_to_name}` : "";
      const issued_to = t.issued_to ? ` (#${t.issued_to})` : "";
      const issued_at = t.issue_time ? ` @ ${t.issue_time}` : "";

      return {
        id: String(id),
        label: `TXN #${id} | Key #${key_id}${key_code}${issued_to_name}${issued_to}${issued_at}`,
        raw: t,
      };
    });
  }, [openTxns]);

  // When user selects a txn from dropdown, auto-fill txnId + keyId
  const onSelectTxn = (val) => {
    setSelectedTxnId(val);

    const found = txnOptions.find((x) => x.id === val);
    if (!found) {
      setTxnId("");
      setKeyId("");
      return;
    }

    const t = found.raw;
    const tid = t.transaction_id ?? t.id;
    const kid = t.key_id;

    setTxnId(String(tid || ""));
    setKeyId(String(kid || ""));
  };

  const returnByKey = async () => {
    if (!keyId) return alert("key_id required");
    setBusy("key");
    try {
      const res = await api.post("/security/return", { key_id: Number(keyId) });
      alert("Returned ✅\n\n" + JSON.stringify(res.data.data || res.data, null, 2));
      setKeyId("");
      setSelectedTxnId("");
      setTxnId("");
      await loadOpenTxns();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Return failed");
    } finally {
      setBusy("");
    }
  };

  const returnByTxn = async () => {
    if (!txnId) return alert("transaction_id required");
    setBusy("txn");
    try {
      const res = await api.post("/security/return", { transaction_id: Number(txnId) });
      alert("Returned ✅\n\n" + JSON.stringify(res.data.data || res.data, null, 2));
      setTxnId("");
      setSelectedTxnId("");
      setKeyId("");
      await loadOpenTxns();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Return failed");
    } finally {
      setBusy("");
    }
  };

  useEffect(() => {
    loadOpenTxns();
  }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Return Key</h2>
            <p className="mt-1 text-sm text-slate-500">
              Return a key using dropdown (open issued) or by typing key_id / transaction_id
            </p>
          </div>

          <button
            onClick={loadOpenTxns}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* ✅ New: Select open issued txn */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">
              Return from Open Issued (Recommended)
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <select
                value={selectedTxnId}
                onChange={(e) => onSelectTxn(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-slate-200 md:col-span-2"
              >
                <option value="">
                  {txnOptions.length ? "Select open issued transaction" : "No open issued keys"}
                </option>
                {txnOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                onClick={returnByTxn}
                disabled={!txnId || busy === "txn"}
                className="h-10 w-full rounded-xl bg-slate-900 text-white text-sm font-medium
                           hover:bg-slate-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy === "txn" ? "Returning..." : "Return Selected"}
              </button>
            </div>

            {!!txnId && (
              <div className="mt-2 text-xs text-slate-600">
                Selected: txn_id=<b>{txnId}</b> | key_id=<b>{keyId}</b>
              </div>
            )}
          </div>

          {/* Return by key_id */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Return by Key ID</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm
                           placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="key_id (example: 1)"
                value={keyId}
                onChange={(e) => setKeyId(e.target.value)}
              />
              <button
                onClick={returnByKey}
                disabled={busy === "key"}
                className="h-10 w-full rounded-xl bg-slate-900 text-white text-sm font-medium
                           hover:bg-slate-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy === "key" ? "Returning..." : "Return by key_id"}
              </button>
            </div>
          </div>

          {/* Return by transaction_id */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Return by Transaction ID</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm
                           placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="transaction_id (example: 10)"
                value={txnId}
                onChange={(e) => setTxnId(e.target.value)}
              />
              <button
                onClick={returnByTxn}
                disabled={busy === "txn"}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium
                           hover:bg-slate-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy === "txn" ? "Returning..." : "Return by transaction_id"}
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Tip: dropdown uses <code>/security/transactions/open</code> and shows only ISSUED keys that are not returned.
          </div>
        </div>
      </div>
    </div>
  );
}
