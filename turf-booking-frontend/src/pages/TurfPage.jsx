import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { api } from "../utils/auth";
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
  floodlights:          { icon: Zap,         label: "Floodlights"      },
  parking:              { icon: Car,          label: "Parking"           },
  washroom:             { icon: Droplets,    label: "Washroom"          },
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
  active:           "bg-emerald-50 border-emerald-200 text-emerald-700",
  inactive:         "bg-zinc-100 border-zinc-200 text-zinc-500",
  pending_approval: "bg-amber-50 border-amber-200 text-amber-700",
  suspended:        "bg-red-50 border-red-200 text-red-700",
};

/* ─────────────────────────
   SKELETON LOADER
────────────────────────── */
function SkeletonLoader() {
  return (
    <div className="bg-zinc-50 min-h-screen animate-pulse">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-6">
        <div className="w-32 h-4 bg-zinc-200 rounded-full" />
      </div>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 mt-5">
        <div className="w-full h-[300px] md:h-[460px] bg-zinc-200 rounded-2xl" />
      </div>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 mt-8">
        <div className="grid md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_360px] gap-10 lg:gap-14">
          <div className="space-y-5">
            <div className="flex gap-2">
              <div className="w-24 h-6 bg-zinc-200 rounded-full" />
              <div className="w-20 h-6 bg-zinc-200 rounded-full" />
            </div>
            <div className="w-3/4 h-10 bg-zinc-200 rounded-xl" />
            <div className="w-1/2 h-4 bg-zinc-200 rounded-full" />
            <div className="flex gap-3 mt-2">
              {[1,2,3,4].map(i => <div key={i} className="w-28 h-10 bg-zinc-200 rounded-xl" />)}
            </div>
          </div>
          <div className="hidden md:block">
            <div className="w-full h-64 bg-zinc-200 rounded-2xl" />
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
    <div className="bg-zinc-50 min-h-screen flex flex-col items-center justify-center text-center px-6">
      <div className="text-6xl mb-5">🏟️</div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">Turf Not Found</h1>
      <p className="text-zinc-500 text-sm mb-7 max-w-xs">{message}</p>
      <button onClick={onBack}
        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full transition text-sm">
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
      <div className="w-full h-[400px] bg-zinc-200 rounded-2xl flex items-center justify-center text-zinc-500 border border-zinc-300">
        No images available
      </div>
    );
  }

  const prev = () => setActive(p => p === 0 ? images.length - 1 : p - 1);
  const next = () => setActive(p => p === images.length - 1 ? 0 : p + 1);

  return (
    <div className="relative">
      <div className="relative w-full overflow-hidden rounded-2xl group border border-zinc-200">
        <img
          key={active}
          src={images[active].url}
          alt={images[active].label || "turf"}
          className="w-full h-[300px] md:h-[460px] object-cover"
          onError={e => { e.target.src = "/images/turf1.jpg"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

        {images.length > 1 && (
          <>
            <button onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-zinc-900 p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-md shadow-sm">
              <ChevronLeft size={18} />
            </button>
            <button onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-zinc-900 p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-md shadow-sm">
              <ChevronRight size={18} />
            </button>
          </>
        )}

        <span className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
          {active + 1} / {images.length}
        </span>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 mt-2.5 overflow-x-auto pb-0.5">
          {images.map((img, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all duration-150 ${
                i === active ? "border-green-600 opacity-100 shadow-md" : "border-transparent opacity-60 hover:opacity-100"
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
      <div className="w-8 h-8 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-green-600" />
      </div>
      <h2 className="text-base font-bold text-zinc-900 tracking-tight">{label}</h2>
    </div>
  );
}

/* ─────────────────────────
   DIVIDER
────────────────────────── */
function Divider() {
  return <hr className="border-zinc-200 my-8" />;
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-colors ${
                val
                  ? "bg-white border-green-200 text-zinc-700 shadow-sm"
                  : "bg-zinc-50 border-zinc-200 text-zinc-400"
              }`}>
              <Icon size={14} className={`flex-shrink-0 ${val ? "text-green-600" : "text-zinc-400"}`} />
              <span className="flex-1 font-medium">{meta.label}</span>
              {val
                ? <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                : <XCircle     size={14} className="text-zinc-300 flex-shrink-0" />}
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
function fmt(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ap}`;
}

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
        <div>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Regular Hours</p>
          <div className="space-y-3">
            {groups.map(({ label, slot }) => (
              <div key={label} className="flex items-center justify-between border-b border-zinc-100 pb-2 last:border-0">
                <span className="text-sm text-zinc-600">{label}</span>
                {slot?.is_closed
                  ? <span className="text-red-500 text-sm font-semibold">Closed</span>
                  : (slot?.open && slot?.close)
                    ? <span className="text-zinc-900 text-sm font-bold tabular-nums">
                        {fmt(slot.open)} – {fmt(slot.close)}
                      </span>
                    : <span className="text-zinc-400 text-sm">—</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {peak?.start && peak?.end && (
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Peak Hours</p>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={14} className="text-amber-600" />
                  <span className="text-amber-800 text-sm font-bold">
                    Evening Slots ({fmt(peak.start)} – {fmt(peak.end)})
                  </span>
                </div>
                <p className="text-amber-700/80 text-xs leading-relaxed">
                  Higher demand during these hours. We recommend booking in advance for evening slots.
                </p>
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Holiday Schedule</p>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Open on all public holidays. Special rates may apply.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Rules({ rules }) {
  if (!rules || rules.length === 0) return null;
  return (
    <section>
      <SectionHeading icon={Info} label="Turf Rules" />
      <ul className="space-y-3">
        {rules.map((rule, i) => (
          <li key={i} className="flex items-start gap-3.5 group">
            <span className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-lg bg-zinc-100 text-zinc-500 text-xs flex items-center justify-center font-bold group-hover:bg-zinc-900 group-hover:text-white transition-colors">
              {i + 1}
            </span>
            <span className="text-zinc-600 text-sm leading-relaxed font-medium">{rule}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

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
  const fullAddress     = [turf.location?.address, turf.location?.city, turf.location?.state].filter(Boolean).join(", ");

  return (
    <div className="bg-zinc-50 text-zinc-900 min-h-screen pb-20">
      
      {/* ── BACK NAV ── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-6">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 text-sm font-bold transition group">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to listings
        </button>
      </div>

      {/* ── IMAGE GALLERY ── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 mt-5">
        <ImageGallery images={turf.images} />
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 mt-8">
        <div className="grid md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_360px] gap-10 lg:gap-14 items-start">

          {/* ════ LEFT COLUMN ════ */}
          <div>
            <div className="flex flex-wrap gap-2">
              {turf.turf_type && (
                <span className="bg-green-100 border border-green-200 text-green-700 text-[11px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                  {TURF_TYPE_LABEL[turf.turf_type] || turf.turf_type}
                </span>
              )}
              {turf.status && (
                <span className={`text-[11px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border ${STATUS_STYLE[turf.status] || STATUS_STYLE.inactive}`}>
                  {turf.status.replace(/_/g, " ")}
                </span>
              )}
            </div>

            <h1 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-zinc-900">
              {turf.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              {fullAddress && (
                <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-500">
                  <MapPin size={14} className="text-green-600" />
                  {fullAddress}
                </p>
              )}
              {turf.rating?.total_reviews > 0 && (
                <div className="flex items-center gap-1.5 bg-zinc-100 px-2 py-0.5 rounded-md">
                  <Star size={13} fill="#eab308" className="text-yellow-500" />
                  <span className="text-zinc-900 font-bold text-sm">{turf.rating.average?.toFixed(1)}</span>
                  <span className="text-zinc-500 text-xs font-bold">({turf.rating.total_reviews})</span>
                </div>
              )}
            </div>

            {/* Quick stats pills */}
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white border border-zinc-200 px-4 py-2.5 rounded-2xl shadow-sm text-sm">
                <IndianRupee size={14} className="text-green-600" />
                <span className="text-zinc-900 font-bold">{sym}{turf.price_per_hour}</span>
                <span className="text-zinc-500">/hr</span>
              </div>
              <div className="flex items-center gap-2 bg-white border border-zinc-200 px-4 py-2.5 rounded-2xl shadow-sm text-sm">
                <ShieldCheck size={14} className="text-green-600" />
                <span className="text-zinc-900 font-bold">{activeAmenities}</span>
                <span className="text-zinc-500">Amenities</span>
              </div>
            </div>

            <Divider />

            {turf.sports?.length > 0 && (
              <>
                <section>
                  <SectionHeading icon={Tag} label="Sports Available" />
                  <div className="flex flex-wrap gap-2.5">
                    {turf.sports.map(sport => (
                      <span key={sport}
                        className="flex items-center gap-2 bg-white border border-zinc-200 text-zinc-800 text-sm px-4 py-2.5 rounded-xl capitalize font-bold shadow-sm">
                        <span>{SPORT_EMOJI[sport] || "🏅"}</span>
                        {sport}
                      </span>
                    ))}
                  </div>
                </section>
                <Divider />
              </>
            )}

            <AmenitiesGrid amenities={turf.amenities} />
          </div>

          {/* ════ RIGHT COLUMN ════ */}
          <div className="w-full">
            <div className="sticky top-24">
              <div className="bg-white border border-zinc-200 rounded-[32px] shadow-xl shadow-zinc-200/50 p-7 relative">
                <h3 className="text-zinc-900 font-black text-xl mb-2">Ready to play?</h3>
                <p className="text-zinc-500 text-sm font-medium mb-6">Secure your slot in seconds. Instant confirmation.</p>
                
                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="text-4xl font-black text-zinc-900 tracking-tight">{sym}{turf.price_per_hour}</span>
                  <span className="text-zinc-400 text-sm font-bold uppercase tracking-widest">/ hour</span>
                </div>

                <button 
                  onClick={() => navigate(`/turf/${turf._id}/book`)}
                  className="w-full py-4 bg-zinc-900 text-white text-[15px] font-bold rounded-2xl hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Book Slots <ChevronRight size={18} />
                </button>
              </div>

              <div className="mt-4 bg-white border border-zinc-200 rounded-2xl px-5 py-4 space-y-2.5 text-sm font-medium">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Location</span>
                  <span className="text-zinc-900">{turf.location?.city}</span>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-100 pt-2.5">
                  <span className="text-zinc-400">Duration</span>
                  <span className="text-zinc-900">{turf.slot_duration_minutes} min slots</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <Divider />
        <OperatingHours hours={turf.operating_hours} pricing_overrides={turf.pricing_overrides} />
        <Divider />
        <Rules rules={turf.rules} />
      </div>

      {/* ── MOBILE STICKY FOOTER ── */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 bg-white/90 backdrop-blur-lg border-t border-zinc-200 px-5 py-4 flex items-center justify-between shadow-2xl">
        <div>
          <p className="text-zinc-900 font-black text-xl leading-none">
            {sym}{turf.price_per_hour}
            <span className="text-zinc-400 font-bold text-xs uppercase ml-1">/hr</span>
          </p>
        </div>
        <button 
          onClick={() => navigate(`/turf/${turf._id}/book`)}
          className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200 active:scale-95 transition-all text-sm">
          Book Now
        </button>
      </div>

    </div>
  );
}