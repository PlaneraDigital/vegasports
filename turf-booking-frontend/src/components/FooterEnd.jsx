import { Link } from "react-router-dom";
import { FaShieldAlt } from "react-icons/fa";
import { MdPayment } from "react-icons/md";
import { AiOutlineCheckCircle } from "react-icons/ai";

const Footer = () => {
  return (
    <footer className=" bottom-64 font-mono bg-black text-gray-400 text-sm">
      
      {/* Top Section */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-700">
        
        <p>© 2026 vegasports. All rights reserved.</p>

        <div className="flex gap-6">
          <Link to="/terms_&_conditions" className="hover:text-green-600 transition">
            Terms & Conditions
          </Link>
          <Link to="/sitemap" className="hover:text-green-600 transition">
            Sitemap
          </Link>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-center items-center gap-6 text-green-400">
        
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