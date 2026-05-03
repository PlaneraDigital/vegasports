import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { api } from "../utils/auth";
import {
  MapPin, Star, Clock, IndianRupee, ChevronLeft, ChevronRight,
  Zap, Car, Droplets, ShieldCheck, Utensils, Dumbbell,
  Layers, Tag, CalendarDays, Info, CheckCircle2, XCircle,
  Shirt, ArrowLeft, Sun, Camera, Plug, Sofa, Leaf, Sparkles, Map,
} from "lucide-react";
import BookingSection from "../components/BookingSection";
import LocationMap from "../components/LocationMap";

/* ─────────────────────────
   LOOKUP MAPS
────────────────────────── */
const SURFACE_LABEL = {
  artificial_grass: "Artificial Grass",
  natural_grass: "Natural Grass",
  concrete: "Concrete",
  clay: "Clay",
};

const TURF_TYPE_LABEL = {
  "multi-purpose": "Multi-Purpose",
  "football-only": "Football Only",
  "cricket-only": "Cricket Only",
  "badminton-only": "Badminton Only",
};

const DAY_ORDER = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
];

const SPORT_EMOJI = {
  football: "⚽", cricket: "🏏", badminton: "🏸", tennis: "🎾", basketball: "🏀",
};

const STATUS_STYLE = {
  active: "bg-emerald-900/20 border-emerald-800 text-emerald-400",
  inactive: "bg-zinc-800 border-zinc-700 text-zinc-500",
  pending_approval: "bg-amber-900/20 border-amber-800 text-amber-400",
  suspended: "bg-red-900/20 border-red-800 text-red-400",
};

/* ─────────────────────────
   SKELETON LOADER
────────────────────────── */
function SkeletonLoader() {
  return (
    <div className="bg-zinc-950 min-h-screen animate-pulse">
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
    <div className="bg-zinc-950 min-h-screen flex flex-col items-center justify-center text-center px-6">
      <div className="text-6xl mb-5">🏟️</div>
      <h1 className="text-2xl font-bold text-zinc-100 mb-2">Turf Not Found</h1>
      <p className="text-zinc-500 text-sm mb-7 max-w-xs">{message}</p>
      <button onClick={onBack}
        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full transition text-sm">
        <ArrowLeft size={15} /> Back to listings
      </button>
    </div>
  );
}

