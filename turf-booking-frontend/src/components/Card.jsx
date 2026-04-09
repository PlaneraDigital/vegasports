import { useNavigate } from "react-router-dom";
import { MapPin, Search } from 'lucide-react'


const turfs = [
  {
    id: 1,
    name: "Six & Strike Turf",
    location: "Manickpur, Vasai West",
    price: 800,
    type: "Multi-Sport",
    image: "/images/turf1.jpg",
  },
  {
    id: 2,
    name: "Kollide Turf",
    location: "Cricket Ground, Umel",
    price: 900,
    type: "Multi-Sport",
    image: "/images/turf2.jpg",
  },
  {
    id: 3,
    name: "Hobby Lobby Turf",
    location: "Vasai West, Maharashtra",
    price: 750,
    type: "Multi-Sport",
    image: "/images/turf3.jpg",
  },
];

const TurfCard = ({ turf }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/turf/${turf.id}`)}
      className="bg-zinc-900 text-white rounded-2xl overflow-hidden shadow-lg cursor-pointer hover:scale-105 transition duration-300 hover:border"
    >
      {/* Image */}
      <div className="relative">
        <img
          src={turf.image}
          alt={turf.name}
          className="w-full h-48 object-cover"
        />

        <span className="absolute top-3 left-3 bg-green-700 text-xs px-3 py-1 rounded-full">
          {turf.type}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h2 className="text-lg font-semibold">{turf.name}</h2>
        <p className="text-gray-400 text-sm">
          <MapPin size={12} className="inline mr-1" />
          {turf.location}
        </p>

        <div className="flex justify-between items-center mt-4">
          <span className="text-green-400 font-bold">
            ₹{turf.price}/hour
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/turf/${turf.id}`);
            }}
            className="px-4 py-1 border border-green-600 rounded-md text-green-400 hover:bg-green-600 hover:text-white transition"
          >
            Check slots →
          </button>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  return (
    <div className="bg-black rounded-3xl p-6">
      <div className="grid md:grid-cols-3 gap-6">
        {turfs.map((turf) => (
          <TurfCard key={turf.id} turf={turf} />
        ))}
      </div>
    </div>
  );
};

export default Home;