import '../styles/home.css'
import { motion } from 'framer-motion'
import { MapPin, Search } from 'lucide-react'
import Card from '../components/Card'


const steps = [
  { icon: "🔍", title: "Find a Turf", desc: "Search by sport, city or area" },
  { icon: "📅", title: "Pick a Slot", desc: "Real-time availability, no guessing" },
  { icon: "💳", title: "Pay Securely", desc: "Instant confirmation via Razorpay" },
  { icon: "⚽", title: "Play & Enjoy", desc: "Show up and play, zero hassle" },
]

const fade = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }

function Home() {
  const scrollToAllTurfs = () => {
    const section = document.getElementById('allturfs')

    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="home">
      {/* <Navbar /> */}

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-content">
          <motion.div initial="hidden" animate="show" variants={fade} transition={{ duration: 0.5 }}>
          </motion.div>

          <motion.h1 initial="hidden" animate="show" variants={fade} transition={{ duration: 0.5, delay: 0.1 }}>
            Book Your <span>Perfect</span><br />Turf Instantly
          </motion.h1>

          <motion.p className="hero-sub" initial="hidden" animate="show" variants={fade} transition={{ duration: 0.5, delay: 0.2 }}>
            Browse top-rated sports grounds near you. Check live availability, book in seconds, and pay securely online.
          </motion.p>

          {/* <motion.div className="hero-actions" initial="hidden" animate="show" variants={fade} transition={{ duration: 0.5, delay: 0.3 }}>
            <button className="btn-glow" onClick={scrollToAllTurfs}>Explore Turfs </button>
            <button className="btn-ghost">Become a Host</button>
          </motion.div>

          <motion.div className="hero-stats" initial="hidden" animate="show" variants={fade} transition={{ duration: 0.5, delay: 0.4 }}>
            {[["10+", "Turfs Listed"], ["500+", "Bookings Done"], ["4.8★", "Avg Rating"]].map(([num, label]) => (
              <div className="stat" key={label}>
                <div className="stat-num">{num}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </motion.div> */}
        </div>
      </section>

      {/* Search
      <div className="search-section">
        <motion.div className="search-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Search size={18} color="rgba(255,255,255,0.35)" style={{ margin: 'auto 8px' }} />
          <input type="text" placeholder="Search by turf, area or city..." />
          <button>Find Turfs</button>
        </motion.div>
      </div> */}


      {/* All Turfs */}
      <section className="turfs-section" id="allturfs">
        <div className="section-header">
          <div>
            <div className="section-label">Available Now</div>
            <h2>All Turfs</h2>
          </div>
          <a href="#">View all →</a>
        </div>

        <Card />



      </section>

      {/* How It Works */}
      <section className="how-section">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          The easiest way to book turfs
        </motion.h2>
        <div className="how-grid">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              className="how-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="how-num">{i + 1}</div>
              <div className="how-icon">{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-glow" />
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          Own a Turf?
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
          List on Infinity Sports Turf and start getting digital bookings today. Zero commission for early partners.
        </motion.p>
        <div className="cta-buttons">
          <button className="btn-glow">List Your Turf</button>
          <button className="btn-ghost">Talk to Us</button>
        </div>
      </section>

      {/* <Footer /> */}
    </div>
  )
}

export default Home