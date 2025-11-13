"use client"

const platforms = [
  { name: "Sites", icon: "🌐", color: "from-red-500 to-red-600" },
  { name: "WhatsApp", icon: "💬", color: "from-green-500 to-green-600" },
  { name: "VidGame", icon: "🎮", color: "from-amber-600 to-amber-700" },
  { name: "Facebook", icon: "📘", color: "from-blue-600 to-blue-700" },
  { name: "Instagram", icon: "📷", color: "from-purple-500 via-pink-500 to-orange-500" },
]

export function PlatformShortcuts() {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-screen-xl mx-auto flex items-center gap-4 px-4 py-4 overflow-x-auto no-scrollbar">
        {platforms.map((platform) => (
          <button key={platform.name} className="flex flex-col items-center gap-2 min-w-[72px] group">
            <div
              className={`w-14 h-14 bg-gradient-to-br ${platform.color} rounded-2xl flex items-center justify-center text-2xl shadow-md group-hover:shadow-lg transition-shadow`}
            >
              {platform.icon}
            </div>
            <span className="text-xs text-gray-700 font-medium">{platform.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
