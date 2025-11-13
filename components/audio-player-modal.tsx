"use client"

import type React from "react"
import { X, Download, ThumbsUp, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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

    if (audioDownloadUrl) {
      const link = document.createElement("a")
      link.href = audioDownloadUrl
      link.download = `${title}.mp3`
      link.target = "_blank" // Added target blank to ensure download works
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Download Started",
        description: "Your audio file is downloading.",
      })
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
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Play Button */}
            <div className="flex justify-center">
              <button
                onClick={handlePlayPause}
                className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                {isPlaying ? (
                  <div className="flex gap-1">
                    <div className="w-1 h-5 bg-black rounded-full" />
                    <div className="w-1 h-5 bg-black rounded-full" />
                  </div>
                ) : (
                  <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-black border-b-[10px] border-b-transparent ml-1" />
                )}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleLike} className="text-white hover:bg-white/10 gap-2">
                <ThumbsUp className={`w-4 h-4 ${liked ? "fill-white" : ""}`} />
                <span className="text-sm">{formatNumber(likesCount)}</span>
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
