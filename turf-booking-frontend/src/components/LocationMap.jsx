import { MapPin, ArrowUpRight } from "lucide-react";

const LocationMap = () => {
  const mapLink = "https://www.google.com/maps/dir//Infinity+Sports+Turf,+Stephen+Menezes+Marg,+Virar+West,+Virar,+Maharashtra+401303/@19.4358522,72.7100486,12z/data=!4m8!4m7!1m0!1m5!1m1!1s0x3be7ab610f52c693:0x122bc1c9d6a719a5!2m2!1d72.7924501!2d19.4358472?entry=ttu";
  
  return (
    <section className="location-section bg-white border-t border-zinc-100 pt-10 pb-2 sm:pt-16 sm:pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
            <MapPin size={20} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-black text-zinc-900">Our Location</h2>
        </div>

        <div className="relative group">
          {/* Map Card */}
          <div className="relative w-full h-[350px] rounded-[2.5rem] overflow-hidden border border-zinc-200 shadow-xl shadow-zinc-200/50">
            <iframe
              title="Turf Location"
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3765.456789012345!2d72.7924501!3d19.4358472!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7ab610f52c693%3A0x122bc1c9d6a719a5!2sInfinity%20Sports%20Turf!5e0!3m2!1sen!2sin!4v1234567890"
              allowFullScreen
            ></iframe>
            
            {/* Overlay Button */}
            <div className="absolute top-6 right-6">
              <a 
                href={mapLink}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 bg-white/90 backdrop-blur-md border border-zinc-200 rounded-2xl text-zinc-900 text-sm font-bold shadow-lg hover:bg-white transition-all hover:scale-105 active:scale-95"
              >
                Open in Google Maps <ArrowUpRight size={18} className="text-zinc-400" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 bg-zinc-50 border border-zinc-100 p-6 rounded-[2rem]">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-sm border border-zinc-100">
               📍
             </div>
             <div>
               <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Address</p>
               <p className="text-zinc-900 font-bold text-sm">Stephen Menezes Marg, Virar West, Maharashtra</p>
             </div>
          </div>
          
          <a 
            href="https://www.instagram.com/_infinity_turf" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-3 px-6 py-3 bg-zinc-900 text-white rounded-2xl hover:bg-black transition-all shadow-lg active:scale-95"
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M7.75 2A5.75 5.75 0 0 0 2 7.75v8.5A5.75 5.75 0 0 0 7.75 22h8.5A5.75 5.75 0 0 0 22 16.25v-8.5A5.75 5.75 0 0 0 16.25 2h-8.5ZM12 7.25A4.75 4.75 0 1 1 7.25 12 4.75 4.75 0 0 1 12 7.25Zm0 1.5A3.25 3.25 0 1 0 15.25 12 3.25 3.25 0 0 0 12 8.75Zm5.25-.5a1.25 1.25 0 1 1-1.25 1.25 1.25 1.25 0 0 1 1.25-1.25ZM12 9.75A2.25 2.25 0 1 1 9.75 12 2.25 2.25 0 0 1 12 9.75Z"/></svg>
            </div>
            <span className="text-sm font-bold truncate">Follow @infinity_turf</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default LocationMap;
