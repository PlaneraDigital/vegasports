import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  MapPin, Star, Clock, IndianRupee, ChevronLeft, ChevronRight,
  Zap, Car, Droplets, ShieldCheck, Utensils, Dumbbell,
  Layers, Tag, CalendarDays, Info, CheckCircle2, XCircle,
  Shirt, ArrowLeft,
} from "lucide-react";

/* ─────────────────────────
   LOOKUP MAPS
────────────────────────── */
const SURFACE_LABEL = {
  artificial_grass: "Artificial Grass",
  natural_grass:    "Natural Grass",
  concrete:         "Concrete",
  clay:             "Clay",
};

const TURF_TYPE_LABEL = {
  "multi-purpose":  "Multi-Purpose",
  "football-only":  "Football Only",
  "cricket-only":   "Cricket Only",
  "badminton-only": "Badminton Only",
};

const DAY_ORDER = [
  "monday","tuesday","wednesday","thursday","friday","saturday","sunday",
];

const AMENITY_META = {
  floodlights:          { icon: Zap,        label: "Floodlights"      },
  parking:              { icon: Car,         label: "Parking"          },
  washroom:             { icon: Droplets,    label: "Washroom"         },
  changing_room:        { icon: Shirt,       label: "Changing Room"    },
  drinking_water:       { icon: Droplets,    label: "Drinking Water"   },
  professional_surface: { icon: Layers,      label: "Pro Surface"      },
  safe_premises:        { icon: ShieldCheck, label: "Safe Premises"    },
  equipment_rental:     { icon: Dumbbell,    label: "Equipment Rental" },
  cafeteria:            { icon: Utensils,    label: "Cafeteria"        },
};

const SPORT_EMOJI = {
  football: "⚽", cricket: "🏏", badminton: "🏸", tennis: "🎾", basketball: "🏀",
};

const STATUS_STYLE = {
  active:           "bg-emerald-950/60 border-emerald-700/50 text-emerald-400",
  inactive:         "bg-zinc-800 border-zinc-600 text-zinc-400",
  pending_approval: "bg-yellow-950/60 border-yellow-700/50 text-yellow-400",
  suspended:        "bg-red-950/60 border-red-700/50 text-red-400",
};

