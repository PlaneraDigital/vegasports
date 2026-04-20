import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../utils/auth";
import {
  Clock, CalendarDays, ShieldCheck, ChevronRight, XCircle, ArrowLeft
} from "lucide-react";

/* format function */
function fmt(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ap}`;
}

function BookingSummaryModal({ isOpen, onClose, selectedSlots, turf, sym }) {
  if (!isOpen) return null;

  const slotsByDate = selectedSlots.reduce((acc, slot) => {
    const dStr = new Date(slot.date).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
    if (!acc[dStr]) acc[dStr] = [];
    acc[dStr].push(slot);
    return acc;
  }, {});

  const totalAmount = selectedSlots.reduce((acc, s) => acc + s.price, 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-[2px] p-4">
      <div className="bg-[#0a0a0a] border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl shadow-green-900/10 animate-in fade-in zoom-in duration-200 relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-green-500/5 before:to-transparent before:pointer-events-none">
        <div className="px-7 pt-8 pb-5 border-b border-zinc-800/80 relative z-10 bg-gradient-to-b from-zinc-900/50 to-transparent">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Booking Summary
          </h2>
          <p className="text-zinc-500 text-xs mt-1.5 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-green-500/80"/> Securely review your session details
          </p>
        </div>

        <div className="px-7 py-6 space-y-5 relative z-10 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="flex justify-between items-center pb-4 border-b border-zinc-800/60">
            <span className="text-[13px] text-zinc-400 font-medium tracking-wide">Ground</span>
            <span className="text-[14px] font-bold text-zinc-100 text-right">{turf.name}</span>
          </div>

          <div className="pb-4 border-b border-zinc-800/60 space-y-5">
             {Object.entries(slotsByDate).map(([dateStr, dSlots]) => (
                <div key={dateStr} className="bg-zinc-900/40 p-4.5 rounded-2xl border border-zinc-800/60">
                  <div className="flex justify-between items-center mb-3.5 pb-3.5 border-b border-zinc-800/50 px-4 pt-4">
                    <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest">Date</span>
                    <span className="text-[13px] font-extrabold text-zinc-200">{dateStr}</span>
                  </div>
                  <div className="px-4 pb-4">
                    <span className="text-[10px] text-zinc-500 font-bold block mb-2.5 uppercase tracking-widest">Selected Slots</span>
                    <div className="flex flex-wrap gap-2.5">
                      {dSlots.map(s => (
                        <span key={s._id} className="bg-green-950/40 text-green-400 border border-green-500/30 px-3.5 py-1.5 rounded-lg text-[11px] font-bold shadow-[0_0_10px_rgba(34,197,94,0.05)] tracking-wide">
                          {fmt(s.start_time)} - {fmt(s.end_time)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
             ))}
          </div>

          <div className="flex justify-between items-center pb-2 px-1">
            <span className="text-[12px] text-zinc-400 font-medium tracking-wide">Price / Slot</span>
            <span className="text-[13px] font-bold text-zinc-300 text-right">{sym}{turf.price_per_hour}</span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-zinc-800/60 px-1">
            <span className="text-[12px] text-zinc-400 font-medium tracking-wide">Total Slots</span>
            <span className="text-[12px] font-bold text-green-400 text-right bg-green-400/10 px-2.5 py-1 rounded-md border border-green-400/20">{selectedSlots.length}</span>
          </div>

          <div className="flex justify-between items-end pt-2 px-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Total Amount</span>
            <span className="text-4xl font-extrabold text-white text-right tracking-tight">{sym}{totalAmount}</span>
          </div>

          <div className="bg-[#1a1500]/40 border border-yellow-500/20 rounded-2xl p-4 flex gap-3 items-start mt-4">
            <span className="text-yellow-500 text-sm mt-0.5">⚠️</span>
            <p className="text-yellow-200/60 text-[11px] font-medium leading-relaxed tracking-wide">
              Bookings once confirmed cannot be cancelled within 2 hours of playtime.
            </p>
          </div>
        </div>

        <div className="px-7 py-6 bg-black/60 border-t border-zinc-800/80 flex gap-3 relative z-10 backdrop-blur-2xl">
          <button onClick={onClose} className="flex-[0.45] py-4 bg-zinc-900 border border-zinc-800 text-zinc-400 text-[13px] font-bold rounded-2xl hover:bg-zinc-800 hover:text-zinc-200 transition-colors">
            Cancel
          </button>
          <button onClick={() => {/* payment next */}} className="flex-1 py-4 bg-white text-black text-[14px] font-bold rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:bg-zinc-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
             Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingCard({ turf, onConfirmBooking }) {
  const sym = turf.currency === "INR" ? "₹" : (turf.currency || "₹");

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState([]);
  
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState(null);

  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const isSameDate = (d1, d2) => d1.toDateString() === d2.toDateString();

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        setSlotError(null);

        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const day = String(selectedDate.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;

        const res = await api.get(`/api/slots?turf_id=${turf._id}&date=${dateStr}`);
        setSlots(res.data.slots || []);
      } catch (err) {
        setSlotError(err.response?.data?.message || "Failed to load slots");
      } finally {
        setLoadingSlots(false);
      }
    };

    if (turf?._id) {
      fetchSlots();
    }
  }, [selectedDate, turf._id]);

  return (
    <div className="bg-[#0a0a0a] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-green-500/5 before:to-transparent before:pointer-events-none">
      
      <div className="px-7 pt-8 pb-5 border-b border-zinc-800/80 relative z-10 bg-gradient-to-b from-zinc-900/50 to-transparent">
        <h3 className="text-zinc-400 font-semibold text-[10px] tracking-[0.2em] uppercase mb-3 text-green-400/80">Book your slot</h3>
        <div className="flex items-baseline gap-1.5">
          <span className="text-5xl font-extrabold text-white tracking-tight">{sym}{turf.price_per_hour}</span>
          <span className="text-zinc-500 text-sm font-medium">/ hour</span>
        </div>
        {turf.slot_duration_minutes && (
          <p className="text-emerald-300 text-xs mt-3 flex items-center gap-1.5 font-medium bg-emerald-950/40 w-fit px-3 py-1.5 rounded-lg border border-emerald-900/60 shadow-inner">
            <Clock size={13} className="text-emerald-500" /> {turf.slot_duration_minutes} min duration
          </p>
        )}
      </div>

      <div className="px-6 pt-7 pb-3 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[13px] font-bold text-zinc-100 flex items-center gap-2">
            <CalendarDays size={15} className="text-zinc-400" /> Select Date
          </h4>
          <span className="text-[10px] uppercase tracking-wider text-green-400 font-bold bg-green-400/10 px-2.5 py-1 rounded-md text-right border border-green-400/20">
            {selectedDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </span>
        </div>
        
        <div className="flex gap-2.5 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {dates.map((d, i) => {
            const isSelected = isSameDate(d, selectedDate);
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(d)}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-[60px] h-[72px] rounded-2xl border transition-all duration-300 group relative ${
                  isSelected
                    ? "bg-green-600 border-green-500 shadow-[0_8px_24px_rgba(34,197,94,0.35)] scale-[1.04] z-10"
                    : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-500 hover:bg-zinc-800"
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 transition-colors ${isSelected ? "text-green-100" : "text-zinc-500 group-hover:text-zinc-300"}`}>
                  {d.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className={`text-xl font-black transition-colors ${isSelected ? "text-white" : "text-zinc-300 group-hover:text-white"}`}>
                  {d.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 pt-5 pb-7 relative z-10 flex-1">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[13px] font-bold text-zinc-100 flex items-center gap-2">
             <Clock size={15} className="text-zinc-400" /> Available Slots
          </h4>
          <span className="text-[11px] text-zinc-500 font-medium">
            {loadingSlots ? "Loading..." : `${slots.length} slots found`}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-2.5">
          {loadingSlots ? (
            <div className="col-span-3 text-center py-8 text-emerald-400 text-[11px] font-medium tracking-wide uppercase animate-pulse">
              Loading slots...
            </div>
          ) : slotError ? (
            <div className="col-span-3 text-center py-4 px-3 text-red-400 text-xs font-medium bg-red-950/20 rounded-xl border border-red-900/50">
              {slotError}
            </div>
          ) : slots.length === 0 ? (
             <div className="col-span-3 flex flex-col items-center justify-center py-8 text-zinc-500">
               <span className="text-xs font-medium bg-zinc-900/80 px-4 py-2 rounded-lg border border-zinc-800">No slots available on this date.</span>
             </div>
          ) : (
            slots.map((slot) => {
              const isBooked = slot.status === "booked" || slot.status === "on_hold" || slot.status === "blocked";
              const isSelected = selectedSlots.some(s => s._id === slot._id);

              const toggleSlot = () => {
                if (isSelected) setSelectedSlots(prev => prev.filter(s => s._id !== slot._id));
                else setSelectedSlots(prev => [...prev, slot]);
              };

              return (
                <button
                  key={slot._id}
                  disabled={isBooked}
                  onClick={toggleSlot}
                  className={`relative flex flex-col items-center justify-center py-3 rounded-xl border transition-all duration-300 overflow-hidden group ${
                    isBooked
                      ? "bg-zinc-950 border-zinc-900 opacity-40 cursor-not-allowed"
                      : isSelected
                      ? "bg-green-950/80 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)] ring-1 ring-green-500 scale-[1.04] z-10"
                      : "bg-zinc-900 border-zinc-800 hover:border-green-500/50 hover:bg-zinc-800/90"
                  }`}
                >
                  <span className={`text-[13px] font-bold transition-colors ${
                    isSelected ? "text-green-400" : (isBooked ? "text-zinc-600" : "text-zinc-200 group-hover:text-green-50")
                  }`}>
                    {fmt(slot.start_time)}
                  </span>
                  <span className={`text-[10px] mt-0.5 font-medium transition-colors ${
                    isSelected ? "text-green-300/90" : (isBooked ? "text-zinc-700" : "text-zinc-500 group-hover:text-zinc-400")
                  }`}>
                    {sym}{slot.price}
                  </span>
                  
                  {isBooked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[0.5px]">
                      <span className="text-[9px] uppercase tracking-wider bg-zinc-900/90 text-zinc-500 px-2 py-0.5 rounded-full font-bold border border-zinc-800 shadow-sm">
                        {slot.status === "blocked" ? "Blocked" : "Full"}
                      </span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="px-6 py-6 border-t border-zinc-800/80 bg-black/40 relative z-10 mt-auto backdrop-blur-xl">
        {selectedSlots.length > 0 && (
          <div className="mb-5 max-h-[140px] overflow-y-auto space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {selectedSlots.map((s) => (
              <div key={s._id} className="flex justify-between items-center text-xs bg-zinc-900/60 px-3.5 py-2.5 rounded-xl border border-zinc-700/50">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-300 font-semibold">{new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  <span className="text-zinc-600 text-[10px]">•</span>
                  <span className="text-emerald-400 font-bold">{fmt(s.start_time)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-300 font-bold">{sym}{s.price}</span>
                  <button onClick={() => setSelectedSlots(prev => prev.filter(item => item._id !== s._id))} className="text-zinc-500 hover:text-red-400 transition-colors">
                    <XCircle size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-end mb-5">
          <div>
            <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Total Amount</span>
            <span className={`text-3xl font-extrabold transition-colors duration-300 ${selectedSlots.length > 0 ? "text-white" : "text-zinc-700"}`}>
              {sym}{selectedSlots.reduce((acc, s) => acc + s.price, 0)}
            </span>
          </div>
          <div className="text-right pb-1">
             <span className="block text-[11px] text-emerald-400/90 font-bold bg-emerald-950/30 px-3 py-1.5 rounded-md border border-emerald-900/50 shadow-inner">
               {selectedSlots.length} {selectedSlots.length === 1 ? "slot" : "slots"} selected
             </span>
          </div>
        </div>
        
        <button
          disabled={selectedSlots.length === 0}
          onClick={() => onConfirmBooking?.(selectedSlots)}
          className={`w-full py-4 font-bold rounded-2xl transition-all duration-300 text-[15px] tracking-wide flex items-center justify-center gap-2 relative overflow-hidden group ${
            selectedSlots.length > 0
              ? "bg-white text-black hover:bg-zinc-200 shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-[0.98]"
              : "bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed"
          }`}
        >
          {selectedSlots.length > 0 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          )}
          {selectedSlots.length > 0 ? (
            <>
              Confirm Booking
              <ChevronRight size={18} />
            </>
          ) : (
            "Select Timings First"
          )}
        </button>
        <p className="text-center text-zinc-500 text-[10px] mt-4 uppercase tracking-widest font-bold flex items-center justify-center gap-1.5">
          <ShieldCheck size={14} className="text-zinc-600" /> Secure & Instant Checkout
        </p>
      </div>
    </div>
  );
}

export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [turf, setTurf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [selectedSlotsToBook, setSelectedSlotsToBook] = useState([]);

  useEffect(() => {
    const fetchTurf = async () => {
      try {
        const base = import.meta.env.VITE_API_URL || "http://localhost:5001";
        const res  = await axios.get(`${base}/api/turfs/${id}`);
        setTurf(res.data.turf);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load turf details.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTurf();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center text-green-500">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error || !turf) {
    return (
      <div className="bg-black min-h-screen flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-2xl font-bold text-white mb-2">Error Loading Turf</h1>
        <p className="text-zinc-500 text-sm mb-7 max-w-xs">{error}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-green-600 text-white rounded-full">Go Back</button>
      </div>
    );
  }

  const sym = turf.currency === "INR" ? "₹" : (turf.currency || "₹");

  return (
    <div className="bg-black min-h-screen pb-20 pt-6">
      <div className="max-w-xl mx-auto px-5 sm:px-8">
        <button onClick={() => navigate(`/turf/${id}`)} className="text-zinc-400 hover:text-white flex items-center gap-2 mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Turf Information
        </button>
        <h1 className="text-2xl font-bold text-white mb-6">Book slots for {turf.name}</h1>
        
        <BookingCard 
          turf={turf} 
          onConfirmBooking={(slots) => {
            setSelectedSlotsToBook(slots);
            setIsSummaryModalOpen(true);
          }} 
        />
      </div>

      <BookingSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        selectedSlots={selectedSlotsToBook}
        turf={turf}
        sym={sym}
      />
    </div>
  );
}
