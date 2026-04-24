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
            Terms & Conditions
          </Link>
          <Link to="/sitemap" className="hover:text-green-500 transition">
            Sitemap
          </Link>
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