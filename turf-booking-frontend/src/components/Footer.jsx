import '../styles/footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__grid">
        <div>
          <h3 className="footer__brand">vegasports</h3>
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
        <div className="footer__contact">
          <p>📞 +91 7387628021</p>
          <p>✉️ vegasports83@gmail.com</p>
          <p>📍 Vasai Maharashtra, India</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer