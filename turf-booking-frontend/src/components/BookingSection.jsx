import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/auth";
import {
  ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle, Loader2, CalendarDays,
  ChevronUp, ChevronDown, Sun, Moon, Clock, Wallet, CreditCard, Ticket,
  ChevronRight, XCircle
} from "lucide-react";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function fmtTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const hours = h % 12 || 12;
  const mins = m === 0 ? "" : `:${String(m).padStart(2, "0")}`;
  return `${hours}${mins} ${ap}`;
}

function fmtRange(start, end) {
  return `${fmtTime(start)} - ${fmtTime(end)}`;
}

function fmt(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ap}`;
}

function isMorningSlot(start_time) {
  if (!start_time) return true;
  const [h] = start_time.split(":").map(Number);
  return h >= 0 && h < 19;
}

const isOverlapping = (s1, e1, s2, e2) => {
  const toMins = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  let start1 = toMins(s1);
  let end1 = toMins(e1);
  let start2 = toMins(s2);
  let end2 = toMins(e2);
  if (end1 <= start1) end1 += 1440;
  if (end2 <= start2) end2 += 1440;
  return start1 < end2 && start2 < end1;
};

/* ─── Success Screens ─────────────────────────────────────────────────────── */
function RedCardScreen({ booking, advanceResult, turf, onGoTicket, onGoHome }) {
  const { balance_due, balance_link_url } = advanceResult;
  return (
    <div className="fixed inset-0 z-[300] bg-zinc-950 overflow-y-auto flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-zinc-900 border-2 border-red-500 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl p-10">
        <div className="w-20 h-20 rounded-full bg-red-900/20 flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={40} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-zinc-100 mb-2">Advance Paid!</h2>
        <p className="text-zinc-500 text-sm mb-6">Slot secured at {turf.name}</p>

        <div className="bg-red-900/20 rounded-2xl p-6 text-left mb-6 border border-red-900/30">
          <p className="text-red-400 font-black text-sm mb-3">🔴 RED CARD: BALANCE DUE</p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-red-500/60 font-bold uppercase">Balance</span><span className="text-red-400 font-black">₹{balance_due}</span></div>
            <div className="flex justify-between"><span className="text-red-500/60 font-bold uppercase">Status</span><span className="text-red-400 font-bold">Pending Clearance</span></div>
          </div>
        </div>

        {balance_link_url && (
          <div className="mb-6 p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Scan to pay remaining</p>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(balance_link_url)}`} className="mx-auto rounded-xl border-4 border-white mb-3" alt="QR" />
            <a href={balance_link_url} target="_blank" rel="noreferrer" className="text-blue-400 font-bold text-xs underline">Pay Balance Online ↗</a>
          </div>
        )}

        <button onClick={onGoTicket} className="w-full py-4 bg-zinc-800 text-white font-bold rounded-2xl mb-3 hover:bg-zinc-700 transition-colors">View Ticket</button>
        <button onClick={onGoHome} className="w-full py-3 text-zinc-500 font-bold text-sm hover:text-zinc-300">Return Home</button>
      </div>
    </div>
  );
}

function BlueCardScreen({ booking, turf, onGoTicket, onGoHome }) {
  return (
    <div className="fixed inset-0 z-[300] bg-zinc-950 overflow-y-auto flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-zinc-900 border-2 border-emerald-500 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl p-10">
        <div className="w-20 h-20 rounded-full bg-emerald-900/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black text-zinc-100 mb-2">You're Pitch Ready!</h2>
        <p className="text-zinc-500 text-sm mb-6">Full payment confirmed at {turf.name}</p>

        <div className="bg-emerald-900/20 rounded-2xl p-6 text-left mb-8 border border-emerald-900/30">
          <p className="text-emerald-400 font-black text-sm mb-3">🔵 BLUE CARD: FULL ACCESS</p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-emerald-500/60 font-bold uppercase">Time</span><span className="text-emerald-400 font-black">{fmt(booking.start_time)} – {fmt(booking.end_time)}</span></div>
            <div className="flex justify-between"><span className="text-emerald-500/60 font-bold uppercase">Paid</span><span className="text-emerald-400 font-black">₹{booking.total_amount}</span></div>
          </div>
        </div>

        <button onClick={onGoTicket} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl mb-3 hover:bg-emerald-700 transition-all">View Ticket</button>
        <button onClick={onGoHome} className="w-full py-3 text-zinc-400 font-bold text-sm hover:text-zinc-200">Return Home</button>
      </div>
    </div>
  );
}

