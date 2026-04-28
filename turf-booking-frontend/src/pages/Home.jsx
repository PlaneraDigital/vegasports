import { useState, useEffect } from "react";
import axios from 'axios'
import '../styles/home.css'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MapPin, Search, CheckCircle2 } from 'lucide-react'
import Card from '../components/Card'
import LocationMap from '../components/LocationMap'




const fade = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }

function Home() {
  const navigate = useNavigate()
  const [amenities, setAmenities] = useState([])
  const [offers, setOffers] = useState([])
  
  useEffect(() => {
    const fetchTurfs = async () => {
      try {
        const base = import.meta.env.VITE_API_URL || "http://localhost:5001";
        const res = await axios.get(`${base}/api/turfs`);
        if (res.data.turfs && res.data.turfs.length > 0) {
          const firstTurf = res.data.turfs[0];
          const active = Array.isArray(firstTurf.amenities) ? firstTurf.amenities : [];
          setAmenities(active);
          setOffers(Array.isArray(firstTurf.offers) ? firstTurf.offers : []);
        }
      } catch (err) {
        console.error("Error fetching amenities:", err);
      }
    };
    fetchTurfs();
  }, []);

  const goToBooking = () => {
    navigate('/turf/69c2a2dce69a34692fa78985/book')
  }

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-content">
          <motion.div initial="hidden" animate="show" variants={fade} transition={{ duration: 0.5 }}>
          </motion.div>

          <motion.h1 initial="hidden" animate="show" variants={fade} transition={{ duration: 0.5, delay: 0.1 }}>
            Premium Multi-Sport Experience in <br /> <span>Virar West </span>
          </motion.h1>

          <motion.p className="hero-sub" initial="hidden" animate="show" variants={fade} transition={{ duration: 0.5, delay: 0.2 }}>
            Welcome! Whether it’s a high-stakes cricket match or a fast-paced football face-off, your slot starts here.
          </motion.p>

          <motion.div initial="hidden" animate="show" variants={fade} transition={{ duration: 0.5, delay: 0.25 }} className="hero-btn-container">
            <button onClick={goToBooking} className="btn-glow flex items-center gap-2 mx-auto">
              Book Your Slot Now <Search size={18} />
            </button>
            <a 
              href="https://www.instagram.com/_infinity_turf" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hero-follow-btn"
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7.75 2A5.75 5.75 0 0 0 2 7.75v8.5A5.75 5.75 0 0 0 7.75 22h8.5A5.75 5.75 0 0 0 22 16.25v-8.5A5.75 5.75 0 0 0 16.25 2h-8.5ZM12 7.25A4.75 4.75 0 1 1 7.25 12 4.75 4.75 0 0 1 12 7.25Zm0 1.5A3.25 3.25 0 1 0 15.25 12 3.25 3.25 0 0 0 12 8.75Zm5.25-.5a1.25 1.25 0 1 1-1.25 1.25 1.25 1.25 0 0 1 1.25-1.25ZM12 9.75A2.25 2.25 0 1 1 9.75 12 2.25 2.25 0 0 1 12 9.75Z"/>
              </svg>
              <span>Follow @infinity_turf</span>
            </a>
          </motion.div>
        </div>
      </section>


      {/* All Turfs */}
      <section className="turfs-section" id="allturfs">
        <Card />
      </section>

      {/* Offers Section */}
      {offers.length > 0 && (
        <section className="offers-modern pt-12 pb-8 border-t border-zinc-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="section-header mb-8 text-center">
               <h2 className="text-xl font-black">Exclusive Offers</h2>
            </div>
          </div>
        </section>
      )}

      {/* Facilities Section */}
      <section className="facilities-section pt-10 pb-20 bg-zinc-50/50">
         <div className="max-w-7xl mx-auto px-6">
            <div className="section-header mb-8 text-center">
               <h2 className="text-xl font-black">Our Facilities</h2>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
               {amenities.length > 0 ? amenities.map((label, i) => (
                 <div key={i} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-100 rounded-full shadow-md hover:shadow-lg transition-all">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span className="text-sm font-bold text-zinc-700 tracking-tight">{label}</span>
                 </div>
               )) : (
                 <div className="text-zinc-400 text-sm italic">Loading amenities...</div>
               )}
            </div>
         </div>
      </section>

      {/* Location Section */}
      <LocationMap />
    </div>
  )
}

export default Home