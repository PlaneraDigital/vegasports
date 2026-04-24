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
  confirmed: { label: "Confirmed", color: "bg-green-50 border-green-200 text-green-700", icon: CheckCircle2 },
  pending:   { label: "Pending",   color: "bg-yellow-50 border-yellow-200 text-yellow-700", icon: Clock },
  cancelled: { label: "Cancelled", color: "bg-red-50 border-red-200 text-red-700",         icon: XCircle },
  completed: { label: "Completed", color: "bg-blue-50 border-blue-200 text-blue-700",       icon: CheckCircle2 },
  failed:    { label: "Failed",    color: "bg-gray-100 border-gray-200 text-gray-500",      icon: AlertCircle },
};

const CANCEL_REASONS = ["Changed plans", "Emergency", "Weather", "Other"];

/* ─────────────────────────────────────────────────────────────────────────────
   CANCEL MODAL (Light)
───────────────────────────────────────────────────────────────────────────── */
function CancelModal({ booking, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState("Changed plans");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="px-7 pt-7 pb-5 border-b border-gray-100">
          <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
            <Ban size={22} className="text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Cancel Booking?</h2>
          <p className="text-gray-500 text-sm mt-1">
            This will free up your slot at{" "}
            <span className="text-gray-900 font-semibold">{booking.turf_name_snapshot}</span>.
          </p>
        </div>

        <div className="px-7 py-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Reason for cancellation</p>
          <div className="grid grid-cols-2 gap-2">
            {CANCEL_REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all text-left ${
                  reason === r
                    ? "bg-red-50 border-red-200 text-red-600"
                    : "bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-300"
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
            className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 text-sm font-bold rounded-2xl hover:bg-gray-50 transition-colors"
          >
            Keep
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-red-100"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   BOOKING CARD (Light)
───────────────────────────────────────────────────────────────────────────── */
function BookingCard({ booking, onCancelClick, navigate }) {
  const cfg    = STATUS_CONFIG[booking.booking_status] || STATUS_CONFIG.pending;
  const Icon   = cfg.icon;
  const canCancel = ["confirmed", "pending"].includes(booking.booking_status);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
      {/* Header row */}
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-gray-900 font-bold text-sm truncate">{booking.turf_name_snapshot}</p>
          <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
            <MapPin size={11} className="text-gray-400" />
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
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Date</p>
          <p className="text-gray-800 text-sm font-semibold">{fmtDate(booking.date)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Time</p>
          <p className="text-gray-800 text-sm font-semibold">
            {fmt(booking.start_time)} – {fmt(booking.end_time)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Amount</p>
          <p className="text-green-600 text-sm font-bold flex items-center gap-0.5">
            <IndianRupee size={12} />
            {booking.total_amount}
          </p>
        </div>
      </div>

      {/* Booking ID + actions */}
      <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-3">
        <p className="text-gray-400 text-[10px] font-mono">
          #{booking._id?.toString().slice(-10).toUpperCase()}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/turf/${typeof booking.turf_id === "object" ? booking.turf_id._id : booking.turf_id}`)}
            className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-400 rounded-xl transition-colors flex items-center gap-1 bg-white"
          >
            View Turf <ChevronRight size={12} />
          </button>
          {canCancel && (
            <button
              onClick={() => onCancelClick(booking)}
              className="px-3 py-1.5 text-xs font-bold text-red-500 hover:text-red-600 border border-red-100 hover:border-red-200 bg-red-50 rounded-xl transition-colors flex items-center gap-1"
            >
              <Ban size={11} /> Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PROFILE PAGE (Light)
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

  useEffect(() => {
    if (!authUser) navigate("/login");
  }, [authUser, navigate]);

  useEffect(() => {
    if (authUser) fetchBookings();
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    navigate("/");
  };

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
      setCancelSuccess("Booking cancelled successfully.");
      await fetchBookings();
    } catch (err) {
      setCancelError(err.response?.data?.message || "Cancellation failed.");
    } finally {
      setCancelling(false);
    }
  };

  if (!authUser) return null;

  const FILTERS = ["all", "confirmed", "pending", "cancelled", "completed"];
  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.booking_status === filter);

  const stats = {
    total:     bookings.length,
    confirmed: bookings.filter((b) => b.booking_status === "confirmed").length,
    spent:     bookings.filter((b) => b.booking_status !== "cancelled").reduce((s, b) => s + (b.total_amount || 0), 0),
  };

  return (
    <div className="bg-[#f9fafb] min-h-screen pb-20 pt-8">
      <div className="max-w-4xl mx-auto px-5 sm:px-8">

        {/* ── Profile Hero ── */}
        <div className="bg-white border border-gray-100 rounded-3xl p-7 mb-6 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-green-500/5 blur-[80px] pointer-events-none" />

          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-green-50 border-2 border-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-black text-green-600">
                  {authUser.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">{authUser.name}</h1>
                <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1.5">
                  <Mail size={12} className="text-gray-400" /> {authUser.email}
                </p>
                {authUser.phone && (
                  <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1.5">
                    <Phone size={11} /> {authUser.phone}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-500 hover:text-red-600 border border-red-100 hover:border-red-200 bg-red-50 rounded-xl transition-colors"
            >
              <LogOut size={13} /> Logout
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 relative z-10">
            {[
              { label: "Bookings", value: stats.total, color: "text-gray-900" },
              { label: "Confirmed", value: stats.confirmed, color: "text-green-600" },
              { label: "Cancelled", value: bookings.filter(b => b.booking_status === 'cancelled').length, color: "text-red-500" },
              { label: "Spent", value: `₹${stats.spent}`, color: "text-blue-600" },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 text-center">
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bookings Section ── */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">My Bookings</h2>
            <button
              onClick={fetchBookings}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <RotateCcw size={13} /> Refresh
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl border text-xs font-bold capitalize transition-all ${
                  filter === f
                    ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-100"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700"
                }`}
              >
                {f === "all" ? `All (${bookings.length})` : f}
              </button>
            ))}
          </div>

          {/* Success / error banners (Light) */}
          {cancelSuccess && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-2xl p-4 mb-4">
              <CheckCircle2 size={16} className="text-green-600" />
              <p className="text-green-700 text-sm font-medium">{cancelSuccess}</p>
              <button onClick={() => setCancelSuccess(null)} className="ml-auto text-green-300 hover:text-green-500">
                <XCircle size={15} />
              </button>
            </div>
          )}

          {/* Bookings list */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 size={32} className="text-green-500 animate-spin" />
              <p className="text-gray-400 text-sm">Loading your bookings...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="text-5xl">🏟️</div>
              <div>
                <p className="text-gray-900 font-bold text-lg mb-1">No bookings found</p>
                <p className="text-gray-500 text-sm">Try a different filter or book a new turf.</p>
              </div>
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