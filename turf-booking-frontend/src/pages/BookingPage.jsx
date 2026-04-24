import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../utils/auth";
import {
  Clock, CalendarDays, ShieldCheck, ChevronRight, XCircle, ArrowLeft,
  CheckCircle2, AlertCircle, Loader2, Home, CalendarCheck,
} from "lucide-react";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function fmt(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ap}`;
}

/* ─────────────────────────────────────────────────────────────────────────────
    BOOKING SUCCESS SCREEN (Light)
───────────────────────────────────────────────────────────────────────────── */
function BookingSuccessScreen({ booking, turf, sym, onGoHome, onGoProfile }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-100/80 backdrop-blur-md p-4">
      <div className="bg-white border border-zinc-200 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl relative">
        <div className="px-8 pt-12 pb-10 text-center relative z-10">
          {/* Success Icon */}
          <div className="w-24 h-24 rounded-full bg-emerald-50 border-4 border-white flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-100">
            <CheckCircle2 size={48} className="text-emerald-500" />
          </div>

          <h2 className="text-3xl font-black text-zinc-900 tracking-tight mb-3">
            Booking Confirmed!
          </h2>
          <p className="text-zinc-500 text-sm leading-relaxed mb-8 px-4">
            Your slot at <span className="text-zinc-900 font-bold">{turf.name}</span> is successfully reserved.
          </p>

          {/* Details Card */}
          <div className="bg-zinc-50 border border-zinc-100 rounded-[2rem] p-6 text-left space-y-4 mb-8">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Booking ID</span>
              <span className="text-zinc-900 text-xs font-mono font-bold px-2 py-1 bg-white rounded-md border border-zinc-200">
                #{booking.booking_id?.toString().slice(-8).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Time Slot</span>
              <span className="text-zinc-900 text-sm font-bold">
                {fmt(booking.start_time)} – {fmt(booking.end_time)}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-zinc-200 pt-4">
              <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Total Paid</span>
              <span className="text-emerald-600 text-2xl font-black">{sym}{booking.total_amount}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={onGoProfile}
              className="w-full py-4 bg-zinc-900 text-white text-sm font-bold rounded-2xl hover:bg-black transition-all active:scale-[0.98] shadow-lg shadow-zinc-200"
            >
              View in My Bookings
            </button>
            <button
              onClick={onGoHome}
              className="w-full py-3 text-zinc-500 text-sm font-bold rounded-2xl hover:text-zinc-900 transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
    BOOKING SUMMARY MODAL (Light)
───────────────────────────────────────────────────────────────────────────── */
function BookingSummaryModal({ isOpen, onClose, selectedSlots, turf, sym, onBookingSuccess }) {
  const [booking, setBooking] = useState(false);
  const [bookingErr, setBookingErr] = useState(null);

  const handleConfirm = async () => {
    setBooking(true);
    setBookingErr(null);
    try {
      const slot_ids = selectedSlots.map((s) => s._id);
      const rawDate = new Date(selectedSlots[0].date);
      const date = `${rawDate.getUTCFullYear()}-${String(rawDate.getUTCMonth() + 1).padStart(2, "0")}-${String(rawDate.getUTCDate()).padStart(2, "0")}`;

      const bookingRes = await api.post("/api/bookings", { turf_id: turf._id, date, slot_ids });
      const { booking_id } = bookingRes.data;
      const orderRes = await api.post("/api/payment/create-order", { booking_id });
      const orderData = orderRes.data;

      const options = {
        key: orderData.razorpay_key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: turf.name,
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            setBooking(true);
            const verifyRes = await api.post("/api/payment/verify", {
              booking_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            onBookingSuccess(verifyRes.data);
          } catch (err) {
            setBookingErr("Payment verification failed.");
          } finally { setBooking(false); }
        },
        theme: { color: "#10b981" },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      setBookingErr(err.response?.data?.message || "Booking failed.");
    } finally { setBooking(false); }
  };

  if (!isOpen) return null;
  const totalAmount = selectedSlots.reduce((acc, s) => acc + s.price, 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-zinc-200 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl relative">
        <div className="px-7 pt-8 pb-5 border-b border-zinc-100 bg-zinc-50/50">
          <h2 className="text-xl font-black text-zinc-900">Summary</h2>
          <p className="text-zinc-500 text-xs mt-1 flex items-center gap-1.5 font-medium">
            <ShieldCheck size={14} className="text-emerald-500" /> Review and pay
          </p>
        </div>

        <div className="px-7 py-6 space-y-5 max-h-[60vh] overflow-y-auto">
          <div className="flex justify-between items-center pb-4 border-b border-zinc-100">
            <span className="text-[13px] text-zinc-400 font-bold uppercase tracking-tight">Venue</span>
            <span className="text-[14px] font-black text-zinc-900">{turf.name}</span>
          </div>

          <div className="space-y-3">
             <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Slots</span>
             <div className="flex flex-wrap gap-2">
               {selectedSlots.map(s => (
                 <div key={s._id} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-2 rounded-xl text-xs font-bold">
                   {fmt(s.start_time)}
                 </div>
               ))}
             </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 flex justify-between items-end">
            <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Payable</span>
            <span className="text-4xl font-black text-zinc-900 tracking-tight">{sym}{totalAmount}</span>
          </div>

          {bookingErr && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 items-center">
              <AlertCircle size={16} className="text-red-500" />
              <p className="text-red-600 text-xs font-bold">{bookingErr}</p>
            </div>
          )}
        </div>

        <div className="px-7 py-6 bg-zinc-50 border-t border-zinc-100 flex gap-3">
          <button onClick={onClose} disabled={booking} className="flex-1 py-4 bg-white border border-zinc-200 text-zinc-500 text-sm font-bold rounded-2xl hover:bg-zinc-100">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={booking} className="flex-[2] py-4 bg-emerald-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2">
            {booking ? <Loader2 size={18} className="animate-spin" /> : "Pay Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
    BOOKING CARD (Light)
───────────────────────────────────────────────────────────────────────────── */
function BookingCard({ turf, onConfirmBooking }) {
  const sym = turf.currency === "INR" ? "₹" : (turf.currency || "₹");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        const d = selectedDate;
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const res = await api.get(`/api/slots?turf_id=${turf._id}&date=${dateStr}`);
        setSlots(res.data.slots || []);
      } catch (err) { console.error(err); } 
      finally { setLoadingSlots(false); }
    };
    fetchSlots();
  }, [selectedDate, turf._id]);

  return (
    <div className="bg-white border border-zinc-200 rounded-[2rem] overflow-hidden shadow-xl flex flex-col">
      {/* Price Header */}
      <div className="px-8 pt-8 pb-6 bg-zinc-50/50 border-b border-zinc-100">
        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Select Timings</span>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-4xl font-black text-zinc-900">{sym}{turf.price_per_hour}</span>
          <span className="text-zinc-400 text-sm font-bold">/ hour</span>
        </div>
      </div>

      {/* Date Picker */}
      <div className="px-8 pt-8 pb-4">
        <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-4">Date Selection</h4>
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {dates.map((d, i) => {
            const isSelected = d.toDateString() === selectedDate.toDateString();
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(d)}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-2xl border transition-all duration-200 ${
                  isSelected ? "bg-zinc-900 border-zinc-900 text-white shadow-lg" : "bg-white border-zinc-100 text-zinc-500 hover:border-zinc-300"
                }`}
              >
                <span className={`text-[10px] font-bold uppercase mb-1 ${isSelected ? "text-zinc-400" : "text-zinc-300"}`}>
                  {d.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className="text-xl font-black">{d.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots */}
      <div className="px-8 pt-4 pb-8 flex-1">
        <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-4">Available Timings</h4>
        <div className="grid grid-cols-3 gap-3">
          {loadingSlots ? (
            <div className="col-span-3 text-center py-10"><Loader2 className="animate-spin mx-auto text-emerald-500" /></div>
          ) : (
            slots.map((slot) => {
              const isBooked = ["booked", "on_hold", "blocked"].includes(slot.status);
              const isSelected = selectedSlots.some((s) => s._id === slot._id);
              return (
                <button
                  key={slot._id}
                  disabled={isBooked}
                  onClick={() => {
                    if (isSelected) setSelectedSlots(prev => prev.filter(s => s._id !== slot._id));
                    else setSelectedSlots(prev => [...prev, slot]);
                  }}
                  className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                    isBooked ? "bg-zinc-50 border-zinc-50 text-zinc-300 cursor-not-allowed" :
                    isSelected ? "bg-emerald-600 border-emerald-600 text-white shadow-md" :
                    "bg-white border-zinc-200 text-zinc-900 hover:border-emerald-500"
                  }`}
                >
                  {fmt(slot.start_time)}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-8 border-t border-zinc-100 bg-zinc-50/50">
        <div className="flex justify-between items-end mb-6">
          <div>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Subtotal</span>
            <p className="text-3xl font-black text-zinc-900">
              {sym}{selectedSlots.reduce((acc, s) => acc + s.price, 0)}
            </p>
          </div>
          <span className="text-xs font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg">
            {selectedSlots.length} Selected
          </span>
        </div>
        <button
          disabled={selectedSlots.length === 0}
          onClick={() => onConfirmBooking(selectedSlots)}
          className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-100 disabled:bg-zinc-200 disabled:shadow-none hover:bg-emerald-700 transition-all active:scale-[0.98]"
        >
          Confirm & Pay
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
    MAIN PAGE (Light)
───────────────────────────────────────────────────────────────────────────── */
export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [turf, setTurf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  useEffect(() => {
    const fetchTurf = async () => {
      try {
        const base = import.meta.env.VITE_API_URL || "http://localhost:5001";
        const res = await axios.get(`${base}/api/turfs/${id}`);
        setTurf(res.data.turf);
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchTurf();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;

  if (confirmedBooking) return <BookingSuccessScreen booking={confirmedBooking} turf={turf} sym={turf.currency === "INR" ? "₹" : "₹"} onGoHome={() => navigate("/")} onGoProfile={() => navigate("/profile")} />;

  return (
    <div className="bg-zinc-50 min-h-screen pb-20 pt-10">
      <div className="max-w-xl mx-auto px-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 font-bold text-sm hover:text-zinc-900 transition-colors mb-8">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-3xl font-black text-zinc-900 mb-2 leading-tight">Reserve your slot</h1>
        <p className="text-zinc-500 font-medium mb-10">{turf.name}</p>

        <BookingCard turf={turf} onConfirmBooking={(slots) => { setSelectedSlots(slots); setIsSummaryOpen(true); }} />
      </div>

      <BookingSummaryModal isOpen={isSummaryOpen} onClose={() => setIsSummaryOpen(false)} selectedSlots={selectedSlots} turf={turf} sym={turf.currency === "INR" ? "₹" : "₹"} onBookingSuccess={(data) => { setIsSummaryOpen(false); setConfirmedBooking(data); }} />
    </div>
  );
}