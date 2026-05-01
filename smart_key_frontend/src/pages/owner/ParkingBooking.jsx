import { useEffect, useState } from "react";
import api from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

function StatusBadge({ status }) {
  const tone = status === "AVAILABLE" ? "bg-emerald-100 text-emerald-700" : status === "OCCUPIED" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{status}</span>;
}
function BookingBadge({ status }) {
  const tone = status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700" : status === "CANCELLED" ? "bg-rose-100 text-rose-700" : status === "COMPLETED" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{status}</span>;
}

export default function ParkingBooking() {
  const { user } = useAuth();
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("slots"); // slots | bookings
  const [form, setForm] = useState({ slot_id: "", vehicle_number: "", booking_date: "", start_time: "", end_time: "" });

  const loadUnits = async () => {
    try { const res = await api.get("/owner/units"); setUnits(res.data.data || []); }
    catch (err) { setError(err?.response?.data?.message || "Failed to load units"); }
  };

  const loadSlots = async (unitId) => {
    const unit = units.find(u => String(u.id) === String(unitId));
    if (!unit) return;
    setLoading(true); setError("");
    try {
      const res = await api.get(`/parking/slots/${unit.org_id}?limit=100`);
      setSlots(res.data.data?.slots || []);
    } catch (err) { setError(err?.response?.data?.message || "Failed to load slots"); }
    finally { setLoading(false); }
  };

  const loadBookings = async (unitId) => {
    setLoading(true); setError("");
    try {
      const res = await api.get(`/parking/bookings/${unitId}`);
      setBookings(res.data.data?.bookings || []);
    } catch (err) { setError(err?.response?.data?.message || "Failed to load bookings"); }
    finally { setLoading(false); }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!form.slot_id || !form.vehicle_number || !form.booking_date || !form.start_time || !form.end_time) { setError("All fields are required"); return; }
    setSubmitting(true); setError("");
    try {
      await api.post("/parking/book", { slot_id: Number(form.slot_id), unit_id: Number(selectedUnit), vehicle_number: form.vehicle_number.trim(), booking_date: form.booking_date, start_time: form.start_time, end_time: form.end_time });
      alert("✅ Slot booked!");
      setForm({ slot_id: "", vehicle_number: "", booking_date: "", start_time: "", end_time: "" });
      loadSlots(selectedUnit); loadBookings(selectedUnit);
    } catch (err) { setError(err?.response?.data?.message || "Booking failed"); }
    finally { setSubmitting(false); }
  };

  useEffect(() => { loadUnits(); }, []);
  useEffect(() => { if (selectedUnit) { loadSlots(selectedUnit); loadBookings(selectedUnit); } }, [selectedUnit]);

  const availableSlots = slots.filter(s => s.status === "AVAILABLE");

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-xl font-semibold text-slate-900">🅿️ Parking Booking</h2>
          <p className="mt-1 text-sm text-slate-500">View available slots and book parking</p>
        </div>
        <div className="px-6 py-5">
          <label className="text-sm font-medium text-slate-700">Your Unit</label>
          <select className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)}>
            <option value="">-- Select Unit --</option>
            {units.map(u => <option key={u.id} value={u.id}>{u.unit_name} ({u.org_name})</option>)}
          </select>
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {selectedUnit && (
        <div className="flex gap-2">
          <button onClick={() => setTab("slots")} className={`h-10 rounded-xl px-4 text-sm font-medium ${tab === "slots" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>Available Slots ({availableSlots.length})</button>
          <button onClick={() => setTab("bookings")} className={`h-10 rounded-xl px-4 text-sm font-medium ${tab === "bookings" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>My Bookings ({bookings.length})</button>
        </div>
      )}

      {loading && <div className="rounded-xl border border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500">Loading…</div>}

      {/* ── Slots + Book Form ─────────── */}
      {selectedUnit && !loading && tab === "slots" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5"><h3 className="text-lg font-semibold text-slate-900">Book a Slot</h3></div>
          <form onSubmit={handleBook} className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Slot *</label>
                <select className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={form.slot_id} onChange={e => setForm({...form, slot_id: e.target.value})} required>
                  <option value="">-- Select --</option>
                  {availableSlots.map(s => <option key={s.id} value={s.id}>{s.slot_number} (F{s.floor}, {s.slot_type})</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Vehicle *</label>
                <input type="text" className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" value={form.vehicle_number} onChange={e => setForm({...form, vehicle_number: e.target.value.toUpperCase()})} placeholder="MH12AB1234" required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Date *</label>
                <input type="date" className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" value={form.booking_date} onChange={e => setForm({...form, booking_date: e.target.value})} min={new Date().toISOString().split("T")[0]} required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Start *</label>
                <input type="time" className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">End *</label>
                <input type="time" className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} required />
              </div>
            </div>
            <button type="submit" disabled={submitting} className="h-10 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">{submitting ? "Booking…" : "Book Slot"}</button>
          </form>

          <div className="px-6 pb-5">
            <h4 className="text-sm font-medium text-slate-700 mb-3">All Slots</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {slots.map(s => (
                <div key={s.id} className={`rounded-xl border p-3 text-center text-xs ${s.status === "AVAILABLE" ? "border-emerald-200 bg-emerald-50" : s.status === "OCCUPIED" ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50"}`}>
                  <div className="font-semibold text-slate-900">{s.slot_number}</div>
                  <div className="text-slate-500">F{s.floor} · {s.slot_type === "TWO_WHEELER" ? "2W" : "4W"}</div>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Bookings Tab ─────────── */}
      {selectedUnit && !loading && tab === "bookings" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-6 py-5">
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Slot</th>
                      <th className="px-4 py-3 text-left font-semibold">Vehicle</th>
                      <th className="px-4 py-3 text-left font-semibold">Date</th>
                      <th className="px-4 py-3 text-left font-semibold">Time</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-medium text-slate-900">{b.slot_number} (F{b.floor})</td>
                        <td className="px-4 py-3 text-slate-900">{b.vehicle_number}</td>
                        <td className="px-4 py-3 text-slate-700">{new Date(b.booking_date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-slate-700">{b.start_time} – {b.end_time}</td>
                        <td className="px-4 py-3"><BookingBadge status={b.status} /></td>
                      </tr>
                    ))}
                    {!bookings.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No bookings yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
