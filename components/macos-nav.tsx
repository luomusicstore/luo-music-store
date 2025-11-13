"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Film, MusicIcon, Headphones } from "lucide-react"

const navItems = [
  { name: "HOME", href: "/", icon: Home },
  { name: "LATEST", href: "/latest", icon: Film },
  { name: "VIDEO", href: "/music", icon: MusicIcon },
  { name: "AUDIO", href: "/audio", icon: Headphones },
]

export function MacOSNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
      <div className="max-w-screen-xl mx-auto px-2">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 ${
                  isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className={`transition-all duration-200 ${isActive ? "scale-110" : ""}`}>
                  <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-medium tracking-wide ${isActive ? "font-semibold" : ""}`}>
                  {item.name}
                </span>
                {isActive && <div className="absolute bottom-0 w-12 h-1 bg-blue-600 rounded-t-full" />}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
