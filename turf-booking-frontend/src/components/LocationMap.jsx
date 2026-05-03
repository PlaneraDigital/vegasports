import { MapPin, ArrowUpRight } from "lucide-react";

const LocationMap = () => {
  const mapLink = "https://www.google.com/maps/dir//Infinity+Sports+Turf,+Stephen+Menezes+Marg,+Virar+West,+Virar,+Maharashtra+401303/@19.4358522,72.7100486,12z/data=!4m8!4m7!1m0!1m5!1m1!1s0x3be7ab610f52c693:0x122bc1c9d6a719a5!2m2!1d72.7924501!2d19.4358472?entry=ttu";
  
  return (
    <section className="location-section bg-zinc-950 border-t border-zinc-800 pt-10 pb-2 sm:pt-16 sm:pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
            <MapPin size={20} className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-black text-zinc-100">Our Location</h2>
        </div>

        <div className="relative group">
          {/* Map Card */}
          <div className="relative w-full h-[350px] rounded-[2.5rem] overflow-hidden border border-zinc-800 shadow-xl shadow-black/50">
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
                className="flex items-center gap-2 px-5 py-3 bg-zinc-900/90 backdrop-blur-md border border-zinc-700 rounded-2xl text-zinc-100 text-sm font-bold shadow-lg hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95"
              >
                Open in Google Maps <ArrowUpRight size={18} className="text-zinc-400" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem]">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-2xl shadow-sm border border-zinc-700">
               📍
             </div>
             <div>
               <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Address</p>
               <p className="text-zinc-200 font-bold text-sm">Stephen Menezes Marg, Virar West, Maharashtra</p>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationMap;
