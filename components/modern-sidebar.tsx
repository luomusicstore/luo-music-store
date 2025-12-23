"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Music2, Film, Newspaper, Moon, Sun, User, Home } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import Image from "next/image"

interface RecentlyPlayedTrack {
  id: string
  title: string
  source: string
  thumbnailUrl: string
  audioUrl: string
  audioDownloadUrl?: string
  isGoogleDriveAudio?: boolean
  category?: string
}

const libraryItems = [
  { name: "HOME", href: "/", icon: Home }, // Added HOME navigation
  { name: "MUSIC", href: "/music", icon: Music2 },
  { name: "NEWS", href: "/news", icon: Newspaper },
  { name: "MOVIES", href: "/movies", icon: Film },
]

export function ModernSidebar() {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-white dark:bg-[#1a1a2e] border-r border-gray-200 dark:border-gray-800 overflow-y-auto z-40 hidden lg:flex flex-col">
      <div className="flex items-center justify-center gap-2 px-3 py-4 border-b border-gray-200 dark:border-gray-800">
        <Image src="/logo.png" alt="Luo Music Store" width={48} height={48} className="rounded-full" />
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-900 dark:text-white">Luo Music Store</span>
          <span className="text-[10px] text-gray-600 dark:text-gray-400">Every Luo Vybs</span>
        </div>
      </div>

      <div className="px-4 pb-3 pt-3 flex-1">
        <nav className="space-y-0.5">
          {libraryItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? "text-gray-900 dark:text-white font-medium bg-gray-100 dark:bg-gray-800"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 space-y-1.5">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
        >
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          <span className="text-xs">{theme === "light" ? "Dark mode" : "Light mode"}</span>
        </button>

        <Link
          href="/profile"
          className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs text-gray-700 dark:text-gray-300">Profile</span>
        </Link>
      </div>
    </aside>
  )
}
