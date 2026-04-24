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
      className="bg-zinc-900 text-white rounded-2xl overflow-hidden shadow-lg cursor-pointer transition duration-300 hover:scale-[1.02] hover:border hover:border-green-600"
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

        <span className="absolute top-3 left-3 bg-green-700 text-xs sm:text-sm px-3 py-1 rounded-full">
          {turf.turf_type || "Multi-Sport"}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        <h2 className="text-lg sm:text-xl font-semibold">
          {turf.name}
        </h2>

        <p className="text-gray-400 text-sm mt-1 leading-relaxed">
          <MapPin size={12} className="inline mr-1" />
          {turf.location?.address}, {turf.location?.city}
        </p>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-4">
          <span className="text-green-400 font-bold text-lg sm:text-xl">
            ₹{turf.price_per_hour}
            <span className="text-gray-400 font-normal text-xs sm:text-sm">
              /hour
            </span>
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/turf/${turf._id}`)
            }}
            className="w-full sm:w-auto px-4 py-2 border border-green-600 rounded-md text-green-400 text-sm sm:text-base hover:bg-green-600 hover:text-white transition"
          >
            Check slots →
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
      <div className="text-center text-gray-400 py-10">
        Loading turfs...
      </div>
    )

  if (error)
    return (
      <div className="text-center text-red-400 py-10">
        {error}
      </div>
    )

  if (turfs.length === 0)
    return (
      <div className="text-center text-gray-400 py-10">
        No turfs available
      </div>
    )

  return (
    <div className="bg-black rounded-3xl p-4 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {turfs.map((turf) => (
          <TurfCard key={turf._id} turf={turf} />
        ))}
      </div>
    </div>
  )
}

export default Card