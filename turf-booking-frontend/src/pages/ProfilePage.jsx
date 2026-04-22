import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, getAuthUser, clearAuthSession } from "../utils/auth";
import {
  User, Mail, Phone, MapPin, CalendarDays, Clock,
  IndianRupee, CheckCircle2, XCircle, AlertCircle,
  Loader2, ChevronRight, LogOut, Ban, RotateCcw,
} from "lucide-react";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function fmt(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ap}`;
}

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

const STATUS_CONFIG = {
  confirmed: { label: "Confirmed",  color: "bg-green-950/60 border-green-700/50 text-green-400",  icon: CheckCircle2 },
  pending:   { label: "Pending",    color: "bg-yellow-950/60 border-yellow-700/50 text-yellow-400", icon: Clock },
  cancelled: { label: "Cancelled",  color: "bg-red-950/60 border-red-700/50 text-red-400",         icon: XCircle },
  completed: { label: "Completed",  color: "bg-blue-950/60 border-blue-700/50 text-blue-400",      icon: CheckCircle2 },
  failed:    { label: "Failed",     color: "bg-zinc-900 border-zinc-700 text-zinc-500",              icon: AlertCircle },
};

const CANCEL_REASONS = ["Changed plans", "Emergency", "Weather", "Other"];

/* ─────────────────────────────────────────────────────────────────────────────
   CANCEL MODAL
───────────────────────────────────────────────────────────────────────────── */
function CancelModal({ booking, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState("Changed plans");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-[2px] p-4">
      <div className="bg-[#0a0a0a] border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="px-7 pt-7 pb-5 border-b border-zinc-800/80">
          <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-800/50 flex items-center justify-center mb-4">
            <Ban size={22} className="text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Cancel Booking?</h2>
          <p className="text-zinc-500 text-sm mt-1">
            This will free up your slot at{" "}
            <span className="text-zinc-300 font-medium">{booking.turf_name_snapshot}</span>.
          </p>
        </div>

        <div className="px-7 py-6">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Reason for cancellation</p>
          <div className="grid grid-cols-2 gap-2">
            {CANCEL_REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all text-left ${
                  reason === r
                    ? "bg-red-950/50 border-red-600/60 text-red-300"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="px-7 pb-7 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm font-bold rounded-2xl hover:bg-zinc-800 transition-colors"
          >
            Keep Booking
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
            {loading ? "Cancelling..." : "Yes, Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   BOOKING CARD
───────────────────────────────────────────────────────────────────────────── */
function BookingCard({ booking, onCancelClick, navigate }) {
  const cfg    = STATUS_CONFIG[booking.booking_status] || STATUS_CONFIG.pending;
  const Icon   = cfg.icon;
  const canCancel = ["confirmed", "pending"].includes(booking.booking_status);

  return (
    <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors">
      {/* Header row */}
      <div className="px-5 py-4 border-b border-zinc-800/60 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-white font-bold text-sm truncate">{booking.turf_name_snapshot}</p>
          <p className="text-zinc-500 text-xs mt-0.5 flex items-center gap-1">
            <MapPin size={11} />
            {booking.turf_address_snapshot || "Address not available"}
          </p>
        </div>
        <span className={`flex-shrink-0 flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border ${cfg.color}`}>
          <Icon size={11} />
          {cfg.label}
        </span>
      </div>

      {/* Details */}
      <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Date</p>
          <p className="text-zinc-200 text-sm font-semibold">{fmtDate(booking.date)}</p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Time</p>
          <p className="text-zinc-200 text-sm font-semibold">
            {fmt(booking.start_time)} – {fmt(booking.end_time)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Amount</p>
          <p className="text-green-400 text-sm font-bold flex items-center gap-0.5">
            <IndianRupee size={12} />
            {booking.total_amount}
          </p>
        </div>
      </div>

      {/* Booking ID + actions */}
      <div className="px-5 py-3 bg-zinc-950/50 border-t border-zinc-800/60 flex items-center justify-between gap-3">
        <p className="text-zinc-600 text-[10px] font-mono">
          #{booking._id?.toString().slice(-10).toUpperCase()}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/turf/${typeof booking.turf_id === "object" ? booking.turf_id._id : booking.turf_id}`)}
            className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 rounded-xl transition-colors flex items-center gap-1"
          >
            View Turf <ChevronRight size={12} />
          </button>
          {canCancel && (
            <button
              onClick={() => onCancelClick(booking)}
              className="px-3 py-1.5 text-xs font-bold text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-700/60 bg-red-950/20 rounded-xl transition-colors flex items-center gap-1"
            >
              <Ban size={11} /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Cancellation info if cancelled */}
      {booking.booking_status === "cancelled" && booking.cancellation?.reason && (
        <div className="px-5 py-3 bg-red-950/10 border-t border-red-900/30">
          <p className="text-red-400/70 text-xs">
            Cancelled on {fmtDate(booking.cancellation.cancelled_at)} · Reason: {booking.cancellation.reason}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PROFILE PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const navigate  = useNavigate();
  const authUser  = getAuthUser();

  const [bookings, setBookings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [filter, setFilter]           = useState("all");

  const [cancelTarget, setCancelTarget]   = useState(null);
  const [cancelling, setCancelling]       = useState(false);
  const [cancelError, setCancelError]     = useState(null);
  const [cancelSuccess, setCancelSuccess] = useState(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authUser) navigate("/login");
  }, [authUser, navigate]);

  // Fetch bookings on mount
  useEffect(() => {
    if (authUser) fetchBookings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleLogout = () => {
    clearAuthSession();
    navigate("/");
  };

  // ── Shared fetch helper so we can call it from multiple places ───────────────
  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/bookings");
      setBookings(res.data.bookings || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirm = async (reason) => {
    setCancelling(true);
    setCancelError(null);
    try {
      await api.put(`/api/bookings/${cancelTarget._id}/cancel`, { reason });

      setCancelTarget(null);
      setCancelSuccess("Booking cancelled! Slot is now available again.");

      // ── Re-fetch from DB so UI matches MongoDB exactly ──────────────────────
      await fetchBookings();

    } catch (err) {
      setCancelError(err.response?.data?.message || "Cancellation failed. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  if (!authUser) return null;

  // Filter bookings
  const FILTERS = ["all", "confirmed", "pending", "cancelled", "completed"];
  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.booking_status === filter);

  // Stats
  const stats = {
    total:     bookings.length,
    confirmed: bookings.filter((b) => b.booking_status === "confirmed").length,
    cancelled: bookings.filter((b) => b.booking_status === "cancelled").length,
    spent:     bookings
      .filter((b) => b.booking_status !== "cancelled")
      .reduce((s, b) => s + (b.total_amount || 0), 0),
  };

  return (
    <div className="bg-black min-h-screen pb-20 pt-8">
      <div className="max-w-4xl mx-auto px-5 sm:px-8">

        {/* ── Profile Hero ── */}
        <div className="bg-[#0a0a0a] border border-zinc-800 rounded-3xl p-7 mb-6 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-green-500/5 blur-[80px] pointer-events-none" />

          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-green-950/60 border-2 border-green-800/60 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-black text-green-400">
                  {authUser.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight">{authUser.name}</h1>
                <p className="text-zinc-500 text-sm mt-0.5 flex items-center gap-1.5">
                  <Mail size={12} /> {authUser.email}
                </p>
                {authUser.phone && (
                  <p className="text-zinc-600 text-xs mt-0.5 flex items-center gap-1.5">
                    <Phone size={11} /> {authUser.phone}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-700 bg-red-950/20 rounded-xl transition-colors flex-shrink-0"
            >
              <LogOut size={13} /> Logout
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 relative z-10">
            {[
              { label: "Total Bookings", value: stats.total, color: "text-white" },
              { label: "Confirmed",      value: stats.confirmed, color: "text-green-400" },
              { label: "Cancelled",      value: stats.cancelled, color: "text-red-400" },
              { label: "Total Spent",    value: `₹${stats.spent}`, color: "text-yellow-400" },
            ].map((s) => (
              <div key={s.label} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 text-center">
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bookings Section ── */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white">My Bookings</h2>
            <button
              onClick={fetchBookings}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <RotateCcw size={13} /> Refresh
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl border text-xs font-bold capitalize transition-all ${
                  filter === f
                    ? "bg-green-600 border-green-500 text-white shadow-[0_0_16px_rgba(34,197,94,0.3)]"
                    : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                }`}
              >
                {f === "all" ? `All (${bookings.length})` : f}
              </button>
            ))}
          </div>

          {/* Success / error banners */}
          {cancelSuccess && (
            <div className="flex items-center gap-3 bg-green-950/40 border border-green-700/50 rounded-2xl p-4 mb-4">
              <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
              <p className="text-green-300 text-sm font-medium">{cancelSuccess}</p>
              <button onClick={() => setCancelSuccess(null)} className="ml-auto text-green-600 hover:text-green-400">
                <XCircle size={15} />
              </button>
            </div>
          )}
          {cancelError && (
            <div className="flex items-center gap-3 bg-red-950/40 border border-red-700/50 rounded-2xl p-4 mb-4">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm font-medium">{cancelError}</p>
              <button onClick={() => setCancelError(null)} className="ml-auto text-red-600 hover:text-red-400">
                <XCircle size={15} />
              </button>
            </div>
          )}

          {/* Bookings list */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 size={32} className="text-green-500 animate-spin" />
              <p className="text-zinc-500 text-sm">Loading your bookings...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <AlertCircle size={32} className="text-red-500" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="text-5xl">🏟️</div>
              <div>
                <p className="text-white font-bold text-lg mb-1">
                  {filter === "all" ? "No bookings yet" : `No ${filter} bookings`}
                </p>
                <p className="text-zinc-500 text-sm">
                  {filter === "all" ? "Go book a turf and start playing!" : "Try a different filter."}
                </p>
              </div>
              {filter === "all" && (
                <button
                  onClick={() => navigate("/")}
                  className="mt-2 px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-full transition-all"
                >
                  Browse Turfs
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((booking) => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  onCancelClick={setCancelTarget}
                  navigate={navigate}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cancel modal */}
      {cancelTarget && (
        <CancelModal
          booking={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleCancelConfirm}
          loading={cancelling}
        />
      )}
    </div>
  );
}
