import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../utils/auth";
import {
  Clock, CalendarDays, ShieldCheck, ChevronRight, XCircle, ArrowLeft,
  CheckCircle2, AlertCircle, Loader2, Ticket, Wallet, CreditCard,
} from "lucide-react";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function fmt(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ap}`;
}

/* ─── QR Code via free API ────────────────────────────────────────────────── */
function QRCode({ url, size = 200 }) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&bgcolor=1a1a2e&color=ffffff&format=png`;
  return (
    <img
      src={qrSrc}
      alt="Pay Remaining Amount"
      className="rounded-2xl border-4 border-white/20"
      style={{ width: size, height: size }}
    />
  );
}

/* ── Stadium BG shared styles ──────────────────────────────────────────── */
const STADIUM_BG = {
  backgroundImage: `url('https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=900&q=80')`,
  backgroundSize: "cover",
  backgroundPosition: "center top",
  backgroundRepeat: "no-repeat",
  position: "relative",
};
const OVERLAY_STYLE = {
  position: "absolute", inset: 0,
  background: "linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,20,5,0.82) 100%)",
  zIndex: 0,
};
function StadiumNavbar({ userName }) {
  return (
    <div style={{
      position: "relative", zIndex: 10,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 20px",
      background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#00b341,#00832e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#fff" }}>∞</div>
        <div>
          <div style={{ color: "#fff", fontSize: 10, fontWeight: 900, lineHeight: 1 }}>Infinity</div>
          <div style={{ color: "#aaa", fontSize: 9, fontWeight: 600 }}>Sports Turf</div>
        </div>
      </div>
      {userName && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#222", border: "2px solid #555", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>👤</div>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>{userName}</span>
        </div>
      )}
      <span style={{ color: "#fff", fontSize: 22, cursor: "pointer" }}>☰</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
    RED CARD SUCCESS SCREEN (after ₹200 advance)
───────────────────────────────────────────────────────────────────────────── */
function RedCardScreen({ booking, advanceResult, turf, onGoTicket, onGoHome }) {
  const { balance_due, balance_link_url } = advanceResult;
  return (
    <div style={{ ...STADIUM_BG, minHeight: "100vh", fontFamily: "'Segoe UI', Arial, sans-serif", overflowY: "auto" }}>
      <div style={OVERLAY_STYLE} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto" }}>
        <div style={{ padding: "24px 20px 40px" }}>

          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>✅</div>
            <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 900, margin: "0 0 6px", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>Booking Confirmed!</h2>
            <p style={{ color: "#ccc", fontSize: 14, margin: 0 }}>Your slot at {turf.name} is secured.</p>
          </div>

          {/* Red Card */}
          <div style={{ borderRadius: 12, border: "2px solid #cc2200", boxShadow: "0 0 24px rgba(220,38,38,0.5)", overflow: "hidden", marginBottom: 18 }}>
            <div style={{ background: "linear-gradient(135deg,#cc2200,#aa1800)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 900 }}>🔴 RED CARD: ACTION REQUIRED</span>
              <span style={{ fontSize: 18 }}>⚠️</span>
            </div>
            <div style={{ background: "rgba(10,0,0,0.85)", padding: 16 }}>
              <p style={{ color: "#fff", fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Balance Due: ₹{balance_due} <span style={{ color: "#aaa", fontWeight: 500, fontSize: 12 }}>(Payable via QR)</span></p>
              <p style={{ color: "#ccc", fontSize: 13, margin: "0 0 14px" }}>Status: Pending Entry Clearance</p>
              <div style={{ background: "rgba(180,20,0,0.15)", border: "1px solid rgba(220,38,38,0.35)", borderRadius: 8, padding: "12px 14px" }}>
                <p style={{ color: "#ffcdd2", fontSize: 12, fontWeight: 800, margin: "0 0 8px" }}>Booking Summary:</p>
                <div style={{ color: "#f0f0f0", fontSize: 13, lineHeight: 2 }}>
                  <div>• <strong>Total Rate:</strong> ₹{turf.price_per_hour}/hr</div>
                  <div>• <strong>Advance Paid:</strong> ₹200</div>
                  <div>• <strong>Balance Due:</strong> ₹{balance_due}</div>
                </div>
              </div>
            </div>
          </div>

          {/* QR */}
          {balance_link_url && (
            <div style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 16, marginBottom: 18, textAlign: "center" }}>
              <p style={{ color: "#ddd", fontSize: 12, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Scan to Pay Remaining ₹{balance_due}</p>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(balance_link_url)}&bgcolor=111111&color=ffffff&format=png`}
                alt="Pay QR"
                style={{ borderRadius: 10, border: "3px solid rgba(255,255,255,0.15)", width: 180, height: 180 }}
              />
              <br />
              <a href={balance_link_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 12, padding: "8px 20px", background: "#2563eb", color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                Pay ₹{balance_due} Online ↗
              </a>
            </div>
          )}

          {/* Notice */}
          <p style={{ color: "#e2e8f0", fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>
            <strong>Notice:</strong> Please ensure the balance is paid before entering the turf. Pay the remaining amount to unlock your Blue Card.
          </p>

          {/* Instructions */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: "#fff", fontSize: 15, fontWeight: 800, marginBottom: 12 }}>📋 Arrival &amp; Gear Instructions:</p>
            <div style={{ color: "#ccc", fontSize: 13, lineHeight: 2 }}>
              <p style={{ margin: 0 }}>• <strong style={{ color: "#fff" }}>Arrival Time:</strong> Please arrive 10 minutes prior to your slot to settle the balance and maximize your playtime.</p>
              <p style={{ margin: 0 }}>• <strong style={{ color: "#fff" }}>Bring Your Gear:</strong> Please bring your own Bats and Balls. We provide the Stumps.</p>
              <p style={{ margin: 0 }}>• <strong style={{ color: "#fff" }}>Footwear Policy:</strong> Only flat-sole sports shoes are allowed. Please ensure you and your team bring the correct footwear (No metal studs or spikes).</p>
            </div>
          </div>

          {/* Location */}
          <div style={{ textAlign: "center", padding: 14, background: "rgba(0,0,0,0.4)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", marginBottom: 20 }}>
            <p style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0 }}>📍 Bolinj, Virar West</p>
          </div>

          {/* Actions */}
          <button onClick={onGoTicket} style={{ width: "100%", padding: "14px", background: "rgba(255,255,255,0.95)", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: "pointer", marginBottom: 10, color: "#111" }}>
            🎫 View My Ticket
          </button>
          <button onClick={onGoHome} style={{ width: "100%", padding: "12px", background: "transparent", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#aaa" }}>
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
    BLUE CARD SUCCESS SCREEN (after full payment)
───────────────────────────────────────────────────────────────────────────── */
function BlueCardScreen({ booking, turf, sym, onGoTicket, onGoHome }) {
  return (
    <div style={{ ...STADIUM_BG, minHeight: "100vh", fontFamily: "'Segoe UI', Arial, sans-serif", overflowY: "auto" }}>
      <div style={OVERLAY_STYLE} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto" }}>
        <div style={{ padding: "24px 20px 40px" }}>

          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>🏆</div>
            <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 900, margin: "0 0 6px", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>You're Pitch Ready!</h2>
            <p style={{ color: "#ccc", fontSize: 14, margin: 0 }}>Your payment is complete. Step into the arena.</p>
          </div>

          {/* Blue Card */}
          <div style={{ borderRadius: 12, border: "2px solid #2563eb", boxShadow: "0 0 28px rgba(37,99,235,0.6)", overflow: "hidden", marginBottom: 20 }}>
            <div style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 900 }}>🔵 BLUE CARD: FULL ACCESS</span>
              <span style={{ fontSize: 18 }}>🏆</span>
            </div>
            <div style={{ background: "rgba(0,5,30,0.88)", padding: 16 }}>
              <p style={{ color: "#93c5fd", fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Status: Fully Cleared / Game On!</p>
              <p style={{ color: "#4ade80", fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>Total Paid: {sym}{booking.total_amount} ✅</p>
              <div style={{ background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.4)", borderRadius: 8, padding: "12px 14px" }}>
                <p style={{ color: "#bfdbfe", fontSize: 12, fontWeight: 800, margin: "0 0 8px" }}>Match Details:</p>
                <div style={{ color: "#f0f0f0", fontSize: 13, lineHeight: 2 }}>
                  <div>• <strong>Venue:</strong> {turf.name}</div>
                  <div>• <strong>Date:</strong> {booking.date ? new Date(booking.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Final Instructions */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ color: "#fff", fontSize: 15, fontWeight: 800, marginBottom: 12 }}>🗒️ Final Instructions:</p>
            <div style={{ color: "#ccc", fontSize: 13, lineHeight: 2 }}>
              <p style={{ margin: 0 }}>• <strong style={{ color: "#fff" }}>Show &amp; Go:</strong> Present this Blue Card at the gate for instant entry.</p>
              <p style={{ margin: 0 }}>• <strong style={{ color: "#fff" }}>Fair Play:</strong> Respect the clock. Please exit the turf promptly when your session ends so the next team can start on time.</p>
              <p style={{ margin: 0 }}>• <strong style={{ color: "#fff" }}>Safety First:</strong> The facility is under CCTV surveillance. Please follow the coordinator's instructions.</p>
            </div>
          </div>

          {/* Tagline */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <p style={{ color: "#fff", fontSize: 22, fontWeight: 900, margin: "0 0 6px" }}>Play Without Limits!</p>
            <p style={{ color: "#aaa", fontSize: 14, fontWeight: 600, margin: 0 }}>📞 9325656695 / 9321400014</p>
          </div>

          {/* Actions */}
          <button onClick={onGoTicket} style={{ width: "100%", padding: 14, background: "linear-gradient(135deg,#1d4ed8,#2563eb)", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: "pointer", marginBottom: 10, color: "#fff", boxShadow: "0 4px 20px rgba(37,99,235,0.4)" }}>
            🎫 View My Ticket
          </button>
          <button onClick={onGoHome} style={{ width: "100%", padding: 12, background: "transparent", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#aaa" }}>
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
    BOOKING SUMMARY MODAL
───────────────────────────────────────────────────────────────────────────── */
function BookingSummaryModal({ isOpen, onClose, selectedSlots, turf, sym, paymentType, onAdvanceSuccess, onFullSuccess }) {
  const [booking, setBooking] = useState(false);
  const [bookingErr, setBookingErr] = useState(null);

  const handleConfirm = async () => {
    setBooking(true);
    setBookingErr(null);
    try {
      const slot_ids = selectedSlots.map((s) => s._id);
      const rawDate  = new Date(selectedSlots[0].date);
      const date = `${rawDate.getUTCFullYear()}-${String(rawDate.getUTCMonth() + 1).padStart(2, "0")}-${String(rawDate.getUTCDate()).padStart(2, "0")}`;

      const bookingRes = await api.post("/api/bookings", { turf_id: turf._id, date, slot_ids });
      const { booking_id } = bookingRes.data;

      if (paymentType === "advance") {
        // Create ₹200 advance order
        const orderRes = await api.post("/api/payment/create-advance-order", { booking_id });
        const orderData = orderRes.data;

        const options = {
          key:      orderData.razorpay_key_id,
          amount:   orderData.amount,
          currency: orderData.currency,
          name:     turf.name,
          description: "₹200 Advance Payment",
          order_id: orderData.order_id,
          handler: async function (response) {
            try {
              setBooking(true);
              const verifyRes = await api.post("/api/payment/verify-advance", {
                booking_id,
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
              });
              onAdvanceSuccess(verifyRes.data, booking_id);
            } catch (err) {
              setBookingErr("Advance payment verification failed.");
            } finally { setBooking(false); }
          },
          theme: { color: "#ef4444" },
        };
        new window.Razorpay(options).open();

      } else {
        // Full payment
        const orderRes  = await api.post("/api/payment/create-order", { booking_id });
        const orderData = orderRes.data;

        const options = {
          key:      orderData.razorpay_key_id,
          amount:   orderData.amount,
          currency: orderData.currency,
          name:     turf.name,
          order_id: orderData.order_id,
          handler: async function (response) {
            try {
              setBooking(true);
              const verifyRes = await api.post("/api/payment/verify", {
                booking_id,
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
              });
              onFullSuccess(verifyRes.data);
            } catch (err) {
              setBookingErr("Payment verification failed.");
            } finally { setBooking(false); }
          },
          theme: { color: "#10b981" },
        };
        new window.Razorpay(options).open();
      }
    } catch (err) {
      setBookingErr(err.response?.data?.message || "Booking failed.");
    } finally { setBooking(false); }
  };

  if (!isOpen) return null;
  const totalAmount   = selectedSlots.reduce((acc, s) => acc + s.price, 0);
  const isAdvance     = paymentType === "advance";
  const payableNow    = isAdvance ? 200 : totalAmount;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-zinc-200 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl">
        <div className="px-7 pt-8 pb-5 border-b border-zinc-100 bg-zinc-50/50">
          <h2 className="text-xl font-black text-zinc-900">Confirm Payment</h2>
          <p className="text-zinc-500 text-xs mt-1 flex items-center gap-1.5 font-medium">
            <ShieldCheck size={14} className="text-emerald-500" />
            {isAdvance ? "Pay ₹200 now, rest at turf" : "Full payment via Razorpay"}
          </p>
        </div>

        <div className="px-7 py-6 space-y-4 max-h-[55vh] overflow-y-auto">
          <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
            <span className="text-[13px] text-zinc-400 font-bold uppercase tracking-tight">Venue</span>
            <span className="text-[14px] font-black text-zinc-900">{turf.name}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
            <span className="text-[13px] text-zinc-400 font-bold uppercase tracking-tight">Total Slots</span>
            <span className="text-[14px] font-black text-zinc-900">{sym}{totalAmount}</span>
          </div>
          {isAdvance && (
            <>
              <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                <span className="text-[13px] text-zinc-400 font-bold uppercase tracking-tight">Advance (Now)</span>
                <span className="text-emerald-600 font-black">₹200</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                <span className="text-[13px] text-zinc-400 font-bold uppercase tracking-tight">Balance (via QR)</span>
                <span className="text-orange-500 font-black">₹{totalAmount - 200}</span>
              </div>
            </>
          )}
          <div className="pt-2 flex justify-between items-end">
            <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Paying Now</span>
            <span className={`text-4xl font-black tracking-tight ${isAdvance ? "text-red-600" : "text-zinc-900"}`}>
              {sym}{payableNow}
            </span>
          </div>
          {bookingErr && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 items-center">
              <AlertCircle size={16} className="text-red-500" />
              <p className="text-red-600 text-xs font-bold">{bookingErr}</p>
            </div>
          )}
        </div>

        <div className="px-7 py-5 bg-zinc-50 border-t border-zinc-100 flex gap-3">
          <button onClick={onClose} disabled={booking}
            className="flex-1 py-4 bg-white border border-zinc-200 text-zinc-500 text-sm font-bold rounded-2xl hover:bg-zinc-100">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={booking}
            className={`flex-[2] py-4 text-white text-sm font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 ${isAdvance ? "bg-red-600 hover:bg-red-700 shadow-red-100" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"}`}>
            {booking ? <Loader2 size={18} className="animate-spin" /> : `Pay ₹${payableNow}`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
    BOOKING CARD
───────────────────────────────────────────────────────────────────────────── */
function BookingCard({ turf, onConfirmBooking }) {
  const sym = turf.currency === "INR" ? "₹" : (turf.currency || "₹");
  const [selectedDate,  setSelectedDate]  = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [slots,         setSlots]         = useState([]);
  const [loadingSlots,  setLoadingSlots]  = useState(false);
  const [paymentType,   setPaymentType]   = useState("full"); // "full" | "advance"

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

  const totalAmount = selectedSlots.reduce((acc, s) => acc + s.price, 0);

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
              <button key={i} onClick={() => setSelectedDate(d)}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-2xl border transition-all duration-200 ${isSelected ? "bg-zinc-900 border-zinc-900 text-white shadow-lg" : "bg-white border-zinc-100 text-zinc-500 hover:border-zinc-300"}`}>
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
      <div className="px-8 pt-4 pb-6 flex-1">
        <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-4">Available Timings</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {loadingSlots ? (
            <div className="col-span-full text-center py-10"><Loader2 className="animate-spin mx-auto text-emerald-500" /></div>
          ) : (
            slots.map((slot) => {
              const isBooked  = ["booked", "on_hold", "blocked"].includes(slot.status);
              const isSelected = selectedSlots.some((s) => s._id === slot._id);
              return (
                <button key={slot._id} disabled={isBooked}
                  onClick={() => {
                    if (isSelected) setSelectedSlots(prev => prev.filter(s => s._id !== slot._id));
                    else setSelectedSlots(prev => [...prev, slot]);
                  }}
                  className={`py-3 rounded-xl border text-sm font-bold transition-all ${isBooked ? "bg-zinc-50 border-zinc-50 text-zinc-300 cursor-not-allowed" : isSelected ? "bg-emerald-600 border-emerald-600 text-white shadow-md" : "bg-white border-zinc-200 text-zinc-900 hover:border-emerald-500"}`}>
                  {fmt(slot.start_time)}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Payment Type Chooser */}
      {selectedSlots.length > 0 && totalAmount > 200 && (
        <div className="px-8 pb-4">
          <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-3">Payment Option</h4>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentType("advance")}
              className={`flex flex-col items-center gap-1.5 py-4 px-3 rounded-2xl border-2 transition-all text-center ${paymentType === "advance" ? "border-red-500 bg-red-50" : "border-zinc-200 bg-white hover:border-zinc-300"}`}
            >
              <Wallet size={20} className={paymentType === "advance" ? "text-red-600" : "text-zinc-400"} />
              <span className={`text-sm font-black ${paymentType === "advance" ? "text-red-700" : "text-zinc-700"}`}>₹200 Advance</span>
              <span className={`text-[10px] font-medium ${paymentType === "advance" ? "text-red-500" : "text-zinc-400"}`}>Pay ₹{totalAmount - 200} via QR</span>
            </button>
            <button
              onClick={() => setPaymentType("full")}
              className={`flex flex-col items-center gap-1.5 py-4 px-3 rounded-2xl border-2 transition-all text-center ${paymentType === "full" ? "border-emerald-500 bg-emerald-50" : "border-zinc-200 bg-white hover:border-zinc-300"}`}
            >
              <CreditCard size={20} className={paymentType === "full" ? "text-emerald-600" : "text-zinc-400"} />
              <span className={`text-sm font-black ${paymentType === "full" ? "text-emerald-700" : "text-zinc-700"}`}>Pay Full</span>
              <span className={`text-[10px] font-medium ${paymentType === "full" ? "text-emerald-500" : "text-zinc-400"}`}>₹{totalAmount} now</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-8 border-t border-zinc-100 bg-zinc-50/50">
        <div className="flex justify-between items-end mb-6">
          <div>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Subtotal</span>
            <p className="text-3xl font-black text-zinc-900">{sym}{totalAmount}</p>
          </div>
          <span className="text-xs font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg">
            {selectedSlots.length} Selected
          </span>
        </div>
        <button
          disabled={selectedSlots.length === 0}
          onClick={() => onConfirmBooking(selectedSlots, paymentType)}
          className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-100 disabled:bg-zinc-200 disabled:shadow-none hover:bg-emerald-700 transition-all active:scale-[0.98]"
        >
          {selectedSlots.length === 0 ? "Select Slots" : paymentType === "advance" ? "Pay ₹200 Advance" : `Pay ₹${totalAmount} in Full`}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
    MAIN PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function BookingPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [turf, setTurf]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [paymentType, setPaymentType]     = useState("full");

  // Success states
  const [advanceResult, setAdvanceResult]   = useState(null); // after ₹200
  const [fullResult, setFullResult]         = useState(null);  // after full pay
  const [confirmedBookingId, setConfirmedBookingId] = useState(null);

  useEffect(() => {
    const fetchTurf = async () => {
      try {
        const base = import.meta.env.VITE_API_URL || "http://localhost:5001";
        const res  = await axios.get(`${base}/api/turfs/${id}`);
        setTurf(res.data.turf);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchTurf();
  }, [id]);

  const sym = turf?.currency === "INR" ? "₹" : "₹";

  if (loading) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;

  // Show advance (Red Card) success
  if (advanceResult) {
    return (
      <RedCardScreen
        advanceResult={advanceResult}
        turf={turf}
        booking={{ date: selectedSlots[0]?.date, total_amount: selectedSlots.reduce((a, s) => a + s.price, 0) }}
        onGoTicket={() => navigate(`/ticket/${confirmedBookingId}`)}
        onGoHome={() => navigate("/")}
      />
    );
  }

  // Show full payment (Blue Card) success
  if (fullResult) {
    return (
      <BlueCardScreen
        booking={{ total_amount: selectedSlots.reduce((a, s) => a + s.price, 0), date: selectedSlots[0]?.date }}
        turf={turf}
        sym={sym}
        onGoTicket={() => navigate(`/ticket/${fullResult.booking_id}`)}
        onGoHome={() => navigate("/")}
      />
    );
  }

  return (
    <div className="bg-zinc-50 min-h-screen pb-0 pt-10">
      <div className="max-w-5xl mx-auto px-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 font-bold text-sm hover:text-zinc-900 transition-colors mb-8">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-3xl font-black text-zinc-900 mb-2 leading-tight">Reserve your slot</h1>
        <p className="text-zinc-500 font-medium mb-10">{turf.name}</p>

        <BookingCard
          turf={turf}
          onConfirmBooking={(slots, type) => {
            setSelectedSlots(slots);
            setPaymentType(type);
            setIsSummaryOpen(true);
          }}
        />
      </div>

      <BookingSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        selectedSlots={selectedSlots}
        turf={turf}
        sym={sym}
        paymentType={paymentType}
        onAdvanceSuccess={(result, bookingId) => {
          setConfirmedBookingId(bookingId);
          setAdvanceResult(result);
          setIsSummaryOpen(false);
        }}
        onFullSuccess={(result) => {
          setFullResult(result);
          setIsSummaryOpen(false);
        }}
      />
    </div>
  );
}