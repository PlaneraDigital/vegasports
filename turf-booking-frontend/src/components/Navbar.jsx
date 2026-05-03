import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IoFootballSharp } from "react-icons/io5";
import { HiMenu, HiX } from "react-icons/hi";
import { clearAuthSession, getAuthUser } from "../utils/auth";


const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [authUser, setAuthUser] = useState(getAuthUser());

  useEffect(() => {
    const syncUser = () => setAuthUser(getAuthUser());

    window.addEventListener("userUpdated", syncUser);
    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener("userUpdated", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    setOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800"
      style={{ backgroundColor: '#111827' }}>

      <div className="max-w-7xl mx-auto px-6 py-4 md:py-2 flex justify-between items-center">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 cursor-pointer group">
          <div className="relative w-10 h-10 overflow-hidden rounded-full border-2 border-emerald-500/20 group-hover:border-emerald-500 transition-all duration-500">
            <img 
              src="/logo.png" 
              alt="Infinity Sports Turf" 
              className="w-full h-full object-cover scale-110" 
              style={{ filter: 'brightness(1.1)' }}
            />
          </div>
          <span className="brand-wordmark text-zinc-100 text-xl font-black tracking-tight">
            Infinity <span style={{ color: '#4ade80' }}>Turf</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-2">
          <Link to="/"
            className="px-4 py-2 text-zinc-400 hover:text-zinc-100 transition  text-medium font-semibold tracking-wider">
            Home
          </Link>
          
          {authUser ? (
            <>
              <Link
                to="/profile"
                className="ml-2 px-3 py-2 text-medium text-zinc-400 hover:text-green-400 transition font-medium"
              >
                Hi, {authUser.name}
              </Link>
              <button
                onClick={handleLogout}
                className="px-6 py-2 text-sm font-bold text-white rounded-full transition cursor-pointer uppercase tracking-tighter"
                style={{ backgroundColor: '#00844d' }}
                onMouseEnter={e => e.target.style.backgroundColor = '#006b3e'}
                onMouseLeave={e => e.target.style.backgroundColor = '#00844d'}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login"
              className="ml-2 px-6 py-2 text-sm font-bold text-white rounded-full transition uppercase tracking-tighter"
              style={{ backgroundColor: '#00844d' }}
              onMouseEnter={e => e.target.style.backgroundColor = '#006b3e'}
              onMouseLeave={e => e.target.style.backgroundColor = '#00844d'}>
              Book Now
            </Link>
          )}
        </div>

        {/* Hamburger Icon */}
        <div className="md:hidden text-2xl cursor-pointer text-zinc-400 hover:text-zinc-100 transition">
          {open ? (
            <HiX onClick={() => setOpen(false)} />
          ) : (
            <HiMenu onClick={() => setOpen(true)} />
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden flex flex-col items-center gap-2 pb-6 pt-2 border-t border-zinc-800"
          style={{ backgroundColor: '#111827' }}>

          <Link to="/" onClick={() => setOpen(false)}
            className="w-full text-center px-4 py-3 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition text-sm font-semibold">
            Home
          </Link>

          {authUser ? (
            <>
              <Link to="/profile" onClick={() => setOpen(false)}
                className="w-full text-center px-4 py-3 text-zinc-400 hover:text-green-400 transition font-medium">
                Hi, {authUser.name}
              </Link>
              <button
                onClick={handleLogout}
                className="mt-1 px-8 py-2 text-sm font-bold text-white rounded-full transition uppercase"
                style={{ backgroundColor: '#00844d' }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)}
              className="mt-1 px-8 py-2 text-sm font-bold text-white rounded-full transition uppercase"
              style={{ backgroundColor: '#00844d' }}>
              Login
            </Link>
          )}

        </div>
      )}
    </nav>
  );
};

export default Navbar;