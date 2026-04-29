import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
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
  // Morning now starts from 12 AM (0) and goes until 7 PM (19)
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

/* ─── Success Screens (Red Card / Blue Card) ────────────────────────────────── */
function RedCardScreen({ booking, advanceResult, turf, onGoTicket, onGoHome }) {
  const { balance_due, balance_link_url } = advanceResult;
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white border-2 border-red-500 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl p-10">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={40} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-zinc-900 mb-2">Advance Paid!</h2>
        <p className="text-zinc-500 text-sm mb-6">Slot secured at {turf.name}</p>

        <div className="bg-red-50 rounded-2xl p-6 text-left mb-6 border border-red-100">
          <p className="text-red-800 font-black text-sm mb-3">🔴 RED CARD: BALANCE DUE</p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-red-400 font-bold uppercase">Balance</span><span className="text-red-700 font-black">₹{balance_due}</span></div>
            <div className="flex justify-between"><span className="text-red-400 font-bold uppercase">Status</span><span className="text-red-700 font-bold">Pending Clearance</span></div>
          </div>
        </div>

        {balance_link_url && (
          <div className="mb-6 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Scan to pay remaining</p>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(balance_link_url)}`} className="mx-auto rounded-xl border-4 border-white mb-3" alt="QR" />
            <a href={balance_link_url} target="_blank" rel="noreferrer" className="text-blue-600 font-bold text-xs underline">Pay Balance Online ↗</a>
          </div>
        )}

        <button onClick={onGoTicket} className="w-full py-4 bg-zinc-900 text-white font-bold rounded-2xl mb-3">View Ticket</button>
        <button onClick={onGoHome} className="w-full py-3 text-zinc-400 font-bold text-sm">Return Home</button>
      </div>
    </div>
  );
}

function BlueCardScreen({ booking, turf, onGoTicket, onGoHome }) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white border-2 border-emerald-500 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl p-10">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black text-zinc-900 mb-2">You're Pitch Ready!</h2>
        <p className="text-zinc-500 text-sm mb-6">Full payment confirmed at {turf.name}</p>

        <div className="bg-emerald-50 rounded-2xl p-6 text-left mb-8 border border-emerald-100">
          <p className="text-emerald-800 font-black text-sm mb-3">🔵 BLUE CARD: FULL ACCESS</p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-emerald-400 font-bold uppercase">Time</span><span className="text-emerald-700 font-black">{fmt(booking.start_time)} – {fmt(booking.end_time)}</span></div>
            <div className="flex justify-between"><span className="text-emerald-400 font-bold uppercase">Paid</span><span className="text-emerald-700 font-black">₹{booking.total_amount}</span></div>
          </div>
        </div>

        <button onClick={onGoTicket} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl mb-3">View Ticket</button>
        <button onClick={onGoHome} className="w-full py-3 text-zinc-400 font-bold text-sm">Return Home</button>
      </div>
    </div>
  );
}

