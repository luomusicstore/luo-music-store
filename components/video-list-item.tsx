"use client"

import type React from "react"
import Image from "next/image"
import { Download, MoreVertical, Share2, Bookmark, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { VideoPlayer } from "./video-player"
import { useAuth } from "@/lib/auth-context"
import { SubscriptionModal } from "./subscription-modal"
import { useRouter } from "next/navigation"

interface VideoListItemProps {
  id: string
  title: string
  thumbnail: string
  duration: string
  source: string
  views?: string
  viewCount?: number
  videoUrl: string
  videoDownloadUrl?: string
  audioDownloadUrl?: string
  contentType?: string
  audioUrl?: string
  forceGoogleDrive?: boolean
}

export function VideoListItem({
  id,
  title,
  thumbnail,
  duration,
  source,
  views,
  viewCount,
  videoUrl,
  videoDownloadUrl,
  audioDownloadUrl,
  contentType,
  audioUrl,
  forceGoogleDrive = false,
}: VideoListItemProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const [showPlayer, setShowPlayer] = useState(false)
  const { user, hasActiveSubscription, isAdmin } = useAuth()
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const router = useRouter()

  const isMovie = contentType === "movie"
  const isMusicVideo = contentType === "video"
  const requiresSubscription = isMovie || isMusicVideo

  const handleVideoDownload = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!user) {
      sessionStorage.setItem("pendingAction", JSON.stringify({ type: "download", contentId: id, contentType: "video" }))
      window.location.href = "/login"
      return
    }

    if (!hasActiveSubscription && !isAdmin) {
      setShowSubscriptionModal(true)
      return
    }

    if (videoDownloadUrl) {
      window.open(videoDownloadUrl, "_blank")
    } else {
      alert("Video download link not available")
    }
  }

  const handleAction = (action: string) => {
    console.log(`Action: ${action}`)
    setMoreOpen(false)
  }

  const handleCardClick = () => {
    if (contentType === "audio") {
      const params = new URLSearchParams({
        id,
        title,
        thumbnail,
        audioUrl: audioUrl || "",
        audioDownloadUrl: audioDownloadUrl || "",
      })
      router.push(`/audio-player?${params.toString()}`)
    } else {
      setShowPlayer(true)
    }
  }

  const handleAudioDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!user) {
      sessionStorage.setItem("pendingAction", JSON.stringify({ type: "download", contentId: id, contentType: "audio" }))
      window.location.href = "/login"
      return
    }

    if (!hasActiveSubscription && !isAdmin) {
      setShowSubscriptionModal(true)
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
          window.open(audioUrl, "_blank")
        }
      } else {
        window.open(audioUrl, "_blank")
      }
    }
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
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
        {showSubscriptionModal && user && (
          <SubscriptionModal
            open={showSubscriptionModal}
            onOpenChange={setShowSubscriptionModal}
            userId={user.uid}
            userEmail={user.email || ""}
          />
        )}

        <div
          className="flex gap-3 hover:bg-muted/50 rounded-lg p-2 cursor-pointer group bg-white"
          onClick={handleCardClick}
        >
          <div className="relative w-16 h-16 flex-shrink-0">
            <Image
              src={thumbnail || "/placeholder.svg"}
              alt={title}
              fill
              className="object-cover rounded-full group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-medium line-clamp-2 mb-1 leading-snug">{title}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-teal-600 font-medium">{source}</span>
                <span>•</span>
                <span>{formatViews(viewCount)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2" onClick={handleButtonClick}>
            <Button
              size="icon"
              onClick={handleAudioDownload}
              className="h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
            </Button>

            <Button
              size="icon"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                const websiteLink = window.location.origin
                if (navigator.share) {
                  navigator.share({
                    title: title,
                    text: `Check out ${title} on Luo Music Store`,
                    url: websiteLink,
                  })
                }
              }}
              className="h-8 w-8 rounded-full border-gray-300 bg-transparent"
            >
              <Share2 className="w-3.5 h-3.5 text-gray-600" />
            </Button>
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
          forceGoogleDrive={forceGoogleDrive}
        />
      )}

      {showSubscriptionModal && user && (
        <SubscriptionModal
          open={showSubscriptionModal}
          onOpenChange={setShowSubscriptionModal}
          userId={user.uid}
          userEmail={user.email || ""}
          subscriptionType={isMovie ? "movie" : "general"}
        />
      )}

      <div
        className="flex gap-2 hover:bg-muted/50 rounded-lg p-1.5 md:p-2 cursor-pointer group bg-white"
        onClick={handleCardClick}
      >
        <div
          className={`relative flex-shrink-0 ${isAudio ? "w-16 h-16 md:w-20 md:h-20" : "w-24 md:w-32"} ${isAudio ? "rounded-full" : "aspect-video rounded-md md:rounded-lg"} overflow-hidden bg-muted`}
        >
          <Image
            src={thumbnail || "/placeholder.svg"}
            alt={title}
            fill
            className={`object-cover group-hover:scale-105 transition-transform duration-200 ${isAudio ? "rounded-full" : ""}`}
          />

          {isAudio && (
            <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center">
              <Music className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
          )}

          {!isAudio && (
            <div className="absolute bottom-0.5 right-0.5 md:bottom-1 md:right-1 bg-black/80 text-white text-[10px] md:text-xs px-1 md:px-1.5 py-0.5 rounded">
              {duration}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="text-xs md:text-sm font-medium line-clamp-2 mb-0.5 md:mb-1 leading-snug">{title}</h3>
            <div className="flex flex-col gap-0">
              <p className="text-[10px] md:text-xs text-muted-foreground">{source}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">{formatViews(viewCount)}</p>
              {isAudio && <p className="text-[10px] md:text-xs text-blue-600 font-medium">{duration}</p>}
            </div>
          </div>

          <div className="flex items-center gap-0.5 mt-1" onClick={handleButtonClick}>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 md:h-7 md:w-7 hover:bg-gray-100 rounded-full"
              onClick={handleVideoDownload}
            >
              <Download className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-600" />
            </Button>

            <DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-6 w-6 md:h-7 md:w-7 hover:bg-gray-100 rounded-full">
                  <MoreVertical className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => handleAction("download")} className="cursor-pointer">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </DropdownMenuItem>
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
    </>
  )
}