/* ─────────────────────────
   SKELETON LOADER
────────────────────────── */
function SkeletonLoader() {
  return (
    <div className="bg-black min-h-screen animate-pulse">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-6">
        <div className="w-32 h-4 bg-zinc-800 rounded-full" />
      </div>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 mt-5">
        <div className="w-full h-[300px] md:h-[460px] bg-zinc-800 rounded-2xl" />
      </div>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 mt-8">
        <div className="grid md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_360px] gap-10 lg:gap-14">
          <div className="space-y-5">
            <div className="flex gap-2">
              <div className="w-24 h-6 bg-zinc-800 rounded-full" />
              <div className="w-20 h-6 bg-zinc-800 rounded-full" />
            </div>
            <div className="w-3/4 h-10 bg-zinc-800 rounded-xl" />
            <div className="w-1/2 h-4 bg-zinc-800 rounded-full" />
            <div className="flex gap-3 mt-2">
              {[1,2,3,4].map(i => <div key={i} className="w-28 h-10 bg-zinc-800 rounded-xl" />)}
            </div>
            <div className="border-t border-zinc-800 pt-8 space-y-3">
              <div className="w-32 h-5 bg-zinc-800 rounded-full" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-11 bg-zinc-800 rounded-xl" />)}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="w-full h-64 bg-zinc-800 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────
   ERROR SCREEN
────────────────────────── */
function ErrorScreen({ message, onBack }) {
  return (
    <div className="bg-black min-h-screen flex flex-col items-center justify-center text-center px-6">
      <div className="text-6xl mb-5">🏟️</div>
      <h1 className="text-2xl font-bold text-white mb-2">Turf Not Found</h1>
      <p className="text-zinc-500 text-sm mb-7 max-w-xs">{message}</p>
      <button onClick={onBack}
        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-full transition text-sm">
        <ArrowLeft size={15} /> Back to listings
      </button>
    </div>
  );
}

/* ─────────────────────────
   IMAGE GALLERY
────────────────────────── */
function ImageGallery({ images }) {
  const [active, setActive] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-[400px] bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-600">
        No images available
      </div>
    );
  }

  const prev = () => setActive(p => p === 0 ? images.length - 1 : p - 1);
  const next = () => setActive(p => p === images.length - 1 ? 0 : p + 1);

  return (
    <div className="relative">
      <div className="relative w-full overflow-hidden rounded-2xl group">
        <img
          key={active}
          src={images[active].url}
          alt={images[active].label || "turf"}
          className="w-full h-[300px] md:h-[460px] object-cover"
          onError={e => { e.target.src = "/images/turf1.jpg"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 pointer-events-none" />

        {images.length > 1 && (
          <>
            <button onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm">
              <ChevronLeft size={18} />
            </button>
            <button onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm">
              <ChevronRight size={18} />
            </button>
          </>
        )}

        <span className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-zinc-300 text-xs px-3 py-1 rounded-full">
          {active + 1} / {images.length}
        </span>
        {images[active].label && (
          <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-zinc-300 text-xs px-3 py-1 rounded-full capitalize">
            {images[active].label.replace(/-/g, " ")}
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 mt-2.5 overflow-x-auto pb-0.5">
          {images.map((img, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all duration-150 ${
                i === active ? "border-green-500 opacity-100" : "border-transparent opacity-50 hover:opacity-80"
              }`}>
              <img src={img.url} alt="" className="w-full h-full object-cover"
                onError={e => { e.target.src = "/images/turf1.jpg"; }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────
   SECTION HEADING
────────────────────────── */
function SectionHeading({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className="w-8 h-8 rounded-lg bg-green-950 border border-green-800/60 flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-green-400" />
      </div>
      <h2 className="text-base font-semibold text-white tracking-tight">{label}</h2>
    </div>
  );
}

/* ─────────────────────────
   DIVIDER
────────────────────────── */
function Divider() {
  return <hr className="border-zinc-800/80 my-8" />;
}

/* ─────────────────────────
   AMENITIES GRID
────────────────────────── */
function AmenitiesGrid({ amenities }) {
  if (!amenities) return null;
  const all = Object.entries(amenities);

  return (
    <section>
      <SectionHeading icon={Zap} label="Amenities" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {all.map(([key, val]) => {
          const meta = AMENITY_META[key];
          if (!meta) return null;
          const Icon = meta.icon;
          return (
            <div key={key}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
                val
                  ? "bg-green-950/30 border-green-800/40 text-green-300"
                  : "bg-zinc-900/60 border-zinc-800 text-zinc-600"
              }`}>
              <Icon size={14} className="flex-shrink-0" />
              <span className="flex-1 font-medium">{meta.label}</span>
              {val
                ? <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                : <XCircle     size={14} className="text-zinc-700 flex-shrink-0" />}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─────────────────────────
   OPERATING HOURS
────────────────────────── */
/* convert "06:00" → "6:00 AM" */
function fmt(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ap}`;
}

/* group consecutive days that share identical open/close/is_closed */
function groupDays(hours) {
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const groups = [];
  let i = 0;
  while (i < DAY_ORDER.length) {
    const cur = hours[DAY_ORDER[i]];
    let j = i;
    while (
      j + 1 < DAY_ORDER.length &&
      hours[DAY_ORDER[j + 1]]?.open      === cur?.open &&
      hours[DAY_ORDER[j + 1]]?.close     === cur?.close &&
      hours[DAY_ORDER[j + 1]]?.is_closed === cur?.is_closed
    ) j++;
    groups.push({
      label: j === i ? cap(DAY_ORDER[i]) : `${cap(DAY_ORDER[i])} – ${cap(DAY_ORDER[j])}`,
      slot: cur,
    });
    i = j + 1;
  }
  return groups;
}

function OperatingHours({ hours, pricing_overrides }) {
  if (!hours) return null;
  const groups = groupDays(hours);
  const peak   = pricing_overrides?.peak_hours;

  return (
    <section>
      <SectionHeading icon={CalendarDays} label="Operating Hours" />
      <div className="grid sm:grid-cols-2 gap-6">

        {/* Left — Regular Hours */}
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Regular Hours</p>
          <div className="space-y-3">
            {groups.map(({ label, slot }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-zinc-300">{label}</span>
                {slot?.is_closed
                  ? <span className="text-red-400 text-sm font-medium">Closed</span>
                  : (slot?.open && slot?.close)
                    ? <span className="text-green-400 text-sm font-semibold tabular-nums">
                        {fmt(slot.open)} – {fmt(slot.close)}
                      </span>
                    : <span className="text-zinc-600 text-sm">—</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Right — Peak Hours + Holiday note */}
        <div className="space-y-4">
          {peak?.start && peak?.end && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">Peak Hours</p>
              <div className="bg-amber-950/40 border border-amber-700/40 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={14} className="text-amber-400" />
                  <span className="text-amber-300 text-sm font-semibold">
                    Evening Slots ({fmt(peak.start)} – {fmt(peak.end)})
                  </span>
                </div>
                <p className="text-amber-500/80 text-xs leading-relaxed">
                  Higher demand during these hours. We recommend booking in advance for evening slots.
                </p>
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Holiday Schedule</p>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Open on all public holidays. Special rates may apply on holidays.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}

/* ─────────────────────────
   RULES
────────────────────────── */
function Rules({ rules }) {
  if (!rules || rules.length === 0) return null;
  return (
    <section>
      <SectionHeading icon={Info} label="Turf Rules" />
      <ul className="space-y-3">
        {rules.map((rule, i) => (
          <li key={i} className="flex items-start gap-3.5">
            <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 text-xs flex items-center justify-center font-semibold">
              {i + 1}
            </span>
            <span className="text-zinc-300 text-sm leading-relaxed">{rule}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ─────────────────────────
   BOOKING SIDEBAR CARD
────────────────────────── */
function BookingCard({ turf }) {
  const sym = turf.currency === "INR" ? "₹" : (turf.currency || "₹");
  const hasOverrides = turf.pricing_overrides?.weekend_price || turf.pricing_overrides?.peak_hour_price;

  return (
    <div className="bg-zinc-900 border border-zinc-700/70 rounded-2xl overflow-hidden shadow-xl shadow-black/40">
      <div className="px-6 pt-6 pb-5 border-b border-zinc-800">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-green-400">{sym}{turf.price_per_hour}</span>
          <span className="text-zinc-500 text-sm">/ hr</span>
        </div>
        {turf.slot_duration_minutes && (
          <p className="text-zinc-500 text-xs mt-1 flex items-center gap-1">
            <Clock size={11} /> {turf.slot_duration_minutes}-min slots
          </p>
        )}
      </div>

      {hasOverrides && (
        <div className="px-6 py-4 border-b border-zinc-800 space-y-3 text-sm">
          {turf.pricing_overrides.weekend_price && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Weekend</span>
              <span className="text-yellow-400 font-semibold">{sym}{turf.pricing_overrides.weekend_price}/hr</span>
            </div>
          )}
          {turf.pricing_overrides.peak_hour_price && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Peak hours</span>
              <span className="text-orange-400 font-semibold">{sym}{turf.pricing_overrides.peak_hour_price}/hr</span>
            </div>
          )}
          {turf.pricing_overrides.peak_hours?.start && turf.pricing_overrides.peak_hours?.end && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 text-xs">Peak time</span>
              <span className="text-zinc-400 text-xs tabular-nums">
                {turf.pricing_overrides.peak_hours.start} – {turf.pricing_overrides.peak_hours.end}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="px-6 py-5">
        <button id="book-now-sidebar"
          className="w-full py-3.5 bg-green-600 hover:bg-green-500 active:scale-95 text-white font-bold rounded-xl transition-all duration-150 text-sm tracking-wide shadow-lg shadow-green-900/40">
          Book a Slot
        </button>
        <p className="text-center text-zinc-600 text-xs mt-3">Instant confirmation · No hidden charges</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════
   MAIN PAGE
═══════════════════════════════════ */
export default function TurfPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [turf,    setTurf]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const fetchTurf = async () => {
      try {
        const base = import.meta.env.VITE_API_URL || "http://localhost:5001";
        const res  = await axios.get(`${base}/api/turfs/${id}`);
        setTurf(res.data.turf);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load turf details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTurf();
  }, [id]);

  if (loading) return <SkeletonLoader />;
  if (error || !turf) return <ErrorScreen message={error} onBack={() => navigate(-1)} />;

  const sym             = turf.currency === "INR" ? "₹" : (turf.currency || "₹");
  const activeAmenities = turf.amenities ? Object.values(turf.amenities).filter(Boolean).length : 0;
  const fullAddress     = [turf.location?.address, turf.location?.city, turf.location?.state]
                            .filter(Boolean).join(", ");

  return (
    <div className="bg-black text-white min-h-screen">

      {/* ── BACK NAV ── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-6">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-medium transition group">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to listings
        </button>
      </div>

      {/* ── IMAGE GALLERY ── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 mt-5">
        <ImageGallery images={turf.images} />
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 mt-8 pb-32 md:pb-16">
        <div className="grid md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_360px] gap-10 lg:gap-14 items-start">

          {/* ════ LEFT COLUMN ════ */}
          <div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {turf.turf_type && (
                <span className="bg-green-950/60 border border-green-800/50 text-green-400 text-xs px-3 py-1 rounded-full font-medium">
                  {TURF_TYPE_LABEL[turf.turf_type] || turf.turf_type}
                </span>
              )}
              {turf.surface && (
                <span className="bg-zinc-800/80 border border-zinc-700/50 text-zinc-300 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                  <Layers size={11} />
                  {SURFACE_LABEL[turf.surface] || turf.surface}
                </span>
              )}
              {turf.status && (
                <span className={`text-xs px-3 py-1 rounded-full font-medium border ${STATUS_STYLE[turf.status] || STATUS_STYLE.inactive}`}>
                  {turf.status.replace(/_/g, " ")}
                </span>
              )}
            </div>

            {/* Name */}
            <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight leading-snug">
              {turf.name}
            </h1>

            {/* Location + Rating */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              {fullAddress && (
                <p className="flex items-center gap-1.5 text-sm text-zinc-400">
                  <MapPin size={13} className="text-green-500 flex-shrink-0" />
                  {fullAddress}
                  {turf.location?.pincode && (
                    <span className="text-zinc-600"> – {turf.location.pincode}</span>
                  )}
                </p>
              )}
              {turf.rating?.total_reviews > 0 ? (
                <>
                  <span className="text-zinc-700 hidden sm:inline">·</span>
                  <div className="flex items-center gap-1.5">
                    <Star size={13} fill="#facc15" className="text-yellow-400" />
                    <span className="text-yellow-300 font-semibold text-sm">
                      {turf.rating.average?.toFixed(1)}
                    </span>
                    <span className="text-zinc-500 text-xs">({turf.rating.total_reviews} reviews)</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-zinc-700 hidden sm:inline">·</span>
                  <span className="text-zinc-500 text-xs">No reviews yet</span>
                </>
              )}
            </div>

            {/* Quick stats pills */}
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-xl text-sm">
                <IndianRupee size={14} className="text-green-400" />
                <span className="text-zinc-200 font-semibold">{sym}{turf.price_per_hour}</span>
                <span className="text-zinc-500">/hr</span>
              </div>
              {turf.slot_duration_minutes && (
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-xl text-sm">
                  <Clock size={14} className="text-green-400" />
                  <span className="text-zinc-200 font-semibold">{turf.slot_duration_minutes} min</span>
                  <span className="text-zinc-500">slots</span>
                </div>
              )}
              {turf.surface && (
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-xl text-sm">
                  <Layers size={14} className="text-green-400" />
                  <span className="text-zinc-200 font-semibold">{SURFACE_LABEL[turf.surface]}</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-xl text-sm">
                <ShieldCheck size={14} className="text-green-400" />
                <span className="text-zinc-200 font-semibold">{activeAmenities}</span>
                <span className="text-zinc-500">amenities</span>
              </div>
            </div>

            <Divider />

            {/* Sports */}
            {turf.sports && turf.sports.length > 0 && (
              <>
                <section>
                  <SectionHeading icon={Tag} label="Sports Available" />
                  <div className="flex flex-wrap gap-2.5">
                    {turf.sports.map(sport => (
                      <span key={sport}
                        className="flex items-center gap-2 bg-zinc-900 border border-zinc-700/60 text-zinc-200 text-sm px-4 py-2.5 rounded-xl capitalize font-medium">
                        <span className="text-base">{SPORT_EMOJI[sport] || "🏅"}</span>
                        {sport}
                      </span>
                    ))}
                  </div>
                </section>
                <Divider />
              </>
            )}

            {/* Amenities */}
            <AmenitiesGrid amenities={turf.amenities} />

          </div>

          {/* ════ RIGHT COLUMN (sticky sidebar) ════ */}
          <div className="hidden md:block">
            <div className="sticky top-24">
              <BookingCard turf={turf} />

              {/* Location info card */}
              <div className="mt-4 bg-zinc-900/60 border border-zinc-800 rounded-xl px-5 py-4 space-y-2.5 text-sm">
                {turf.location?.city && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">City</span>
                    <span className="text-zinc-200 font-medium">{turf.location.city}</span>
                  </div>
                )}
                {turf.location?.state && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">State</span>
                    <span className="text-zinc-200 font-medium">{turf.location.state}</span>
                  </div>
                )}
                {turf.location?.pincode && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Pincode</span>
                    <span className="text-zinc-200 font-medium">{turf.location.pincode}</span>
                  </div>
                )}
                {turf.slot_duration_minutes && (
                  <div className="flex items-center justify-between border-t border-zinc-800 pt-2.5 mt-1">
                    <span className="text-zinc-500">Slot duration</span>
                    <span className="text-zinc-200 font-medium">{turf.slot_duration_minutes} min</span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* ── Full-width: Operating Hours + Rules ── */}
        <Divider />
        <OperatingHours hours={turf.operating_hours} pricing_overrides={turf.pricing_overrides} />
        <Divider />
        <Rules rules={turf.rules} />

      </div>

      {/* ── MOBILE STICKY FOOTER ── */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-50
                      bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800
                      px-5 py-3 flex items-center justify-between">
        <div>
          <p className="text-green-400 font-bold text-xl leading-none">
            {sym}{turf.price_per_hour}
            <span className="text-zinc-500 font-normal text-sm"> /hr</span>
          </p>
          {turf.slot_duration_minutes && (
            <p className="text-zinc-500 text-xs mt-1">{turf.slot_duration_minutes} min slots</p>
          )}
        </div>
        <button id="book-now-mobile"
          className="px-7 py-2.5 bg-green-600 hover:bg-green-500 active:scale-95 text-white font-bold rounded-full transition-all text-sm">
          Book Now
        </button>
      </div>

    </div>
  );
}
