"use client"

import type React from "react"

import { Search, Shuffle, Bell, Settings } from "lucide-react"
import { Input } from "./ui/input"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { UserMenu } from "./user-menu"

const tabs = [
  { label: "Home", href: "/" }, // Changed "What's new?" to "Home"
  { label: "Trending", href: "/latest" },
  { label: "Music", href: "/music" },
  { label: "News", href: "/news" },
]

export function ModernHeader() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-[#1a1a2e] border-b border-gray-200 dark:border-gray-800">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between px-3 sm:px-6 py-2 md:py-2.5 gap-2 md:gap-0">
        <div className="hidden md:flex items-center gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => router.push(tab.href)}
              className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
          <form onSubmit={handleSearch} className="relative flex-1 md:flex-initial">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search musics, albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 w-full md:w-72 h-9 md:h-8 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg text-xs"
            />
          </form>

          <button className="hidden sm:flex p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors shrink-0">
            <Shuffle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>

          <button className="hidden md:flex p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors shrink-0">
            <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>

          <button className="hidden md:flex p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors shrink-0">
            <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="shrink-0">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  )
}
