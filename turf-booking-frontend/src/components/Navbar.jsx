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
    <nav className="sticky top-0 z-50 border-b border-gray-800"
      style={{ backgroundColor: '#0a0a0a' }}>

      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold cursor-pointer group"
          style={{ color: '#4ade80' }}>
          <IoFootballSharp className="transition duration-700 group-hover:rotate-180" />
          <span className="brand-wordmark">Infinity Sports Turf</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-2">
          <Link to="/"
            className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition">
            Home
          </Link>
          <Link to="/turf-played"
            className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition">
            Turf Played
          </Link>
          <Link to="/become-a-host"
            className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition">
            Become a Host
          </Link>
          {authUser ? (
            <>
              <Link
                to="/profile"
                className="ml-2 px-3 py-2 text-sm text-gray-300 hover:text-green-400 transition"
              >
                Hi, {authUser.name}
              </Link>
              <button
                onClick={handleLogout}
                className="px-5 py-2 text-sm font-medium text-white rounded-md transition cursor-pointer"
                style={{ backgroundColor: '#16a34a' }}
                onMouseEnter={e => e.target.style.backgroundColor = '#15803d'}
                onMouseLeave={e => e.target.style.backgroundColor = '#16a34a'}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login"
              className="ml-2 px-5 py-2 text-sm font-medium text-white rounded-md transition"
              style={{ backgroundColor: '#16a34a' }}
              onMouseEnter={e => e.target.style.backgroundColor = '#15803d'}
              onMouseLeave={e => e.target.style.backgroundColor = '#16a34a'}>
              Login
            </Link>
          )}
        </div>

        {/* Hamburger Icon */}
        <div className="md:hidden text-2xl cursor-pointer text-gray-300 hover:text-white transition">
          {open ? (
            <HiX onClick={() => setOpen(false)} />
          ) : (
            <HiMenu onClick={() => setOpen(true)} />
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden flex flex-col items-center gap-2 pb-6 pt-2 border-t border-gray-800"
          style={{ backgroundColor: '#0a0a0a' }}>

          <Link to="/" onClick={() => setOpen(false)}
            className="w-full text-center px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 transition">
            Home
          </Link>
          <Link to="/Turf-Played" onClick={() => setOpen(false)}
            className="w-full text-center px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 transition">
            Turf Played
          </Link>
          <Link to="/Become-A-Host" onClick={() => setOpen(false)}
            className="w-full text-center px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 transition">
            Become a Host
          </Link>
          {authUser ? (
            <>
              <Link to="/profile" onClick={() => setOpen(false)}
                className="w-full text-center px-4 py-3 text-gray-300 hover:text-green-400 transition font-medium">
                Hi, {authUser.name}
              </Link>
              <button
                onClick={handleLogout}
                className="mt-1 px-8 py-2 text-sm font-medium text-white rounded-md transition"
                style={{ backgroundColor: '#16a34a' }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)}
              className="mt-1 px-8 py-2 text-sm font-medium text-white rounded-md transition"
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