
export default function ProfileLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-purple-200 to-pink-200 rounded-3xl p-6 animate-pulse">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-20 h-20 bg-white/30 rounded-3xl"></div>
          <div className="flex-1">
            <div className="h-6 bg-white/30 rounded-lg mb-2 w-2/3"></div>
            <div className="h-4 bg-white/20 rounded-lg mb-2 w-1/2"></div>
            <div className="h-3 bg-white/20 rounded-lg w-1/3"></div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/20 rounded-xl p-3 h-16"></div>
          ))}
        </div>
      </div>

      {/* Menu Skeletons */}
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-4 animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 w-1/3"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-lg w-2/3"></div>
            </div>
            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  )
}
