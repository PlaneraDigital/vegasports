import { useNavigate } from "react-router-dom"
import { MapPin } from "lucide-react"
import { useEffect, useState } from "react"
import axios from "axios"

const TurfCard = ({ turf }) => {
  const navigate = useNavigate()

  // get primary image or fallback
  const image =
    turf.images?.find((img) => img.is_primary)?.url ||
    turf.images?.[0]?.url ||
    "/images/placeholder.jpg"

  return (
    <div
      onClick={() => navigate(`/turf/${turf._id}`)}
      className="bg-zinc-800 text-zinc-100 rounded-2xl overflow-hidden shadow-md hover:shadow-xl cursor-pointer transition duration-300 hover:scale-[1.02] border border-zinc-700 hover:border-green-500"
    >
      {/* Image */}
      <div className="relative">
        <img
          src={image}
          alt={turf.name}
          className="w-full h-48 sm:h-52 object-cover"
          onError={(e) => {
            e.target.src = "/images/turf1.jpg"
          }}
        />

        {/* Vibrant Green Badge */}
        <span className="absolute top-3 left-3 bg-green-600 text-white text-xs sm:text-sm px-3 py-1 rounded-full font-medium shadow-sm">
          {turf.turf_type || "Multi-Sport"}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        <h2 className="text-lg sm:text-xl font-bold text-zinc-100">
          {turf.name}
        </h2>

        <p className="text-zinc-400 text-sm mt-1 leading-relaxed flex items-center">
          <MapPin size={14} className="mr-1 text-zinc-500" />
          {turf.location?.address}, {turf.location?.city}
        </p>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-5">
          <span className="text-green-400 font-extrabold text-lg sm:text-xl">
            ₹{turf.price_per_hour}
            <span className="text-zinc-500 font-normal text-xs sm:text-sm">
              /{turf.slot_duration_minutes} mins
            </span>
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/turf/${turf._id}`)
            }}
            /* Updated Button for Light Theme */
            className="w-full sm:w-auto px-5 py-2 bg-green-600 text-white rounded-lg text-sm sm:text-base font-semibold hover:bg-green-700 transition shadow-sm"
          >
            View Photos
          </button>
        </div>
      </div>
    </div>
  )
}

const Card = () => {
  const [turfs, setTurfs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTurfs = async () => {
      try {
        const url =
          import.meta.env.VITE_API_URL || "http://localhost:5001"

        const res = await axios.get(`${url}/api/turfs`)
        setTurfs(res.data.turfs)
      } catch (err) {
        setError("Failed to load turfs")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchTurfs()
  }, [])

  if (loading)
    return (
      <div className="text-center text-zinc-500 py-20 font-medium">
        Loading turfs...
      </div>
    )

  if (error)
    return (
      <div className="text-center text-red-400 py-20 font-medium">
        {error}
      </div>
    )

  if (turfs.length === 0)
    return (
      <div className="text-center text-zinc-500 py-20 font-medium">
        No turfs available at the moment.
      </div>
    )

  return (
    /* Changed bg-black to bg-transparent/white and used mx-auto to center */
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
        {turfs.map((turf) => (
          <TurfCard key={turf._id} turf={turf} />
        ))}
      </div>
    </div>
  )
}

export default Card