"use client"

import type React from "react"
import { useAuth } from "@/hooks/useAuth"
import Image from "next/image"
import { Download, MoreVertical, Music, Share2, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { VideoPlayer } from "./video-player"
import { AudioPlayerModal } from "./audio-player-modal"
import { SubscriptionModal } from "./subscription-modal"

interface VideoCardProps {
  id: string
  title: string
  thumbnail: string
  duration: string
  source: string
  views?: string
  viewCount?: number
  label?: string
  videoUrl: string
  videoDownloadUrl?: string
  audioDownloadUrl?: string
  contentType?: string
  audioUrl?: string
}

export function VideoCard({
  id,
  title,
  thumbnail,
  duration,
  source,
  views,
  viewCount,
  label = "LYRICAL",
  videoUrl,
  videoDownloadUrl,
  audioDownloadUrl,
  contentType,
  audioUrl,
}: VideoCardProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const [showPlayer, setShowPlayer] = useState(false)
  const [showAudioPlayer, setShowAudioPlayer] = useState(false)
  const [showSubscription, setShowSubscription] = useState(false)

  const { user, hasActiveSubscription, isAdmin } = useAuth()

  const isMovie = contentType === "movie"
  const isMusicVideo = contentType === "video"
  const requiresSubscription = contentType === "audio" || isMovie || isMusicVideo

  const handleVideoDownload = () => {
    if (!user) {
      sessionStorage.setItem("pendingAction", JSON.stringify({ type: "download", contentId: id, contentType: "video" }))
      window.location.href = "/login"
      return
    }

    if (!hasActiveSubscription && !isAdmin) {
      setShowSubscription(true)
      return
    }

    if (videoDownloadUrl) {
      window.open(videoDownloadUrl, "_blank")
    } else {
      console.log("Download link not available")
    }
  }

  const handleAction = (action: string) => {
    console.log(`Action: ${action}`)
    setMoreOpen(false)
  }

  const handleCardClick = () => {
    if (contentType === "audio") {
      window.location.href = `/audio?id=${id}&autoplay=true`
    } else {
      setShowPlayer(true)
    }
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const handleAudioDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!user) {
      sessionStorage.setItem("pendingAction", JSON.stringify({ type: "download", contentId: id, contentType: "audio" }))
      window.location.href = "/login"
      return
    }

    if (!hasActiveSubscription && !isAdmin) {
      setShowSubscription(true)
      return
    }

    if (audioUrl) {
      const isR2Url = audioUrl.includes(".r2.dev")

      if (isR2Url) {
        try {
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
        } catch (error) {
          console.error("Download error:", error)
          window.open(audioDownloadUrl || audioUrl, "_blank")
        }
      } else {
        window.open(audioDownloadUrl || audioUrl, "_blank")
      }
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Listen to ${title} on Luo Music Store`,
          url: window.location.origin + `/audio?id=${id}`,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      navigator.clipboard.writeText(window.location.origin + `/audio?id=${id}`)
    }
  }

  const formatViews = (count?: number) => {
    if (!count) return "0 views"
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M views`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K views`
    return `${count} views`
  }

  const isAudio = contentType === "audio"

  if (isAudio) {
    return (
      <>
        {showSubscription && <SubscriptionModal isOpen={showSubscription} onClose={() => setShowSubscription(false)} />}

        <div
          className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
          onClick={handleCardClick}
        >
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              <Image src={thumbnail || "/placeholder.svg"} alt={title} fill className="object-cover rounded-full" />
              <div className="absolute inset-0 bg-black/40 hover:bg-black/50 rounded-full flex items-center justify-center transition-colors">
                <Music className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 line-clamp-1 mb-1">{title}</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="text-teal-600 font-medium">{source}</span>
                <span>•</span>
                <span>{formatViews(viewCount)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2" onClick={handleButtonClick}>
              <Button
                size="icon"
                onClick={handleAudioDownload}
                className="h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md"
              >
                <Download className="w-4 h-4" />
              </Button>

              <Button
                size="icon"
                variant="outline"
                onClick={handleShare}
                className="h-9 w-9 rounded-full border-gray-300 bg-transparent"
              >
                <Share2 className="w-4 h-4 text-gray-600" />
              </Button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {showPlayer && (
        <VideoPlayer
          title={title}
          thumbnail={thumbnail}
          videoUrl={videoUrl}
          videoDownloadUrl={videoDownloadUrl}
          audioDownloadUrl={audioDownloadUrl}
          onClose={() => setShowPlayer(false)}
        />
      )}

      {showAudioPlayer && (
        <AudioPlayerModal
          id={id}
          title={title}
          thumbnail={thumbnail}
          audioUrl={audioUrl || ""}
          audioDownloadUrl={audioDownloadUrl}
          onClose={() => setShowAudioPlayer(false)}
        />
      )}

      {showSubscription && user && (
        <SubscriptionModal
          open={showSubscription}
          onOpenChange={setShowSubscription}
          userId={user.uid}
          userEmail={user.email || ""}
          subscriptionType="movie"
        />
      )}

      <div
        className="bg-white overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleCardClick}
      >
        <div
          className={`relative ${isAudio ? "aspect-square" : "aspect-video"} bg-gray-100 overflow-hidden ${isAudio ? "rounded-full m-4" : "rounded-t-xl"}`}
        >
          <Image
            src={thumbnail || "/placeholder.svg"}
            alt={title}
            fill
            className={`object-cover ${isAudio ? "rounded-full" : ""}`}
          />

          {!isAudio && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent flex items-center justify-center">
                <div className="w-16 h-16 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                  <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-white border-b-[10px] border-b-transparent ml-1" />
                </div>
              </div>

              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-[10px] font-medium">
                + BHUSHAN KUMAR & T-SERIES PRESENTS
              </div>

              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <div className="bg-red-600 text-white px-2 py-1 rounded-md font-bold text-xs shadow-md">{label}</div>
                <div className="bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-md text-xs font-semibold">
                  HD VIDEO
                </div>
              </div>

              <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white px-2 py-1 rounded-md text-xs font-medium">
                {duration}
              </div>
            </>
          )}

          {isAudio && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Music className="w-12 h-12 text-white" />
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-900 leading-snug mb-2 line-clamp-2">{title}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-red-600 font-medium">📺 {source}</span>
              <span className="text-gray-500">• {formatViews(viewCount)}</span>
            </div>
            <div className="flex items-center gap-2" onClick={handleButtonClick}>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 hover:bg-gray-100 rounded-full"
                onClick={handleVideoDownload}
              >
                <Download className="w-4 h-4 text-gray-600" />
              </Button>

              <DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-gray-100 rounded-full">
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => handleAction("share")} className="cursor-pointer">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction("save")} className="cursor-pointer">
                    <Bookmark className="w-4 h-4 mr-2" />
                    Save
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
