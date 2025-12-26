import { useNavigate } from 'react-router-dom'

export default function FeaturedCreator({ creator }) {
  const navigate = useNavigate()

  if (!creator) return null

  return (
    <div className="bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 rounded-lg p-6 mb-6 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-pink-200 rounded-full opacity-20 -mr-12 -mt-12"></div>

      {/* Pinned badge */}
      <div className="absolute top-4 right-4 flex items-center gap-1 bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
        <span>✨</span>
        <span>Featured</span>
      </div>

      <div className="relative z-10">
        {/* Header with avatar */}
        <div className="flex items-center gap-4 mb-4">
          <img
            src={creator.avatar}
            alt={creator.displayName}
            className="w-16 h-16 rounded-full border-2 border-white shadow-md"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-900">{creator.displayName}</h3>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                {creator.tier}
              </span>
            </div>
            <p className="text-sm text-gray-600">@{creator.handle}</p>
          </div>
        </div>

        {/* Bio excerpt */}
        <p className="text-gray-700 text-sm mb-3 line-clamp-2">{creator.bio}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {creator.genres.slice(0, 2).map((genre) => (
            <span key={genre} className="px-2 py-1 bg-white text-gray-700 text-xs rounded-full">
              {genre}
            </span>
          ))}
          {creator.genres.length > 2 && (
            <span className="px-2 py-1 bg-white text-gray-600 text-xs rounded-full">
              +{creator.genres.length - 2} more
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4 py-3 bg-white rounded-lg">
          <div className="text-center">
            <p className="font-bold text-gray-900">{creator.stats.followers}</p>
            <p className="text-xs text-gray-600">Followers</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-900">{creator.stats.posts}</p>
            <p className="text-xs text-gray-600">Posts</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-900">{creator.stats.tracks}</p>
            <p className="text-xs text-gray-600">Tracks</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/creator/${creator.id}`)}
            className="flex-1 px-4 py-2 bg-pink-500 text-white font-semibold rounded-full hover:bg-pink-600 transition"
          >
            View Profile
          </button>
          <button className="flex-1 px-4 py-2 bg-white text-pink-600 font-semibold rounded-full border-2 border-pink-200 hover:bg-pink-50 transition">
            Follow
          </button>
        </div>
      </div>
    </div>
  )
}
