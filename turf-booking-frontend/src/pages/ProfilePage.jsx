import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, getAuthUser, clearAuthSession } from "../utils/auth";
import {
  User, Mail, Phone, MapPin, CalendarDays, Clock,
  IndianRupee, CheckCircle2, XCircle, AlertCircle,
  Loader2, ChevronRight, LogOut, Ban, RotateCcw,
  Wallet, Calendar, UserCircle, Activity, Map,
  Pencil, Save, Ticket
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
          {booking.booking_status !== 'cancelled' && (
            <button
              onClick={() => navigate(`/ticket/${booking._id}`)}
              className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 border border-blue-100 hover:border-blue-300 rounded-xl transition-colors flex items-center gap-1 bg-blue-50"
            >
              <Ticket size={12} /> View Ticket
            </button>
          )}
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

  const [profile, setProfile]         = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    dob: "",
    gender: "",
    location: { city: "", state: "", pincode: "" },
    preferred_sports: [],
  });
  const [editSaving, setEditSaving] = useState(false);

  const [cancelTarget, setCancelTarget]   = useState(null);
  const [cancelling, setCancelling]       = useState(false);
  const [cancelError, setCancelError]     = useState(null);
  const [cancelSuccess, setCancelSuccess] = useState(null);

  useEffect(() => {
    if (!authUser) navigate("/login");
  }, [authUser, navigate]);

  // Fetch bookings and profile on mount
  useEffect(() => {
    if (authUser) {
      fetchBookings();
      fetchProfile();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await api.get("/api/auth/profile");
      setProfile(res.data.user);
    } catch (err) {
      console.error("Failed to load profile details", err);
    } finally {
      setProfileLoading(false);
    }
  };


  const handleLogout = () => {
    clearAuthSession();
    navigate("/");
  };

  const handleEditClick = () => {
    setEditFormData({
      dob: profile?.dob ? new Date(profile.dob).toISOString().split('T')[0] : "",
      gender: profile?.gender || "",
      location: {
        city: profile?.location?.city || "",
        state: profile?.location?.state || "",
        pincode: profile?.location?.pincode || "",
      },
      preferred_sports: profile?.preferred_sports || [],
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    setEditSaving(true);
    try {
      await api.put("/api/auth/profile", editFormData);
      setIsEditingProfile(false);
      fetchProfile();
    } catch (err) {
      console.error("Failed to save profile details", err);
      alert(err.response?.data?.message || "Failed to save profile");
    } finally {
      setEditSaving(false);
    }
  };

  const toggleSport = (sport) => {
    setEditFormData((prev) => ({
      ...prev,
      preferred_sports: prev.preferred_sports.includes(sport)
        ? prev.preferred_sports.filter((s) => s !== sport)
        : [...prev.preferred_sports, sport],
    }));
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

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-green-50 border-2 border-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xl sm:text-2xl font-black text-green-600">
                  {authUser.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight truncate">{authUser.name}</h1>
                <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1.5 truncate">
                  <Mail size={12} className="text-gray-400 flex-shrink-0" /> {authUser.email}
                </p>
                {authUser.phone && (
                  <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1.5">
                    <Phone size={11} className="flex-shrink-0" /> {authUser.phone}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-500 hover:text-red-600 border border-red-100 hover:border-red-200 bg-red-50 rounded-xl transition-colors w-full sm:w-auto justify-center sm:justify-start mt-2 sm:mt-0"
            >
              <LogOut size={13} /> Logout
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 relative z-10">
            {[
              { label: "Bookings", value: stats.total, color: "text-gray-900" },
              { label: "Confirmed", value: stats.confirmed, color: "text-green-600" },
              { label: "Cancelled", value: bookings.filter(b => b.booking_status === 'cancelled').length, color: "text-red-500" },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 text-center">
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Profile Details Section (Light Theme) ── */}
<div className="bg-white border border-gray-100 rounded-3xl p-7 mb-6 shadow-sm">
  <div className="flex items-center justify-between mb-5">
    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
      <User size={18} className="text-green-600" /> Account Details
    </h2>
    {!profileLoading && profile && !isEditingProfile && (
      <button 
        onClick={handleEditClick}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 bg-gray-50 rounded-xl transition-colors"
      >
        <Pencil size={12} /> Edit
      </button>
    )}
  </div>
  
  {profileLoading ? (
    <div className="flex items-center justify-center py-6">
      <Loader2 size={24} className="text-green-600 animate-spin" />
    </div>
  ) : profile ? (
    isEditingProfile ? (
      <div className="space-y-5 bg-gray-50/50 border border-gray-200 rounded-2xl p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* DOB */}
          <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5 block">Date of Birth</label>
            <input 
              type="date" 
              value={editFormData.dob}
              onChange={(e) => setEditFormData({...editFormData, dob: e.target.value})}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all"
            />
          </div>
          {/* Gender */}
          <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5 block">Gender</label>
            <select 
              value={editFormData.gender}
              onChange={(e) => setEditFormData({...editFormData, gender: e.target.value})}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all appearance-none"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          {/* Location - City */}
          <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5 block">City</label>
            <input 
              type="text" 
              placeholder="e.g. Mumbai"
              value={editFormData.location.city}
              onChange={(e) => setEditFormData({...editFormData, location: {...editFormData.location, city: e.target.value}})}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all"
            />
          </div>
          {/* More Location fields similarly... */}
        </div>
        
        {/* Preferred Sports */}
        <div>
          <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 block">Preferred Sports</label>
          <div className="flex flex-wrap gap-2">
            {["football", "cricket", "badminton", "tennis", "basketball"].map((sport) => {
              const isSelected = editFormData.preferred_sports.includes(sport);
              return (
                <button
                  key={sport}
                  onClick={() => toggleSport(sport)}
                  className={`px-3 py-1.5 text-xs font-bold capitalize rounded-xl border transition-all ${
                    isSelected 
                      ? "bg-green-600 border-green-600 text-white shadow-md shadow-green-100" 
                      : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"
                  }`}
                >
                  {sport}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-3 mt-5 border-t border-gray-200">
          <button 
            onClick={() => setIsEditingProfile(false)}
            disabled={editSaving}
            className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSaveProfile}
            disabled={editSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
          >
            {editSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {editSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
              <Calendar size={18} className="text-gray-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date of Birth</p>
              <p className="text-gray-700 text-sm font-semibold mt-0.5">
                {profile.dob ? fmtDate(profile.dob) : "Not provided"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
              <UserCircle size={18} className="text-gray-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gender</p>
              <p className="text-gray-700 text-sm font-semibold mt-0.5 capitalize">
                {profile.gender || "Not provided"}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
              <Map size={18} className="text-gray-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</p>
              <p className="text-gray-700 text-sm font-semibold mt-0.5">
                {[profile.location?.city, profile.location?.state, profile.location?.pincode]
                  .filter(Boolean).join(", ") || "Not provided"}
              </p>
            </div>
          </div>
        </div>

        {/* Wallet & Preferences */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0">
              <Wallet size={18} className="text-orange-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Wallet Balance</p>
              <p className="text-orange-600 text-lg font-bold mt-0.5 flex items-center gap-1">
                <IndianRupee size={16} /> {profile.wallet?.balance || 0}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
              <Activity size={18} className="text-gray-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preferred Sports</p>
              {profile.preferred_sports?.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.preferred_sports.map(sport => (
                    <span key={sport} className="px-2.5 py-1 text-xs font-bold text-green-700 bg-green-50 border border-green-100 rounded-lg capitalize">
                      {sport}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm font-medium mt-0.5">Not provided</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  ) : (
    <div className="text-center py-6 text-gray-400 text-sm font-medium">
      Failed to load profile details.
    </div>
  )}
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