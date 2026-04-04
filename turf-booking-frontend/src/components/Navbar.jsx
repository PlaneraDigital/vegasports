import '../styles/navbar.css'

function Navbar() {
  return (
    <nav className="navbar">
      <span className="navbar-logo"> vegasports</span>
      <div className="navbar-links">
        <a href="/">Home</a>
        <a href="#">Turf Played</a>
        <a href="#">Become a Host</a>
        <a href="#" className="navbar-login">Login</a>
      </div>
    </nav>
  )
}

export default Navbar