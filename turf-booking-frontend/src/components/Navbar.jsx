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
    <nav className="sticky top-0 z-50 border-b border-gray-200"
      style={{ backgroundColor: '#ffffff' }}>

      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold cursor-pointer group"
          style={{ color: '#16a34a' }}>
          <IoFootballSharp className="transition duration-700 group-hover:rotate-180" />
          <span className="brand-wordmark text-gray-900">Infinity <span style={{ color: '#16a34a' }}>Sports Turf</span></span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-2">
          <Link to="/"
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition  text-medium font-semibold tracking-wider">
            Home
          </Link>
          
          {authUser ? (
            <>
              <Link
                to="/profile"
                className="ml-2 px-3 py-2 text-medium text-gray-600 hover:text-green-600 transition font-medium"
              >
                Hi, {authUser.name}
              </Link>
              <button
                onClick={handleLogout}
                className="px-6 py-2 text-sm font-bold text-white rounded-full transition cursor-pointer uppercase tracking-tighter"
                style={{ backgroundColor: '#16a34a' }}
                onMouseEnter={e => e.target.style.backgroundColor = '#15803d'}
                onMouseLeave={e => e.target.style.backgroundColor = '#16a34a'}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login"
              className="ml-2 px-6 py-2 text-sm font-bold text-white rounded-full transition uppercase tracking-tighter"
              style={{ backgroundColor: '#16a34a' }}
              onMouseEnter={e => e.target.style.backgroundColor = '#15803d'}
              onMouseLeave={e => e.target.style.backgroundColor = '#16a34a'}>
              Book Now
            </Link>
          )}
        </div>

        {/* Hamburger Icon */}
        <div className="md:hidden text-2xl cursor-pointer text-gray-600 hover:text-gray-900 transition">
          {open ? (
            <HiX onClick={() => setOpen(false)} />
          ) : (
            <HiMenu onClick={() => setOpen(true)} />
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden flex flex-col items-center gap-2 pb-6 pt-2 border-t border-gray-100"
          style={{ backgroundColor: '#ffffff' }}>

          <Link to="/" onClick={() => setOpen(false)}
            className="w-full text-center px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition text-sm font-semibold">
            Home
          </Link>

          {authUser ? (
            <>
              <Link to="/profile" onClick={() => setOpen(false)}
                className="w-full text-center px-4 py-3 text-gray-600 hover:text-green-600 transition font-medium">
                Hi, {authUser.name}
              </Link>
              <button
                onClick={handleLogout}
                className="mt-1 px-8 py-2 text-sm font-bold text-white rounded-full transition uppercase"
                style={{ backgroundColor: '#16a34a' }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)}
              className="mt-1 px-8 py-2 text-sm font-bold text-white rounded-full transition uppercase"
              style={{ backgroundColor: '#16a34a' }}>
              Login
            </Link>
          )}

        </div>
      )}
    </nav>
  );
};

export default Navbar;