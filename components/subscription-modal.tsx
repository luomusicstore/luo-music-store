"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, X, Smartphone, Crown, Loader2, AlertCircle } from "lucide-react"
import { requestPayment, checkRequestStatus } from "@/lib/payment-api"
import { doc, setDoc, collection, addDoc, increment } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface SubscriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userEmail: string
  subscriptionType?: "general" | "movie"
}

export function SubscriptionModal({
  open,
  onOpenChange,
  userId,
  userEmail,
  subscriptionType = "general",
}: SubscriptionModalProps) {
  const [phone, setPhone] = useState("")
  const [selectedPlan, setSelectedPlan] = useState<"day" | "week" | "month">(
    subscriptionType === "movie" ? "day" : "month",
  )
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "pending" | "success" | "failed">("idle")
  const [statusMessage, setStatusMessage] = useState("")
  const [internalReference, setInternalReference] = useState("")
  const [customerReference, setCustomerReference] = useState("")

  useEffect(() => {
    let intervalId: NodeJS.Timeout
    let checkCount = 0
    const maxChecks = 60 // Check for 5 minutes max (60 * 5s = 300s)

    if (paymentStatus === "pending" && internalReference) {
      console.log("[v0] Starting payment status polling for:", internalReference)

      intervalId = setInterval(async () => {
        checkCount++
        console.log("[v0] Checking payment status, attempt:", checkCount)

        const status = await checkRequestStatus(internalReference)
        console.log("[v0] Payment callback response:", status)

        const relworxData = status.relworx || status
        const requestStatus = relworxData.request_status || status.request_status
        const paymentSuccessStatus = relworxData.status || status.status

        if (status.success && paymentSuccessStatus === "success" && requestStatus === "success") {
          console.log("[v0] Payment completed successfully!")
          setPaymentStatus("success")
          setStatusMessage(relworxData.message || "Payment completed successfully!")
          await activateSubscription(relworxData)
          clearInterval(intervalId)
        } else if (requestStatus === "failed" || paymentSuccessStatus === "failed") {
          console.log("[v0] Payment failed:", relworxData.message)
          setPaymentStatus("failed")
          setStatusMessage(relworxData.message || "Payment failed. Please try again.")
          clearInterval(intervalId)
        } else if (checkCount >= maxChecks) {
          console.log("[v0] Payment check timeout")
          setPaymentStatus("failed")
          setStatusMessage("Payment verification timeout. Please contact support if amount was deducted.")
          clearInterval(intervalId)
        } else {
          // Still pending
          console.log("[v0] Payment still pending...")
        }
      }, 5000)
    }

    return () => {
      if (intervalId) {
        console.log("[v0] Clearing payment status interval")
        clearInterval(intervalId)
      }
    }
  }, [paymentStatus, internalReference])

  const activateSubscription = async (callbackData: any) => {
    try {
      console.log("[v0] Activating subscription with callback data:", callbackData)

      const startDate = new Date()
      const endDate = new Date()
      if (selectedPlan === "day") {
        endDate.setDate(endDate.getDate() + 1) // 1 day
      } else if (selectedPlan === "week") {
        endDate.setDate(endDate.getDate() + 7) // 1 week
      } else {
        endDate.setMonth(endDate.getMonth() + 1) // 1 month
      }

      const planAmount = selectedPlan === "day" ? 1000 : selectedPlan === "week" ? 3000 : 5000

      await setDoc(
        doc(db, "users", userId),
        {
          subscription: {
            isActive: true,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            amount: callbackData.amount || planAmount,
            currency: callbackData.currency || "UGX",
            provider: callbackData.provider || "mobile_money",
            phoneNumber: callbackData.msisdn || phone,
            internalReference: callbackData.internal_reference,
            customerReference: callbackData.customer_reference || customerReference,
            providerTransactionId: callbackData.provider_transaction_id || "N/A",
            completedAt: callbackData.completed_at || new Date().toISOString(),
            charge: callbackData.charge || 0,
          },
          lastUpdated: new Date().toISOString(),
        },
        { merge: true },
      )

      console.log("[v0] Subscription saved to Firestore successfully!")

      const walletRef = doc(db, "wallet", "admin")
      const paymentAmount = callbackData.amount || planAmount

      await setDoc(
        walletRef,
        {
          balance: increment(paymentAmount),
          currency: "UGX",
          lastUpdated: new Date().toISOString(),
        },
        { merge: true },
      )

      console.log("[v0] Admin wallet updated successfully!")

      await addDoc(collection(db, "transactions"), {
        type: "deposit",
        amount: paymentAmount,
        currency: callbackData.currency || "UGX",
        date: new Date().toISOString(),
        description: `Subscription payment from user ${userEmail}`,
        userId: userId,
        userEmail: userEmail,
        internalReference: callbackData.internal_reference,
        providerTransactionId: callbackData.provider_transaction_id || "N/A",
        provider: callbackData.provider || "mobile_money",
        customerReference: callbackData.customer_reference || customerReference,
      })

      console.log("[v0] Transaction record created successfully!")
      console.log("[v0] Full subscription activation complete!")

      const pendingDownload = sessionStorage.getItem("pendingDownload")
      if (pendingDownload) {
        try {
          const downloadAction = JSON.parse(pendingDownload)
          sessionStorage.removeItem("pendingDownload")

          // Wait a bit for subscription state to update
          setTimeout(() => {
            if (downloadAction.audioDownloadUrl) {
              window.open(downloadAction.audioDownloadUrl, "_blank")
            }
            // Redirect back to the content
            window.location.reload()
          }, 2000)
        } catch (error) {
          console.error("Error resuming download:", error)
          // Still reload even if download fails
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        }
      } else {
        // No pending download, just reload to update subscription state
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (error) {
      console.error("[v0] Error activating subscription:", error)
      setPaymentStatus("failed")
      setStatusMessage("Failed to activate subscription. Please contact support.")
    }
  }

  const handleSubscribe = async () => {
    if (!phone || phone.length < 10) {
      setStatusMessage("Please enter a valid phone number")
      return
    }

    setIsProcessing(true)
    setStatusMessage("")
    setPaymentStatus("idle")

    try {
      const formattedPhone = phone.startsWith("+256") ? phone : `+256${phone.replace(/^0/, "")}`

      const amount = selectedPlan === "day" ? 1000 : selectedPlan === "week" ? 3000 : 5000
      const finalAmount = subscriptionType === "movie" ? 3000 : amount
      const description =
        subscriptionType === "movie"
          ? "Movie Download Subscription - 1 Day"
          : selectedPlan === "day"
            ? "Premium Subscription - 1 Day"
            : selectedPlan === "week"
              ? "Premium Subscription - 1 Week"
              : "Premium Subscription - 1 Month"

      console.log("[v0] Requesting payment for:", formattedPhone)
      const response = await requestPayment(formattedPhone, finalAmount, description)

      console.log("[v0] Payment request response:", response)

      if (response.success && response.relworx) {
        if (response.relworx.success && response.relworx.internal_reference) {
          setInternalReference(response.relworx.internal_reference)
          setCustomerReference(response.reference || "")
          setPaymentStatus("pending")
          setStatusMessage(response.relworx.message || "Payment request initiated. Check your phone.")
        } else {
          setPaymentStatus("failed")
          const errorMsg = response.relworx.message || "Payment initiation failed"
          setStatusMessage(errorMsg)

          if (response.relworx.error_code === "INVALID_IP") {
            setStatusMessage("IP address not authorized. Please contact support.")
          } else if (errorMsg.toLowerCase().includes("insufficient")) {
            setStatusMessage("Insufficient balance. Please top up and try again.")
          }
        }
      } else {
        setPaymentStatus("failed")
        setStatusMessage(response.message || response.error || "Payment request failed. Please try again.")
      }
    } catch (error: any) {
      console.error("[v0] Error processing payment:", error)
      setPaymentStatus("failed")
      setStatusMessage("Network error. Please check your connection and try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const resetModal = () => {
    setPhone("")
    setSelectedPlan("month")
    setPaymentStatus("idle")
    setStatusMessage("")
    setInternalReference("")
    setCustomerReference("")
    setIsProcessing(false)
  }

  const handleClose = () => {
    resetModal()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[340px] p-4 bg-gradient-to-b from-green-50 to-white border-green-200">
        <DialogTitle className="sr-only">Premium Subscription</DialogTitle>
        <DialogDescription className="sr-only">Subscribe to unlock unlimited downloads</DialogDescription>

        <button
          onClick={handleClose}
          className="absolute right-2 top-2 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors z-50"
          aria-label="Close dialog"
        >
          <X className="w-3 h-3 text-white" />
        </button>

        <div className="space-y-2 text-center pt-1">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Premium</h2>
            <p className="text-xs text-gray-600">Unlock unlimited downloads</p>
          </div>
        </div>

        <div className="space-y-3 py-2">
          {paymentStatus === "idle" && (
            <>
              {subscriptionType === "movie" ? (
                <div className="flex justify-center">
                  <div className="rounded-lg p-3 border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 w-full">
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-900">3,000 UGX</p>
                      <p className="text-xs text-gray-600">1 Day Access</p>
                      <p className="text-[10px] text-gray-500 mt-1">Movie Downloads</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedPlan("day")}
                    className={`flex-1 rounded-lg p-2.5 border-2 transition-all ${
                      selectedPlan === "day"
                        ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50"
                        : "border-gray-200 bg-white hover:border-green-200"
                    }`}
                  >
                    <div className="text-center">
                      <p className="text-base font-bold text-gray-900">1,000</p>
                      <p className="text-[10px] text-gray-600">1 Day</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedPlan("week")}
                    className={`flex-1 rounded-lg p-2.5 border-2 transition-all ${
                      selectedPlan === "week"
                        ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50"
                        : "border-gray-200 bg-white hover:border-green-200"
                    }`}
                  >
                    <div className="text-center">
                      <p className="text-base font-bold text-gray-900">3,000</p>
                      <p className="text-[10px] text-gray-600">1 Week</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedPlan("month")}
                    className={`flex-1 rounded-lg p-2.5 border-2 transition-all ${
                      selectedPlan === "month"
                        ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50"
                        : "border-gray-200 bg-white hover:border-green-200"
                    }`}
                  >
                    <div className="text-center">
                      <p className="text-base font-bold text-gray-900">5,000</p>
                      <p className="text-[10px] text-gray-600">1 Month</p>
                    </div>
                  </button>
                </div>
              )}

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                    {subscriptionType === "movie"
                      ? "UGX 3,000"
                      : selectedPlan === "day"
                        ? "UGX 1,000"
                        : selectedPlan === "week"
                          ? "UGX 3,000"
                          : "UGX 5,000"}
                  </p>
                  <p className="text-xs text-gray-600">
                    {subscriptionType === "movie"
                      ? "per day"
                      : selectedPlan === "day"
                        ? "per day"
                        : selectedPlan === "week"
                          ? "per week"
                          : "per month"}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                  <Smartphone className="w-3 h-3" />
                  Mobile Money Number
                </label>
                <Input
                  type="tel"
                  placeholder="+256 700 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-9 text-sm bg-gray-50 border-gray-300"
                />
                <p className="text-[10px] text-gray-500">MTN or Airtel to receive payment prompt</p>
              </div>

              {statusMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700 flex items-start gap-1.5">
                  <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>{statusMessage}</span>
                </div>
              )}

              <Button
                onClick={handleSubscribe}
                disabled={isProcessing || !phone}
                className="w-full h-9 text-sm bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Subscribe Now"
                )}
              </Button>
            </>
          )}

          {paymentStatus === "pending" && (
            <div className="text-center space-y-3 py-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Payment Pending</h3>
                <p className="text-xs text-gray-600 mt-1.5">
                  {statusMessage || "Check your phone and enter PIN to complete payment."}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">Waiting for confirmation...</p>
                {customerReference && <p className="text-[10px] text-gray-400 mt-1">Ref: {customerReference}</p>}
              </div>
            </div>
          )}

          {paymentStatus === "success" && (
            <div className="text-center space-y-3 py-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Payment Successful!</h3>
                <p className="text-xs text-gray-600 mt-1.5">{statusMessage}</p>
                <p className="text-[10px] text-gray-500 mt-1">Subscription activated. Refreshing...</p>
              </div>
            </div>
          )}

          {paymentStatus === "failed" && (
            <div className="text-center space-y-3 py-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Payment Failed</h3>
                <p className="text-xs text-gray-600 mt-1.5 px-2">{statusMessage}</p>
              </div>
              <Button
                onClick={resetModal}
                variant="outline"
                className="mt-2 h-8 text-xs border-gray-300 hover:bg-gray-50 bg-transparent"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
