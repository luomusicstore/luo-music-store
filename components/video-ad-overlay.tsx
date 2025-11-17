"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoAdOverlayProps {
  onSkip: () => void
  skipDelay?: number
}

export function VideoAdOverlay({ onSkip, skipDelay = 5 }: VideoAdOverlayProps) {
  const [countdown, setCountdown] = useState(skipDelay)
  const [canSkip, setCanSkip] = useState(false)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      setCanSkip(true)
    }
  }, [countdown])

  return (
    <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center">
      {/* Ad Container */}
      <div className="w-full h-full flex flex-col items-center justify-center relative">
        {/* Ad Content - This is where the ad script will render ads */}
        <div id="video-ad-container" className="w-full h-full flex items-center justify-center">
          <div className="text-center text-white p-8">
            <div className="text-lg mb-2">Advertisement</div>
            <div className="text-sm text-white/70">Please wait while we show you this ad</div>
          </div>
        </div>

        {/* Skip Button */}
        <div className="absolute top-4 right-4 z-10">
          {canSkip ? (
            <Button
              onClick={onSkip}
              size="sm"
              className="bg-black/80 hover:bg-black text-white rounded-md px-4 py-2 font-semibold"
            >
              Skip Ad
              <X className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <div className="bg-black/80 text-white rounded-md px-4 py-2 text-sm font-medium">Skip in {countdown}s</div>
          )}
        </div>
      </div>
    </div>
  )
}
