import { useParams } from "react-router-dom";

// SAME DATA (for now)
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

const TurfDetails = () => {
  const { id } = useParams();

  const turf = turfs.find((t) => t.id === parseInt(id));

  if (!turf) {
    return <div className="text-white p-6">Turf not found</div>;
  }

  return (
    <div className="bg-black text-white min-h-screen p-6">
      
      {/* Image */}
      <img
        src={turf.image}
        alt={turf.name}
        className="w-full h-85 object-cover rounded-xl"
      />

      {/* Info */}
      <div className="mt-6">
        <h1 className="text-3xl font-bold">{turf.name}</h1>
        <p className="text-gray-400 mt-2">{turf.location}</p>

        <p className="text-green-400 text-xl mt-4">
          ₹{turf.price}/hour
        </p>

        <button className="mt-6 px-6 py-2 bg-green-600 rounded-md hover:bg-green-700">
          Book Now
        </button>
      </div>

    </div>
  );
};

export default TurfDetails;