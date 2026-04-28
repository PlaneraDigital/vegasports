import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../utils/auth";
import {
  ShieldCheck, ArrowLeft,
  CheckCircle2, AlertCircle, Loader2, CalendarDays,
  ChevronUp, ChevronDown, Sun, Moon, Clock
} from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_SHORT = ["Su","Mo","Tu","We","Th","Fr","Sa"];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function fmt(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ap}`;
}

function isMorningSlot(start_time) {
  if (!start_time) return true;
  const [h] = start_time.split(":").map(Number);
  return h >= 7 && h < 19;
}

// Fixed Overlap Check: Handles midnight (00:00) wrapping
const isOverlapping = (s1, e1, s2, e2) => {
  const toMins = (t) => {
    const [h, m] = t.split(":").map(Number);
    let total = h * 60 + m;
    return total;
  };

  let start1 = toMins(s1);
  let end1   = toMins(e1);
  let start2 = toMins(s2);
  let end2   = toMins(e2);

  // If end time is midnight (00:00) and start is late (e.g. 11 PM), treat end as 1440
  if (end1 <= start1 && end1 === 0) end1 = 1440;
  if (end2 <= start2 && end2 === 0) end2 = 1440;

  return start1 < end2 && start2 < end1;
};

/* ─── Success Screen ─────────────────────────────────────────────────────── */
function BookingSuccessScreen({ booking, turf, onGoHome, onGoProfile }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-100/80 backdrop-blur-md p-4">
      <div className="bg-white border border-zinc-200 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl p-10 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black text-zinc-900 mb-2">Booking Confirmed!</h2>
        <p className="text-zinc-500 text-sm mb-8">Game on at <span className="text-zinc-900 font-bold">{turf.name}</span></p>
        <div className="bg-zinc-50 rounded-2xl p-5 text-left mb-8 space-y-3 border border-zinc-100">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400 font-bold uppercase tracking-widest">Time</span>
            <span className="text-zinc-900 font-bold">{fmt(booking.start_time)} – {fmt(booking.end_time)}</span>
          </div>
          <div className="flex justify-between text-xs border-t border-zinc-200 pt-3">
            <span className="text-zinc-400 font-bold uppercase tracking-widest">Paid</span>
            <span className="text-emerald-600 font-bold">₹{booking.total_amount}</span>
          </div>
        </div>
        <button onClick={onGoProfile} className="w-full py-4 bg-zinc-900 text-white text-sm font-bold rounded-2xl mb-3 hover:bg-black transition-all">View Bookings</button>
        <button onClick={onGoHome} className="w-full py-3 text-zinc-400 text-sm font-bold hover:text-zinc-900 transition-colors">Return Home</button>
      </div>
    </div>
  );
}

/* ─── Summary Modal ──────────────────────────────────────────────────────── */
function BookingSummaryModal({ isOpen, onClose, selectedSlots, turf, onBookingSuccess }) {
  const [booking, setBooking] = useState(false);
  const [err, setErr] = useState(null);

  if (!isOpen) return null;
  const total = selectedSlots.reduce((acc, s) => acc + s.price, 0);

  const handlePay = async () => {
    setBooking(true); setErr(null);
    try {
      const slot_ids = selectedSlots.map(s => s._id);
      const d = new Date(selectedSlots[0].date);
      const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
      const bRes = await api.post("/api/bookings", { turf_id: turf._id, date, slot_ids });
      const oRes = await api.post("/api/payment/create-order", { booking_id: bRes.data.booking_id });
      const options = {
        key: oRes.data.razorpay_key_id,
        amount: oRes.data.amount,
        order_id: oRes.data.order_id,
        name: turf.name,
        handler: async (res) => {
          const vRes = await api.post("/api/payment/verify", {
            booking_id: bRes.data.booking_id,
            razorpay_order_id: res.razorpay_order_id,
            razorpay_payment_id: res.razorpay_payment_id,
            razorpay_signature: res.razorpay_signature
          });
          onBookingSuccess(vRes.data);
        },
        theme: { color: "#10b981" }
      };
      new window.Razorpay(options).open();
    } catch (e) { setErr(e.response?.data?.message || "Payment failed"); }
    finally { setBooking(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
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
          <div className="mt-8 pt-6 border-t border-zinc-100 flex justify-between items-end">
            <span className="text-zinc-400 text-sm font-bold mb-1">Payable</span>
            <span className="text-3xl font-black text-zinc-900">₹{total}</span>
          </div>
          {err && <p className="mt-4 text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-100">{err}</p>}
        </div>
        <div className="p-8 bg-zinc-50 border-t border-zinc-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 text-zinc-400 font-bold hover:text-zinc-900 transition-colors">Cancel</button>
          <button onClick={handlePay} disabled={booking} className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all">
            {booking ? <Loader2 size={18} className="animate-spin" /> : "Confirm & Pay"}
          </button>
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
  const [confirmed, setConfirmed] = useState(null);

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

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };
  const isPrevDisabled = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const calCells = [];
  for (let i = 0; i < firstDay; i++) calCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calCells.push(d);

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
        const dStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
        const res = await api.get(`/api/slots?turf_id=${turf._id}&date=${dStr}`);
        setSlots(res.data.slots || []);
      } catch (err) { console.error(err); }
      finally { setLoadingSlots(false); }
    };
    fetchSlots();
  }, [selectedDate, turf]);

  if (loading) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;
  if (confirmed) return <BookingSuccessScreen booking={confirmed} turf={turf} onGoHome={() => navigate("/")} onGoProfile={() => navigate("/profile")} />;

  const morningSlots = slots.filter(s => isMorningSlot(s.start_time));
  const eveningSlots = slots.filter(s => !isMorningSlot(s.start_time));
  const visibleSlots = activeTab === "morning" ? morningSlots : eveningSlots;

  const toggleSlot = (slot) => {
    setSelectedSlots(prev => prev.some(s => s._id === slot._id) ? prev.filter(s => s._id !== slot._id) : [...prev, slot]);
  };

  const morningPrice = turf.pricing?.morning?.price || turf.price_per_hour;
  const eveningPrice = turf.pricing?.evening?.price || turf.price_per_hour;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-20 pt-10">
      <div className="max-w-4xl mx-auto px-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 font-bold text-sm hover:text-zinc-900 transition-colors mb-10">
          <ArrowLeft size={16} /> Back
        </button>
        
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black mb-1">Reserve your slot</h1>
            <p className="text-zinc-500 font-medium">{turf.name}</p>
          </div>

          {/* Date Picker Component */}
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
                <div className="grid grid-cols-7 gap-1 text-center">
                  {DAYS_SHORT.map(d => <div key={d} className="text-[10px] font-black text-emerald-600 pb-2">{d}</div>)}
                  {calCells.map((day, idx) => {
                    if (!day) return <div key={`e-${idx}`} />;
                    const cellD = new Date(viewYear, viewMonth, day); cellD.setHours(0,0,0,0);
                    const isPast = cellD < today;
                    const isSel = cellD.getTime() === new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime();
                    return (
                      <button key={day} disabled={isPast} onClick={() => { setSelectedDate(cellD); setSelectedSlots([]); setCalOpen(false); }} className={`aspect-square rounded-lg text-xs font-bold transition-all ${isSel ? 'bg-zinc-900 text-white' : isPast ? 'text-zinc-200 cursor-not-allowed' : 'hover:bg-zinc-100 text-zinc-900'}`}>{day}</button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="bg-white border border-zinc-200 rounded-[2.5rem] overflow-hidden shadow-xl">
          <div className="p-8 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-50/50">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">₹{activeTab === "morning" ? morningPrice : eveningPrice}</span>
              <span className="text-zinc-400 text-xs font-black uppercase tracking-widest">/ slot</span>
            </div>
            
            <div className="flex bg-zinc-100 p-1 rounded-2xl w-fit border border-zinc-200">
              <button onClick={() => { setActiveTab("morning"); setSelectedSlots([]); }} className={`px-6 py-2 rounded-xl text-sm font-black flex items-center gap-2 transition-all ${activeTab === 'morning' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'}`}>
                <Sun size={15} /> Morning
              </button>
              <button onClick={() => { setActiveTab("evening"); setSelectedSlots([]); }} className={`px-6 py-2 rounded-xl text-sm font-black flex items-center gap-2 transition-all ${activeTab === 'evening' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'}`}>
                <Moon size={15} /> Evening
              </button>
            </div>
          </div>

          <div className="p-8">
            <div className="flex items-center gap-3 mb-8 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              <Clock size={12} />
              <span>Timings ({activeTab === 'morning' ? '7 AM - 7 PM' : '7 PM - 7 AM'})</span>
            </div>

            {loadingSlots ? (
              <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {visibleSlots.map(slot => {
                  const isSelected = selectedSlots.some(s => s._id === slot._id);
                  const isTaken = slot.status !== "available" || slot.is_past;
                  const overlaps = selectedSlots.some(s => s._id !== slot._id && isOverlapping(slot.start_time, slot.end_time, s.start_time, s.end_time));
                  const disabled = isTaken || overlaps;

                  return (
                    <button
                      key={slot._id}
                      disabled={disabled}
                      onClick={() => toggleSlot(slot)}
                      className={`p-4 rounded-2xl border-2 transition-all text-left group ${
                        isSelected 
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100 scale-[0.98]" 
                          : disabled
                          ? "bg-zinc-50 border-zinc-50 text-zinc-200 cursor-not-allowed"
                          : "bg-white border-zinc-100 text-zinc-900 hover:border-emerald-500 hover:bg-emerald-50/30"
                      }`}
                    >
                      <span className="block text-sm font-black mb-0.5">{fmt(slot.start_time)}</span>
                      <span className={`block text-[10px] font-black ${isSelected ? 'text-emerald-100' : 'text-zinc-400'}`}>
                        {fmt(slot.end_time)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-8 bg-zinc-50 border-t border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Total Payable</span>
              <span className="text-4xl font-black text-zinc-900">₹{selectedSlots.reduce((acc, s) => acc + s.price, 0)}</span>
            </div>
            <button 
              disabled={selectedSlots.length === 0}
              onClick={() => setIsSummaryOpen(true)}
              className="px-12 py-4 bg-zinc-900 text-white font-black rounded-2xl shadow-xl shadow-zinc-200 disabled:bg-zinc-200 disabled:text-zinc-400 hover:bg-black transition-all active:scale-[0.95]"
            >
              Continue
            </button>
          </div>
        </div>
      </div>

      <BookingSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        selectedSlots={selectedSlots}
        turf={turf}
        onBookingSuccess={(d) => { setIsSummaryOpen(false); setConfirmed(d); }}
      />
    </div>
  );
}