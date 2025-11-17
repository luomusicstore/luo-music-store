"use client"

import { useAuth } from "@/lib/auth-context"
import { SearchHeader } from "@/components/search-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { redirect } from 'next/navigation'
import { useState, useEffect } from "react"
import { SubscriptionModal } from "@/components/subscription-modal"
import { Check, CreditCard } from 'lucide-react'

export default function SettingsPage() {
  const { user, signOut, hasActiveSubscription } = useAuth()
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

  if (!user) {
    redirect("/")
  }

  useEffect(() => {
    const pendingDownload = sessionStorage.getItem("pendingDownload")
    if (pendingDownload && !hasActiveSubscription) {
      setShowSubscriptionModal(true)
    }
  }, [hasActiveSubscription])

  const subscriptionPlans = [
    { duration: "1 Day", price: 1000, value: "day" },
    { duration: "1 Week", price: 3000, value: "week" },
    { duration: "1 Month", price: 5000, value: "month" }
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
      <SearchHeader />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <Card className="p-6 mb-4 border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-green-900">Subscription Status</h2>
              <p className="text-sm text-green-700 mt-1">
                {hasActiveSubscription ? "You have an active subscription" : "Subscribe to download content"}
              </p>
            </div>
            <CreditCard className="w-8 h-8 text-green-600" />
          </div>

          {hasActiveSubscription ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-700">
                <Check className="w-5 h-5" />
                <span className="font-medium">Premium Member</span>
              </div>
              <div className="bg-white rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Unlimited video downloads</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Unlimited audio downloads</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Ad-free experience</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {subscriptionPlans.map((plan) => (
                  <div key={plan.value} className="bg-white rounded-lg p-4 border-2 border-green-300">
                    <p className="text-2xl font-bold text-green-700 text-center mb-1">
                      {plan.price.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 text-center font-medium">UGX</p>
                    <p className="text-xs text-gray-600 text-center mt-2">{plan.duration}</p>
                  </div>
                ))}
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Unlimited video downloads</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Unlimited audio downloads</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Ad-free experience</span>
                </li>
              </ul>
              <Button
                onClick={() => setShowSubscriptionModal(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Subscribe Now
              </Button>
            </div>
          )}
        </Card>

        <Card className="p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4">Account</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Signed in as {user.email}</p>
              <Button onClick={signOut} variant="destructive">
                Sign Out
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Preferences</h2>
          <p className="text-sm text-gray-600">More settings coming soon...</p>
        </Card>
      </div>

      <SubscriptionModal
        open={showSubscriptionModal}
        onOpenChange={setShowSubscriptionModal}
        userId={user.uid}
        userEmail={user.email || ""}
      />
    </div>
  )
}