/* ─── Summary Modal ──────────────────────────────────────────────────────── */
function BookingSummaryModal({ isOpen, onClose, selectedSlots, turf, onAdvanceSuccess, onFullSuccess }) {
  const [booking, setBooking] = useState(false);
  const [err, setErr] = useState(null);
  const [payType, setPayType] = useState("full");

  if (!isOpen) return null;
  const total = selectedSlots.reduce((acc, s) => acc + s.price, 0);
  const payable = payType === "advance" ? 200 : total;

  const handlePay = async () => {
    setBooking(true); setErr(null);
    try {
      const slot_ids = selectedSlots.map(s => s._id);
      const d = new Date(selectedSlots[0].date);
      const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

      const bRes = await api.post("/api/bookings", { turf_id: turf._id, date, slot_ids });
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-zinc-200 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-8 pb-4">
          <h2 className="text-xl font-black text-zinc-900">Summary</h2>
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center text-sm"><span className="text-zinc-400">Venue</span><span className="text-zinc-900 font-bold">{turf.name}</span></div>
            <div className="space-y-2">
              <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest">Slots</span>
              <div className="flex flex-wrap gap-2">
                {selectedSlots.map(s => (
                  <div key={s._id} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-xl text-xs font-bold">{fmt(s.start_time)}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <button onClick={() => setPayType("advance")} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${payType === 'advance' ? 'border-red-500 bg-red-50' : 'border-zinc-100 bg-white hover:border-zinc-200'}`}>
              <Wallet size={18} className={payType === 'advance' ? 'text-red-500' : 'text-zinc-400'} />
              <span className="text-[11px] font-black uppercase">Advance</span>
              <span className="text-xs font-bold text-zinc-900">₹200</span>
            </button>
            <button onClick={() => setPayType("full")} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${payType === 'full' ? 'border-emerald-500 bg-emerald-50' : 'border-zinc-100 bg-white hover:border-zinc-200'}`}>
              <CreditCard size={18} className={payType === 'full' ? 'text-emerald-500' : 'text-zinc-400'} />
              <span className="text-[11px] font-black uppercase">Full Pay</span>
              <span className="text-xs font-bold text-zinc-900">₹{total}</span>
            </button>
          </div>
        </div>

        <div className="p-8 bg-zinc-50 border-t border-zinc-100">
          <div className="flex justify-between items-end mb-6">
            <span className="text-zinc-400 text-sm font-bold mb-1">Payable Now</span>
            <span className="text-3xl font-black text-zinc-900">₹{payable}</span>
          </div>
          {err && <p className="mb-4 text-red-500 text-xs font-bold">{err}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-4 text-zinc-400 font-bold hover:text-zinc-900 transition-colors">Cancel</button>
            <button onClick={handlePay} disabled={booking} className={`flex-[2] py-4 text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all ${payType === 'advance' ? 'bg-red-600 hover:bg-red-700 shadow-red-100' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'}`}>
              {booking ? <Loader2 size={18} className="animate-spin" /> : "Confirm & Pay"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [turf, setTurf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [activeTab, setActiveTab] = useState("morning");
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

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
    const fetchTurf = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api/turfs/${id}`);
        setTurf(res.data.turf);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchTurf();
  }, [id]);

  useEffect(() => {
    if (!turf) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const dStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        const res = await api.get(`/api/slots?turf_id=${turf._id}&date=${dStr}`);
        setSlots(res.data.slots || []);
        // Selection is cleared on date change to avoid confusion
        setSelectedSlots([]);
      } catch (err) { console.error(err); }
      finally { setLoadingSlots(false); }
    };
    fetchSlots();
  }, [selectedDate, turf]);

  if (loading) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;
  if (advanceResult) return <RedCardScreen advanceResult={advanceResult} turf={turf} onGoTicket={() => navigate(`/ticket/${confirmedId}`)} onGoHome={() => navigate("/")} />;
  if (fullResult) return <BlueCardScreen booking={{ ...fullResult, start_time: selectedSlots[0].start_time, end_time: selectedSlots[selectedSlots.length - 1].end_time }} turf={turf} onGoTicket={() => navigate(`/ticket/${fullResult.booking_id}`)} onGoHome={() => navigate("/")} />;

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
    <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-20 pt-10">
      <div className="max-w-4xl mx-auto px-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 font-bold text-sm hover:text-zinc-900 transition-colors mb-10">
          <ArrowLeft size={16} /> Back
        </button>

        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black mb-1">Time slots available</h1>
            <p className="text-zinc-500 font-medium">{turf.name}</p>
          </div>

          <div ref={calRef} className="relative">
            <button onClick={() => setCalOpen(!calOpen)} className="flex items-center gap-2 bg-white border border-zinc-200 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:border-zinc-300 transition-all">
              <CalendarDays size={16} className="text-zinc-400" />
              {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()]}
            </button>
            {calOpen && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-zinc-200 rounded-2xl p-4 shadow-2xl z-[150] w-[280px]">
                <div className="flex justify-between items-center mb-4 px-1">
                  <span className="font-black text-sm">{MONTHS[viewMonth]} {viewYear}</span>
                  <div className="flex gap-1">
                    <button onClick={prevMonth} disabled={isPrevDisabled} className="p-1 disabled:opacity-20"><ChevronUp size={16} /></button>
                    <button onClick={nextMonth} className="p-1"><ChevronDown size={16} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {DAYS_SHORT.map(d => <span key={d} className="text-[10px] font-black text-zinc-300 uppercase">{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calCells.map((d, i) => {
                    if (d === null) return <div key={`empty-${i}`} />;
                    const dObj = new Date(viewYear, viewMonth, d);
                    const isPast = dObj < today;
                    const isSel = dObj.toDateString() === selectedDate.toDateString();
                    return (
                      <button key={i} disabled={isPast} onClick={() => { setSelectedDate(dObj); setCalOpen(false); }}
                        className={`aspect-square text-xs font-bold rounded-lg transition-all ${isSel ? 'bg-zinc-900 text-white' : isPast ? 'text-zinc-200 cursor-not-allowed' : 'text-zinc-600 hover:bg-zinc-100'}`}>
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="bg-white border border-zinc-200 rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="flex border-b border-zinc-100">
            <button onClick={() => setActiveTab("morning")} className={`flex-1 py-6 flex items-center justify-center gap-2 text-sm font-black transition-all ${activeTab === 'morning' ? 'text-zinc-900 bg-white' : 'text-zinc-300 bg-zinc-50/50 hover:text-zinc-500'}`}>
              <Sun size={18} /> Morning
            </button>
            <button onClick={() => setActiveTab("evening")} className={`flex-1 py-6 flex items-center justify-center gap-2 text-sm font-black transition-all ${activeTab === 'evening' ? 'text-zinc-900 bg-white' : 'text-zinc-300 bg-zinc-50/50 hover:text-zinc-500'}`}>
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

                  // Real-time disabling logic (with 30-min buffer)
                  const isToday = selectedDate.toDateString() === new Date().toDateString();
                  const now = new Date();
                  const currentMins = now.getHours() * 60 + now.getMinutes();
                  const [sh, sm] = slot.start_time.split(":").map(Number);
                  const slotMins = sh * 60 + sm;
                  // Disable if slot has passed OR starts within the next 30 minutes
                  const isPast = isToday && slotMins < (currentMins + 30);

                  return (
                    <button key={slot._id} disabled={isBooked || isPast || (isBlockedBySelection && !isSel)} onClick={() => toggleSlot(slot)}
                      className={`group relative py-6 px-4 rounded-3xl border-2 transition-all duration-300 ${isSel ? 'bg-zinc-900 border-zinc-900 text-white shadow-xl scale-[1.02]' : (isBooked || isPast || (isBlockedBySelection && !isSel)) ? 'bg-zinc-50 border-zinc-50 text-zinc-200 cursor-not-allowed grayscale' : 'bg-white border-zinc-100 text-zinc-900 hover:border-zinc-900 hover:shadow-lg'}`}>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-sm font-black tracking-tight whitespace-nowrap">{fmtRange(slot.start_time, slot.end_time)}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isSel ? 'text-zinc-500' : 'text-zinc-400'}`}>₹{slot.price}</span>
                      </div>
                      {(isBooked || isPast) && <div className="absolute top-2 right-2"><XCircle size={12} className="text-zinc-200" /></div>}
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
            <button onClick={() => setIsSummaryOpen(true)} className="w-full bg-zinc-900 text-white p-6 rounded-3xl shadow-2xl shadow-zinc-200 flex items-center justify-between group hover:bg-black transition-all active:scale-95">
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
        onAdvanceSuccess={(res, id) => { setConfirmedId(id); setAdvanceResult(res); setIsSummaryOpen(false); }}
        onFullSuccess={(res) => { setFullResult(res); setIsSummaryOpen(false); }}
      />
    </div>
  );
}