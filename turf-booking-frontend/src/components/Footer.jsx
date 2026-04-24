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
          {["Football", "Cricket", "Volleyball", "Basketball", "Tennis"].map(sport => (
            <p key={sport} className="footer__link">{sport}</p>
          ))}
        </div>
        
          <div className="footer__contact space-y-4 font-bold">
  {/* Phone */}
  <div className="flex items-center gap-3 group cursor-default">
    <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-lg border border-green-100 group-hover:bg-green-100 transition-colors">
      📞
    </div>
    <p className="text-sm font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
      +91 84469 18814
    </p>
  </div>

  {/* Email */}
  <div className="flex items-center gap-3 group cursor-default">
    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-lg border border-blue-100 group-hover:bg-blue-100 transition-colors">
      ✉️
    </div>
    <p className="text-sm font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
      infinityturf0@gmail.com
    </p>
  </div>

  {/* Location */}
  <div className="flex items-center gap-3 group cursor-default">
    <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-lg border border-red-100 group-hover:bg-red-100 transition-colors">
      📍
    </div>
    <p className="text-sm font-semibold text-gray-600 group-hover:text-gray-900 transition-colors leading-tight">
      Vasai Maharashtra, India
    </p>
  </div>

  {/* Instagram Link */}
  <a 
    href="https://www.instagram.com/_infinity_turf?igsh=MThsengxZjk4MXp5dg%3D%3D" 
    target="_blank" 
    rel="noopener noreferrer"
    className="flex items-center gap-3 group w-fit"
  >
    <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center text-lg border border-pink-100 group-hover:bg-pink-100 transition-all group-hover:rotate-6">
      📸
    </div>
    <p className="text-sm font-bold text-gray-700 underline underline-offset-4 decoration-pink-300 group-hover:decoration-pink-500 transition-all">
      @_infinity_turf
    </p>
  </a>
</div>

      </div>
    </footer>
  )
}

export default Footer