/* ─── Summary Modal ──────────────────────────────────────────────────────── */
function BookingSummaryModal({ isOpen, onClose, selectedSlots, turf, duration, onAdvanceSuccess, onFullSuccess }) {
  const [booking, setBooking] = useState(false);
  const [err, setErr] = useState(null);
  const [payType, setPayType] = useState("advance");

  if (!isOpen) return null;
  const total = selectedSlots.reduce((acc, s) => acc + s.price, 0);
  const payable = 200;

  const handlePay = async () => {
    setBooking(true); setErr(null);
    try {
      const slot_ids = selectedSlots.map(s => s._id);
      const d = new Date(selectedSlots[0].date);
      const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

      const bRes = await api.post("/api/bookings", { turf_id: turf._id, date, slot_ids, duration });
      const booking_id = bRes.data.booking_id;

      if (payType === "advance") {
        const oRes = await api.post("/api/payment/create-advance-order", { booking_id });
        const options = {
          key: oRes.data.razorpay_key_id,
          amount: oRes.data.amount,
          order_id: oRes.data.order_id,
          name: turf.name,
          description: "₹200 Advance Payment",
          handler: async (res) => {
            const vRes = await api.post("/api/payment/verify-advance", {
              booking_id, razorpay_order_id: res.razorpay_order_id,
              razorpay_payment_id: res.razorpay_payment_id,
              razorpay_signature: res.razorpay_signature
            });
            onAdvanceSuccess(vRes.data, booking_id);
          },
          theme: { color: "#ef4444" }
        };
        new window.Razorpay(options).open();
      } else {
        const oRes = await api.post("/api/payment/create-order", { booking_id });
        const options = {
          key: oRes.data.razorpay_key_id,
          amount: oRes.data.amount,
          order_id: oRes.data.order_id,
          name: turf.name,
          handler: async (res) => {
            const vRes = await api.post("/api/payment/verify", {
              booking_id, razorpay_order_id: res.razorpay_order_id,
              razorpay_payment_id: res.razorpay_payment_id,
              razorpay_signature: res.razorpay_signature
            });
            onFullSuccess(vRes.data);
          },
          theme: { color: "#10b981" }
        };
        new window.Razorpay(options).open();
      }
    } catch (e) { setErr(e.response?.data?.message || "Payment failed"); }
    finally { setBooking(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-8 pb-4">
          <h2 className="text-xl font-black text-zinc-100">Summary</h2>
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center text-sm"><span className="text-zinc-500">Venue</span><span className="text-zinc-100 font-bold">{turf.name}</span></div>
            <div className="space-y-2">
              <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest">Slots</span>
              <div className="flex flex-wrap gap-2">
                {selectedSlots.map(s => (
                  <div key={s._id} className="bg-emerald-900/20 text-emerald-400 border border-emerald-900/30 px-3 py-1.5 rounded-xl text-xs font-bold">{fmt(s.start_time)}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-red-950/20 border border-red-900/30 flex items-start gap-3 text-left">
            <Wallet size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-[11px] font-black uppercase text-red-400 block mb-1">Advance Payment Policy</span>
              <span className="text-xs text-zinc-400 leading-relaxed block">
                To secure your slots, a fixed advance payment of <strong>₹200</strong> is required online. The remaining balance of <strong>₹{total - 200}</strong> must be paid at the turf venue to the caretaker or admin.
              </span>
            </div>
          </div>
        </div>

        <div className="p-8 bg-zinc-800 border-t border-zinc-700">
          <div className="flex justify-between items-end mb-6">
            <span className="text-zinc-500 text-sm font-bold mb-1">Payable Now</span>
            <span className="text-3xl font-black text-zinc-100">₹{payable}</span>
          </div>
          {err && <p className="mb-4 text-red-500 text-xs font-bold">{err}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-4 text-zinc-500 font-bold hover:text-zinc-100 transition-colors">Cancel</button>
            <button onClick={handlePay} disabled={booking} className="flex-[2] py-4 text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all bg-red-600 hover:bg-red-700">
              {booking ? <Loader2 size={18} className="animate-spin" /> : "Confirm & Pay"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function BookingSection({ turf }) {
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [activeTab, setActiveTab] = useState(() => {
    const hours = new Date().getHours();
    return hours >= 19 ? "evening" : "morning";
  });
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [duration, setDuration] = useState(() => turf?.slot_duration_minutes || 60);

  // Success states
  const [advanceResult, setAdvanceResult] = useState(null);
  const [fullResult, setFullResult] = useState(null);
  const [confirmedId, setConfirmedId] = useState(null);

  // Calendar state
  const calRef = useRef(null);
  const [calOpen, setCalOpen] = useState(false);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  useEffect(() => {
    const handler = (e) => { if (calRef.current && !calRef.current.contains(e.target)) setCalOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!turf) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const dStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        const res = await api.get(`/api/slots?turf_id=${turf._id}&date=${dStr}&duration=${duration}`);
        setSlots(res.data.slots || []);
        setSelectedSlots([]);
      } catch (err) { console.error(err); }
      finally { setLoadingSlots(false); }
    };
    fetchSlots();
  }, [selectedDate, turf, duration]);

  if (advanceResult) return <RedCardScreen advanceResult={advanceResult} turf={turf} onGoTicket={() => navigate(`/ticket/${confirmedId}`)} onGoHome={() => navigate("/")} />;
  if (fullResult) return <BlueCardScreen booking={{ ...fullResult, start_time: selectedSlots[0]?.start_time, end_time: selectedSlots[selectedSlots.length - 1]?.end_time }} turf={turf} onGoTicket={() => navigate(`/ticket/${fullResult.booking_id}`)} onGoHome={() => navigate("/")} />;

  const toggleSlot = (slot) => {
    if (selectedSlots.some(s => s._id === slot._id)) {
      setSelectedSlots(prev => prev.filter(s => s._id !== slot._id));
    } else {
      setSelectedSlots(prev => [...prev, slot]);
    }
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };
  const isPrevDisabled = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const calCells = [];
  for (let i = 0; i < firstDay; i++) calCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calCells.push(d);

  const morningSlots = slots.filter(s => isMorningSlot(s.start_time));
  const eveningSlots = slots.filter(s => !isMorningSlot(s.start_time));
  const visibleSlots = activeTab === "morning" ? morningSlots : eveningSlots;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-sm text-zinc-100 pb-20 pt-10 mt-10" id="booking-section">
      <div className="max-w-4xl mx-auto px-6">

        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black mb-1">Time slots available</h1>
            <p className="text-zinc-500 font-medium">{turf.name}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Duration Dropdown */}
            <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 px-3.5 py-2.5 rounded-xl text-sm font-bold shadow-sm text-zinc-200">
              <Clock size={16} className="text-zinc-500" />
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="bg-transparent border-none outline-none text-zinc-200 cursor-pointer font-bold pr-1"
                style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
              >
                <option value={30} className="bg-zinc-800 text-zinc-200 font-bold">30 Mins (0.5 hr)</option>
                <option value={60} className="bg-zinc-800 text-zinc-200 font-bold">1 Hour (1.0 hr)</option>
                <option value={90} className="bg-zinc-800 text-zinc-200 font-bold">1.5 Hours</option>
                <option value={120} className="bg-zinc-800 text-zinc-200 font-bold">2 Hours</option>
                <option value={150} className="bg-zinc-800 text-zinc-200 font-bold">2.5 Hours</option>
                <option value={180} className="bg-zinc-800 text-zinc-200 font-bold">3 Hours</option>
              </select>
            </div>

            {/* Date Selector */}
            <div ref={calRef} className="relative">
              <button onClick={() => setCalOpen(!calOpen)} className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:border-zinc-600 transition-all text-zinc-200">
                <CalendarDays size={16} className="text-zinc-500" />
                {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()]}
              </button>
              {calOpen && (
                <div className="absolute top-full right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-2xl p-4 shadow-2xl z-[150] w-[280px]">
                  <div className="flex justify-between items-center mb-4 px-1">
                    <span className="font-black text-sm text-zinc-100">{MONTHS[viewMonth]} {viewYear}</span>
                    <div className="flex gap-1">
                      <button onClick={prevMonth} disabled={isPrevDisabled} className="p-1 disabled:opacity-20 text-zinc-400"><ChevronUp size={16} /></button>
                      <button onClick={nextMonth} className="p-1 text-zinc-400"><ChevronDown size={16} /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {DAYS_SHORT.map(d => <span key={d} className="text-[10px] font-black text-zinc-500 uppercase">{d}</span>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calCells.map((d, i) => {
                      if (d === null) return <div key={`empty-${i}`} />;
                      const dObj = new Date(viewYear, viewMonth, d);
                      const isPast = dObj < today;
                      const isSel = dObj.toDateString() === selectedDate.toDateString();
                      return (
                        <button key={i} disabled={isPast} onClick={() => { setSelectedDate(dObj); setCalOpen(false); }}
                          className={`aspect-square text-xs font-bold rounded-lg transition-all ${isSel ? 'bg-emerald-600 text-white' : isPast ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-300 hover:bg-zinc-700'}`}>
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="bg-zinc-800 border border-zinc-700 rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="flex border-b border-zinc-700">
            <button onClick={() => setActiveTab("morning")} className={`flex-1 py-6 flex items-center justify-center gap-2 text-sm font-black transition-all ${activeTab === 'morning' ? 'text-zinc-100 bg-zinc-800' : 'text-zinc-600 bg-zinc-900/50 hover:text-zinc-400'}`}>
              <Sun size={18} /> Morning
            </button>
            <button onClick={() => setActiveTab("evening")} className={`flex-1 py-6 flex items-center justify-center gap-2 text-sm font-black transition-all ${activeTab === 'evening' ? 'text-zinc-100 bg-zinc-800' : 'text-zinc-600 bg-zinc-900/50 hover:text-zinc-400'}`}>
              <Moon size={18} /> Evening
            </button>
          </div>

          <div className="p-10 min-h-[400px]">
            {loadingSlots ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-zinc-300"><Loader2 className="animate-spin mb-4" size={32} /><p className="text-xs font-bold uppercase tracking-widest">Finding available times...</p></div>
            ) : visibleSlots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {visibleSlots.map(slot => {
                  const isBooked = ["booked", "on_hold", "blocked"].includes(slot.status);
                  const isSel = selectedSlots.some(s => s._id === slot._id);
                  const isBlockedBySelection = selectedSlots.some(s => s._id !== slot._id && isOverlapping(s.start_time, s.end_time, slot.start_time, slot.end_time));

                  const isToday = selectedDate.toDateString() === new Date().toDateString();
                  const now = new Date();
                  const currentMins = now.getHours() * 60 + now.getMinutes();
                  const [sh, sm] = slot.start_time.split(":").map(Number);
                  const slotMins = sh * 60 + sm;
                  const isPast = isToday && slotMins < (currentMins + 30);

                  return (
                    <button key={slot._id} disabled={isBooked || isPast || (isBlockedBySelection && !isSel)} onClick={() => toggleSlot(slot)}
                      className={`group relative py-6 px-4 rounded-3xl border-2 transition-all duration-300 ${isSel ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl scale-[1.02]' : (isBooked || isPast || (isBlockedBySelection && !isSel)) ? 'bg-zinc-900 border-zinc-800 text-zinc-700 cursor-not-allowed grayscale' : 'bg-zinc-700 border-zinc-700 text-zinc-200 hover:border-emerald-500 hover:shadow-lg'}`}>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-sm font-black tracking-tight whitespace-nowrap">{fmtRange(slot.start_time, slot.end_time)}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isSel ? 'text-zinc-300' : 'text-zinc-400'}`}>₹{slot.price}</span>
                        <span className={`text-[9px] font-bold mt-1 ${isSel ? 'text-white/80' : (isBooked || isPast) ? 'text-red-500' : 'text-emerald-500'}`}>
                          {isBooked || isPast ? "Booked" : "✓ Available"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-zinc-300"><Clock size={40} className="mb-4 opacity-20" /><p className="text-sm font-bold uppercase tracking-widest">No slots available for this time</p></div>
            )}
          </div>
        </div>

        {selectedSlots.length > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-[100]">
            <button onClick={() => setIsSummaryOpen(true)} className="w-full bg-zinc-950 text-white p-6 rounded-3xl shadow-2xl shadow-black/50 flex items-center justify-between group hover:bg-black transition-all active:scale-95 border border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black text-sm">{selectedSlots.length}</div>
                <div className="text-left"><p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Total Amount</p><p className="text-xl font-black">₹{selectedSlots.reduce((acc, s) => acc + s.price, 0)}</p></div>
              </div>
              <div className="flex items-center gap-2 font-black text-sm uppercase tracking-widest">Book Now <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" /></div>
            </button>
          </div>
        )}
      </div>

      <BookingSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        selectedSlots={selectedSlots}
        turf={turf}
        duration={duration}
        onAdvanceSuccess={(res, id) => { setConfirmedId(id); setAdvanceResult(res); setIsSummaryOpen(false); }}
        onFullSuccess={(res) => { setFullResult(res); setIsSummaryOpen(false); }}
      />
    </div>
  );
}