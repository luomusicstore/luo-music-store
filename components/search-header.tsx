"use client"

import type React from "react"

import { Search, Crown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { SubscriptionModal } from "./subscription-modal"
import { useRouter } from "next/navigation"

export function SearchHeader() {
  const { user, hasActiveSubscription, isAdmin } = useAuth()
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <>
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-200/70 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 py-3">
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <div className="flex-1 relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search or enter url"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 h-11 bg-gray-50/80 border-gray-200 rounded-xl text-sm focus-visible:ring-blue-500 w-full"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {user && !hasActiveSubscription && !isAdmin && (
                <Button
                  onClick={() => setShowSubscriptionModal(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold shadow-lg hidden sm:flex items-center gap-2"
                >
                  <Crown className="w-4 h-4" />
                  Subscribe
                </Button>
              )}
              {user && (hasActiveSubscription || isAdmin) && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-1.5 rounded-full font-semibold hidden sm:flex items-center gap-1.5 text-sm shadow-md">
                  <Crown className="w-4 h-4" />
                  Premium
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {user && (
        <SubscriptionModal
          open={showSubscriptionModal}
          onOpenChange={setShowSubscriptionModal}
          userId={user.uid}
          userEmail={user.email || ""}
        />
      )}
    </>
  )
}