/* ─────────────────────────
   IMAGE GALLERY
────────────────────────── */
function ImageGallery({ images, isMobile = false }) {
  const [active, setActive] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className={`w-full ${isMobile ? 'h-[500px]' : 'h-[400px]'} bg-zinc-900 rounded-none md:rounded-2xl flex items-center justify-center text-zinc-500 border-0 md:border border-zinc-800`}>
        No images available
      </div>
    );
  }

  const prev = () => setActive(p => p === 0 ? images.length - 1 : p - 1);
  const next = () => setActive(p => p === images.length - 1 ? 0 : p + 1);

  return (
    <div className="relative">
      <div className={`relative w-full overflow-hidden ${isMobile ? 'rounded-none' : 'rounded-2xl'} group ${isMobile ? 'border-0' : 'border border-zinc-800'}`}>
        <img
          key={active}
          src={images[active].url}
          alt={images[active].label || "turf"}
          className={`w-full ${isMobile ? 'h-[500px]' : 'h-[300px] md:h-[460px]'} object-cover`}
          onError={e => { e.target.src = "/images/turf1.jpg"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

        {images.length > 1 && (
          <>
            <button onClick={prev}
              className={`absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white p-2.5 rounded-full opacity-0 ${!isMobile ? 'group-hover:opacity-100' : 'md:opacity-0 md:group-hover:opacity-100'} transition-all duration-200 backdrop-blur-md shadow-sm`}>
              <ChevronLeft size={18} />
            </button>
            <button onClick={next}
              className={`absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white p-2.5 rounded-full opacity-0 ${!isMobile ? 'group-hover:opacity-100' : 'md:opacity-0 md:group-hover:opacity-100'} transition-all duration-200 backdrop-blur-md shadow-sm`}>
              <ChevronRight size={18} />
            </button>
          </>
        )}

        <span className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
          {active + 1} / {images.length}
        </span>
      </div>

      {images.length > 1 && (
        <div className={`${isMobile ? 'hidden' : 'flex'} gap-2 mt-2.5 overflow-x-auto pb-0.5`}>
          {images.map((img, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all duration-150 ${i === active ? "border-emerald-600 opacity-100 shadow-md" : "border-transparent opacity-60 hover:opacity-100"
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
      <div className="w-8 h-8 rounded-lg bg-emerald-900/50 border border-emerald-800 flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-emerald-400" />
      </div>
      <h2 className="text-base font-bold text-zinc-100 tracking-tight">{label}</h2>
    </div>
  );
}

/* ─────────────────────────
   DIVIDER
────────────────────────── */
function Divider() {
  return <hr className="border-zinc-800 my-8" />;
}

/* ─────────────────────────
   AMENITIES GRID
────────────────────────── */
function AmenitiesGrid({ amenities }) {
  if (!amenities || !Array.isArray(amenities) || amenities.length === 0) return null;

  return (
    <section>
      <SectionHeading icon={Zap} label="Amenities" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {amenities.map((a, i) => (
          <div key={i}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-800 text-sm bg-zinc-900 text-zinc-300 shadow-sm transition-colors">
            <CheckCircle2 size={14} className="flex-shrink-0 text-emerald-400" />
            <span className="font-bold tracking-tight">{a}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────
   TURF RULES
────────────────────────── */
function Rules({ rules }) {
  if (!rules || rules.length === 0) return null;
  return (
    <section>
      <SectionHeading icon={Info} label="Turf Rules" />
      <ul className="space-y-3">
        {rules.map((rule, i) => (
          <li key={i} className="flex items-start gap-3.5 group">
            <span className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-lg bg-zinc-800 text-zinc-400 text-xs flex items-center justify-center font-bold group-hover:bg-zinc-700 group-hover:text-zinc-100 transition-colors">
              {i + 1}
            </span>
            <span className="text-zinc-400 text-sm leading-relaxed font-medium group-hover:text-zinc-300">{rule}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function TurfPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [turf, setTurf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTurf = async () => {
      try {
        const base = import.meta.env.VITE_API_URL || "http://localhost:5001";
        const res = await axios.get(`${base}/api/turfs/${id}`);
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

  const sym = turf.currency === "INR" ? "₹" : (turf.currency || "₹");

  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen pb-24 md:pb-12">

      {/* ── HERO IMAGE SECTION (MOBILE) ── */}
      <div className="md:hidden relative">
        <ImageGallery images={turf.images} isMobile={true} />
        <button onClick={() => navigate(-1)}
          className="absolute top-6 left-5 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black transition-all shadow-lg">
          <ArrowLeft size={18} />
        </button>
      </div>

      {/* ── DESKTOP BACK NAV ── */}
      <div className="hidden md:block max-w-6xl mx-auto px-5 sm:px-8 pt-6">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-100 text-sm font-bold transition group">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to listings
        </button>
      </div>

      {/* ── DESKTOP IMAGE GALLERY ── */}
      <div className="hidden md:block max-w-6xl mx-auto px-5 sm:px-8 mt-5">
        <ImageGallery images={turf.images} />
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-6xl mx-auto px-5 md:px-5 sm:px-8 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_360px] gap-8 md:gap-10 lg:gap-14 items-start">

          {/* ════ LEFT COLUMN ════ */}
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              {turf.turf_type && (
                <span className="bg-emerald-900/20 border border-emerald-800 text-emerald-400 text-[11px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                  {TURF_TYPE_LABEL[turf.turf_type] || turf.turf_type}
                </span>
              )} 
              {turf.status && (
                <span className={`text-[11px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border ${STATUS_STYLE[turf.status] || STATUS_STYLE.inactive}`}>
                  {turf.status.replace(/_/g, " ")}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-100 mb-4">
              {turf.name}
            </h1>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
              <div className="mb-4">
                <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-2">Location</p>
                <p className="flex items-start gap-2 text-zinc-300 font-medium text-sm leading-relaxed">
                  <MapPin size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{turf.location?.address}, {turf.location?.city}, {turf.location?.state}</span>
                </p>
              </div>

              <button
                onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(turf.name + ' ' + turf.location?.city)}`, '_blank')}
                className="w-full mt-4 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 font-bold rounded-lg hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Map size={16} /> Get Directions
              </button>
            </div>

            {turf.sports?.length > 0 && (
              <div className="mb-8">
                <h3 className="text-base font-bold text-zinc-100 mb-4 flex items-center gap-2">
                  <Layers size={15} className="text-emerald-500" /> Sports Available
                </h3>
                <div className="flex flex-wrap gap-3">
                  {turf.sports.map(sport => (
                    <div key={sport} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-zinc-100 font-bold py-2.5 px-4 rounded-xl shadow-sm">
                      <span className="text-lg">{SPORT_EMOJI[sport] || "🏅"}</span>
                      <span className="uppercase text-sm tracking-tight">{sport}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ════ RIGHT COLUMN (DESKTOP) ════ */}
          <div className="hidden md:block">
            <div className="sticky top-24">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl p-6 space-y-6">
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Starting From</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-zinc-100">{sym}{turf.price_per_hour}</span>
                    <span className="text-zinc-500 text-sm font-medium">/ hour</span>
                  </div>
                </div>
                
                <div className="h-px w-full bg-zinc-800" />

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-900/20 flex items-center justify-center">
                    <Star size={18} fill="#10b981" className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Rating</p>
                    <p className="text-lg font-black text-zinc-100 leading-tight">4.9 / 5.0</p>
                  </div>
                </div>

                <button
                  onClick={() => document.getElementById('booking-section').scrollIntoView({ behavior: 'smooth' })}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <CalendarDays size={18} />
                  Book Slots Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── SHARED SECTIONS ── */}
        <div className="mt-8">
          <Divider />
          <AmenitiesGrid amenities={turf.amenities} />
          <Divider />
          <Rules rules={turf.rules} />
          <Divider />
          <div className="rounded-2xl overflow-hidden border border-zinc-800">
            <LocationMap />
          </div>
        </div>

        {/* ── BOOKING SECTION ── */}
        <BookingSection turf={turf} />
      </div>

      {/* ── MOBILE STICKY FOOTER ── */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-800 px-6 py-5 flex items-center justify-between shadow-2xl">
        <div>
          <p className="text-zinc-100 font-black text-xl leading-none">
            {sym}{turf.price_per_hour}
            <span className="text-zinc-500 font-normal text-sm"> / hr</span>
          </p>
        </div>
        <button
          onClick={() => document.getElementById('booking-section').scrollIntoView({ behavior: 'smooth' })}
          className="px-8 py-3.5 bg-emerald-600 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all text-sm uppercase tracking-widest">
          Book Now
        </button>
      </div>
    </div>
  );
}