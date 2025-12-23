"use client"

import type React from "react"
import { X, Download, ThumbsUp, Share2, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { SubscriptionModal } from "./subscription-modal"
import { doc, increment, updateDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface AudioPlayerModalProps {
  id: string
  title: string
  thumbnail: string
  audioUrl: string
  audioDownloadUrl?: string
  onClose: () => void
}

export function AudioPlayerModal({ id, title, thumbnail, audioUrl, audioDownloadUrl, onClose }: AudioPlayerModalProps) {
  const { user, hasActiveSubscription, isAdmin } = useAuth()
  const { toast } = useToast()
  const [showSubscription, setShowSubscription] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [volume, setVolume] = useState(100)
  const [isMuted, setIsMuted] = useState(false)
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

    const fetchLikes = async () => {
      try {
        const contentRef = doc(db, "content", id)
        const docSnap = await getDoc(contentRef)
        if (docSnap.exists()) {
          setLikesCount(docSnap.data().likesCount || 0)
        }
      } catch (error) {
        console.error("Error fetching likes:", error)
      }
    }

    trackView()
    fetchLikes()

    if (audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }, [id, user])

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleDownload = async () => {
    if (!user) {
      sessionStorage.setItem("pendingAction", JSON.stringify({ type: "download", contentId: id, contentType: "audio" }))
      window.location.href = "/profile"
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
        window.open(audioUrl, "_blank")
        toast({
          title: "Opening Download",
          description: "Opening the download link in a new tab.",
        })
      }
    }
  }

  const handleLike = async () => {
    if (!user) {
      sessionStorage.setItem("pendingAction", JSON.stringify({ type: "like", contentId: id, contentType: "audio" }))
      window.location.href = "/profile"
      return
    }

    try {
      const contentRef = doc(db, "content", id)
      if (!liked) {
        await updateDoc(contentRef, {
          likesCount: increment(1),
        })
        setLikesCount((prev) => prev + 1)
      }
      setLiked(!liked)
    } catch (error) {
      console.error("Error updating likes:", error)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Listen to ${title}`,
          url: window.location.href,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link Copied",
        description: "Share link copied to clipboard.",
      })
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100
      if (newVolume === 0) {
        setIsMuted(true)
      } else if (isMuted) {
        setIsMuted(false)
      }
    }
  }

  const handleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.muted = false
        setIsMuted(false)
      } else {
        audioRef.current.muted = true
        setIsMuted(true)
      }
    }
  }

  const skipTime = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <>
      {showSubscription && <SubscriptionModal isOpen={showSubscription} onClose={() => setShowSubscription(false)} />}

      <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors z-10"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Audio Player Card */}
        <div className="w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Album Art */}
          <div className="relative w-full aspect-square">
            <Image src={thumbnail || "/placeholder.svg"} alt={title} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>

          {/* Player Controls */}
          <div className="p-6 space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Slider
                value={[currentTime]}
                max={duration || 0}
                step={0.1}
                onValueChange={(value) => {
                  const newTime = value[0]
                  if (audioRef.current) {
                    audioRef.current.currentTime = newTime
                    setCurrentTime(newTime)
                  }
                }}
                className="w-full [&_[role=slider]]:bg-white [&_[role=slider]]:border-white"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex justify-center items-center gap-2">
              <Button
                size="icon"
                onClick={() => skipTime(-15)}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white"
                title="Skip back 15 seconds"
              >
                <SkipBack className="w-4 h-4" />
              </Button>

              <button
                onClick={handlePlayPause}
                className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-black" fill="black" />
                ) : (
                  <Play className="w-6 h-6 text-black ml-1" fill="black" />
                )}
              </button>

              <Button
                size="icon"
                onClick={() => skipTime(15)}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white"
                title="Skip forward 15 seconds"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  onClick={handleMute}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Slider
                  value={[volume]}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="flex-1 [&_[role=slider]]:bg-white [&_[role=slider]]:border-white"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLiked(!liked)
                  if (!liked) setLikesCount(likesCount + 1)
                }}
                className="text-white hover:bg-white/10 gap-2"
              >
                <ThumbsUp className={`w-4 h-4 ${liked ? "fill-white" : ""}`} />
                <span className="text-sm">{formatNumber(liked ? likesCount : likesCount - 1)}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="text-white hover:bg-white/10 gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Download</span>
              </Button>

              <Button variant="ghost" size="sm" onClick={handleShare} className="text-white hover:bg-white/10 gap-2">
                <Share2 className="w-4 h-4" />
                <span className="text-sm">Share</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
      </div>
    </>
  )
}
