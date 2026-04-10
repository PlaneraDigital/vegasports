import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const TurfDetails = () => {
  const { id } = useParams();
  const [turf, setTurf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTurf = async () => {
      try {
        const url = import.meta.env.VITE_API_URL || "http://localhost:5001";
        const res = await axios.get(`${url}/api/turfs/${id}`);
        setTurf(res.data.turf);
      } catch (err) {
        setError("Turf not found");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTurf();
  }, [id]);

  if (loading) {
    return <div className="text-white p-6">Loading turf details...</div>;
  }

  if (error || !turf) {
    return <div className="text-white p-6">{error || "Turf not found"}</div>;
  }

  // extract image safely
  const image = turf.images?.find(img => img.is_primary)?.url
    || turf.images?.[0]?.url
    || "/images/placeholder.jpg";

  // extract address safely
  const location = `${turf.location?.address || ""}, ${turf.location?.city || ""}`;

  return (
    <div className="bg-black text-white min-h-screen p-6">

      {/* Image */}
      <img
        src={image}
        alt={turf.name}
        className="w-full h-85 object-cover rounded-xl"
      />

      {/* Info */}
      <div className="mt-6">
        <h1 className="text-3xl font-bold">{turf.name}</h1>
        <p className="text-gray-400 mt-2">{location}</p>

        <p className="text-green-400 text-xl mt-4">
          ₹{turf.price_per_hour}/hour
        </p>

        <button className="mt-6 px-6 py-2 bg-green-600 rounded-md hover:bg-green-700">
          Book Now
        </button>
      </div>

    </div>
  );
};

export default TurfDetails;