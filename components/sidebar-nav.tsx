"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Film, Music, Newspaper, ChevronDown } from "lucide-react"
import { useState } from "react"
import Image from "next/image"

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Movies", href: "/movies", icon: Film },
  {
    name: "Music",
    href: "/music",
    icon: Music,
    subItems: [
      { name: "Music Video", href: "/music-video" },
      { name: "Audio", href: "/audio" },
    ],
  },
  {
    name: "News",
    href: "/news",
    icon: Newspaper,
  },
]

export function SidebarNav() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(["Music"])

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]))
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200/70 overflow-y-auto z-40 hidden lg:block">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3 mb-8">
          <Image src="/logo.png" alt="Luo Music Store" width={50} height={50} className="rounded-full" />
          <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Luo Music
          </span>
        </Link>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const hasSubItems = item.subItems && item.subItems.length > 0
            const isExpanded = expandedItems.includes(item.name)
            const isSubItemActive = item.subItems?.some((sub) => pathname === sub.href)

            return (
              <div key={item.name}>
                <Link
                  href={item.href}
                  onClick={(e) => {
                    if (hasSubItems) {
                      e.preventDefault()
                      toggleExpand(item.name)
                    }
                  }}
                  className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive || isSubItemActive
                      ? "bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  {hasSubItems && (
                    <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  )}
                </Link>

                {hasSubItems && isExpanded && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={`block px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                          pathname === subItem.href
                            ? "bg-purple-50 text-purple-700 font-medium"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
