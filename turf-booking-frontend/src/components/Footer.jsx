import '../styles/footer.css'


function Footer() {
  return (
    <footer className="footer">
      <div className="footer__grid">
        <div>
          <h3 className="footer__brand brand-wordmark">Infinity Sports Turf</h3>
          <p className="footer__text">Your premier destination for sports turf bookings.</p>
        </div>
        <div>
          <h3 className="footer__heading">Quick Links</h3>
          {["Home", "Find Turfs", "About"].map(link => (
            <p key={link} className="footer__link">{link}</p>
          ))}
        </div>
        <div>
          <h3 className="footer__heading">Sports & Facilities</h3>
          {["Football", "Cricket"].map(sport => (
            <p key={sport} className="footer__link">{sport}</p>
          ))}
        </div>

        <div className="footer__contact space-y-4">
          {/* Phone - WhatsApp */}
          <a
            href="https://wa.me/918446918814"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 group w-fit"
          >
            <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center text-lg border border-zinc-800 group-hover:bg-zinc-800 transition-colors">
              📞
            </div>
            <p className="text-sm font-semibold text-zinc-400 group-hover:text-zinc-100 transition-colors">
              +91 84469 18814
            </p>
          </a>

          {/* Email - Gmail */}
          <a
            href="mailto:infinityturf0@gmail.com"
            className="flex items-center gap-3 group w-fit"
          >
            <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center text-lg border border-zinc-800 group-hover:bg-zinc-800 transition-colors">
              ✉️
            </div>
            <p className="text-sm font-semibold text-zinc-400 group-hover:text-zinc-100 transition-colors">
              infinityturf0@gmail.com
            </p>
          </a>

          {/* Location - Google Maps */}
          <a
            href="https://www.google.com/maps/dir//Infinity+Sports+Turf,+Stephen+Menezes+Marg,+Virar+West,+Virar,+Maharashtra+401303/@19.4358522,72.7100486,12z/data=!4m8!4m7!1m0!1m5!1m1!1s0x3be7ab610f52c693:0x122bc1c9d6a719a5!2m2!1d72.7924501!2d19.4358472?entry=ttu"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 group w-fit"
          >
            <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center text-lg border border-zinc-800 group-hover:bg-zinc-800 transition-colors">
              📍
            </div>
            <p className="text-sm font-semibold text-zinc-400 group-hover:text-zinc-100 transition-colors leading-tight">
              Vasai Maharashtra, India
            </p>
          </a>

          {/* Instagram Link */}
          <a
            href="https://www.instagram.com/_infinity_turf?igsh=MThsengxZjk4MXp5dg%3D%3D"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 group w-fit"
          >
            <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center text-lg border border-zinc-700 group-hover:bg-zinc-800 transition-all group-hover:rotate-6">
              📸
            </div>
            <p className="text-sm font-bold text-zinc-300 underline underline-offset-4 decoration-emerald-500/30 group-hover:decoration-emerald-500 transition-all">
              @_infinity_turf
            </p>
          </a>
        </div>

      </div>
    </footer>
  )
}

export default Footer