"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const categories = [
  { name: "Featured", path: "/" },
  { name: "Video", path: "/music" },
  { name: "Latest", path: "/latest" },
  { name: "Audio", path: "/audio" },
]

export function CategoryTabs() {
  const pathname = usePathname()

  return (
    <div className="sticky top-[73px] z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/70">
      <div className="max-w-screen-xl mx-auto flex overflow-x-auto no-scrollbar">
        {categories.map((category) => {
          const isActive = pathname === category.path

          return (
            <Link
              key={category.name}
              href={category.path}
              className={`px-6 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${
                isActive ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {category.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
