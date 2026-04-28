import { Link } from "react-router-dom";
import { FaShieldAlt } from "react-icons/fa";
import { MdPayment } from "react-icons/md";
import { AiOutlineCheckCircle } from "react-icons/ai";

const Footer = () => {
  return (
    <footer className="bg-black text-gray-400 text-sm">

      {/* Top Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-700 text-center md:text-left">

        <p>© 2026 Infinity Sports Turf. All rights reserved.</p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
          <Link to="/terms_&_conditions" className="hover:text-green-500 transition">
            Cancellation Policy
          </Link>
          <a href="https://www.google.com/maps/dir//Infinity+Sports+Turf,+Stephen+Menezes+Marg,+Virar+West,+Virar,+Maharashtra+401303/@19.4358522,72.7100486,12z/data=!4m8!4m7!1m0!1m5!1m1!1s0x3be7ab610f52c693:0x122bc1c9d6a719a5!2m2!1d72.7924501!2d19.4358472?entry=ttu"
            target="_blank" rel="noopener noreferrer" className="hover:text-green-500 transition">
            Sitemap
          </a>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 sm:gap-6 text-green-400 text-center">

        <div className="flex items-center gap-2">
          <FaShieldAlt />
          <span>Secure SSL Booking</span>
        </div>

        <div className="flex items-center gap-2">
          <MdPayment />
          <span>Multiple Payment Options</span>
        </div>

        <div className="flex items-center gap-2">
          <AiOutlineCheckCircle />
          <span>Verified Turfs</span>
        </div>

      </div>
    </footer>
  );
};

export default Footer;