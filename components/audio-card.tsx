"use client"

import type React from "react"
import Image from "next/image"
import { Download, Share2, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { SubscriptionModal } from "./subscription-modal"
import { doc, increment, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { GoogleDriveAudioPlayer } from "./google-drive-audio-player"

interface AudioCardProps {
  id: string
  title: string
  thumbnailUrl: string
  source: string
  duration: string
  audioUrl: string
  audioDownloadUrl: string
  viewCount?: number
  isGoogleDriveAudio?: boolean
}

export function AudioCard({
  id,
  title,
  thumbnailUrl,
  source,
  duration,
  audioUrl,
  audioDownloadUrl,
  viewCount = 0,
  isGoogleDriveAudio = false,
}: AudioCardProps) {
  const { user, hasActiveSubscription, isAdmin, signInWithGoogle } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [isPlaying, setIsPlaying] = useState(false)
  const [showSubscription, setShowSubscription] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const trackView = async () => {
      const viewedKey = `audio_viewed_${id}`
      const hasViewed = sessionStorage.getItem(viewedKey)

      if (!hasViewed && user) {
        try {
          const contentRef = doc(db, "content", id)
          await updateDoc(contentRef, {
            viewCount: increment(1),
          })
          sessionStorage.setItem(viewedKey, "true")
        } catch (error) {
          console.error("Error tracking view:", error)
        }
      }
    }

    trackView()
  }, [id, user])

  useEffect(() => {
    if (audioRef.current) {
      const handleDurationUpdate = async () => {
        if (audioRef.current && audioRef.current.duration && isFinite(audioRef.current.duration)) {
          const durationInSeconds = audioRef.current.duration
          const minutes = Math.floor(durationInSeconds / 60)
          const seconds = Math.floor(durationInSeconds % 60)
          const formattedDuration = `${minutes}:${seconds.toString().padStart(2, "0")}`

          // Only update if duration is different from placeholder "00:00"
          if (duration === "00:00" || !duration) {
            try {
              const contentRef = doc(db, "content", id)
              await updateDoc(contentRef, {
                duration: formattedDuration,
              })
              console.log("[v0] Updated audio duration:", formattedDuration)
            } catch (error) {
              console.error("[v0] Error updating audio duration:", error)
            }
          }
        }
      }

      audioRef.current.addEventListener("loadedmetadata", handleDurationUpdate)

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener("loadedmetadata", handleDurationUpdate)
        }
      }
    }
  }, [id, duration])

  const handlePlayPause = () => {
    console.log("[v0] Navigating to audio player with ID:", id)
    const params = new URLSearchParams({
      id,
      title,
      thumbnail: thumbnailUrl,
      audioUrl,
      audioDownloadUrl,
      isGoogleDrive: isGoogleDriveAudio.toString(),
    })
    router.push(`/audio-player?${params.toString()}`)
  }

  const handleCardClick = () => {
    console.log("[v0] Card clicked, navigating to audio player")
    const params = new URLSearchParams({
      id,
      title,
      thumbnail: thumbnailUrl,
      audioUrl,
      audioDownloadUrl,
      isGoogleDrive: isGoogleDriveAudio.toString(),
    })
    router.push(`/audio-player?${params.toString()}`)
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setTotalDuration(audioRef.current.duration)
    }
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!user) {
      console.log("[v0] User not logged in, redirecting to login page")
      sessionStorage.setItem(
        "pendingAction",
        JSON.stringify({ type: "download", contentId: id, contentType: "audio", audioDownloadUrl }),
      )
      window.location.href = "/login"
      return
    }

    if (!hasActiveSubscription && !isAdmin) {
      console.log("[v0] User has no active subscription")
      setShowSubscription(true)
      return
    }

    const isR2Url = audioUrl.includes(".r2.dev")

    if (isR2Url) {
      try {
        toast({
          title: "Download Starting",
          description: "Preparing your audio file...",
        })

        const filename = `${title}.mp3`

        const proxyUrl = `/api/download?url=${encodeURIComponent(audioUrl)}&filename=${encodeURIComponent(filename)}`

        const response = await fetch(proxyUrl)
        if (!response.ok) throw new Error("Download failed")

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = filename

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        toast({
          title: "Download Complete",
          description: "Your audio file has been downloaded.",
        })
      } catch (error) {
        console.error("Download error:", error)
        toast({
          title: "Download Failed",
          description: "Could not download the file. Please try again.",
          variant: "destructive",
        })
      }
    } else {
      const downloadUrl = audioDownloadUrl || audioUrl
      window.open(downloadUrl, "_blank")
      toast({
        title: "Opening Download",
        description: "Opening the download link in a new tab.",
      })
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()

    const websiteLink = window.location.origin

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Listen to ${title} on Luo Music Store`,
          url: websiteLink,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      navigator.clipboard.writeText(websiteLink)
      toast({
        title: "Link Copied",
        description: "Website link copied to clipboard.",
      })
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const formatViews = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M views`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K views`
    return `${count} views`
  }

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0

  return (
    <>
      {showSubscription && user && (
        <SubscriptionModal
          open={showSubscription}
          onOpenChange={setShowSubscription}
          userId={user.uid}
          userEmail={user.email || ""}
        />
      )}

      {audioUrl && !isGoogleDriveAudio && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {audioUrl && isGoogleDriveAudio && (
        <div className="hidden">
          <GoogleDriveAudioPlayer
            driveUrl={audioUrl}
            onTimeUpdate={(time) => setCurrentTime(time)}
            onDurationChange={(dur) => setTotalDuration(dur)}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        </div>
      )}

      <div
        className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
        data-audio-id={id}
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            <Image src={thumbnailUrl || "/placeholder.svg"} alt={title} fill className="object-cover rounded-full" />
            <button
              onClick={(e) => {
                e.stopPropagation()
                handlePlayPause()
              }}
              data-play-button
              className="absolute inset-0 bg-black/40 hover:bg-black/50 rounded-full flex items-center justify-center transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white fill-white" />
              ) : (
                <Play className="w-6 h-6 text-white fill-white ml-0.5" />
              )}
            </button>
          </div>

          {/* Audio Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 line-clamp-1 mb-1">{title}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <span className="text-teal-600 font-medium">{source}</span>
              <span>•</span>
              <span>{formatViews(viewCount)}</span>
            </div>

            <div className="relative w-full h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-blue-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{duration}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 relative z-10">
            <Button
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                handleDownload(e)
              }}
              className="h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md pointer-events-auto cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </Button>

            <Button
              size="icon"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                handleShare(e)
              }}
              className="h-9 w-9 rounded-full border-gray-300 bg-transparent pointer-events-auto cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-gray-600" />
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
