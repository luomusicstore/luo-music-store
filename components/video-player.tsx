"use client"

import { useState, useRef, useEffect } from "react"
import { X, ThumbsUp, ThumbsDown, Share2, MoreVertical, Download, Check, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { collection, getDocs, query, orderBy, limit, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { SubscriptionModal } from "@/components/subscription-modal"
import { EmbedPlayer } from "@/components/embed-player"

interface VideoPlayerProps {
  title: string
  thumbnail: string
  videoUrl: string
  videoDownloadUrl?: string
  audioDownloadUrl?: string
  category?: string
  onClose: () => void
  forceGoogleDrive?: boolean
}

interface RelatedVideo {
  id: string
  title: string
  channel: string
  views: string
  uploadDate: string
  duration: string
  thumbnail: string
  videoUrl: string
  videoDownloadUrl?: string
  audioDownloadUrl?: string
  category: string
}

export function VideoPlayer({
  title,
  thumbnail,
  videoUrl,
  videoDownloadUrl,
  audioDownloadUrl,
  category = "video",
  onClose,
  forceGoogleDrive = false,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(100)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [quality, setQuality] = useState("720p")
  const [isLiked, setIsLiked] = useState(false)
  const [isDisliked, setIsDisliked] = useState(false)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [relatedVideos, setRelatedVideos] = useState<RelatedVideo[]>([])
  const [copiedLink, setCopiedLink] = useState(false)
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const playerRef = useRef<any>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()
  const progressIntervalRef = useRef<NodeJS.Timeout>()
  const { user, hasActiveSubscription, isAdmin } = useAuth()

  const [currentVideo, setCurrentVideo] = useState({
    title,
    thumbnail,
    videoUrl,
    videoDownloadUrl,
    audioDownloadUrl,
  })

  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null)
  const [isYouTubeAPIReady, setIsYouTubeAPIReady] = useState(false)
  const [likesCount, setLikesCount] = useState(0)

  const [showAd, setShowAd] = useState(false)
  const [adWatchTime, setAdWatchTime] = useState(0)
  const adIntervalTime = 300 // Show ad every 5 minutes (300 seconds)
  const [relatedVideoId, setRelatedVideoId] = useState<string | null>(null)

  useEffect(() => {
    const fetchLatestVideos = async () => {
      try {
        const videosQuery = query(collection(db, "content"), orderBy("uploadedAt", "desc"), limit(30))
        const querySnapshot = await getDocs(videosQuery)
        const videos: RelatedVideo[] = querySnapshot.docs
          .map((doc) => {
            const data = doc.data()

            let uploadDate = "Unknown"
            if (data.uploadedAt) {
              try {
                if (typeof data.uploadedAt === "string") {
                  uploadDate = new Date(data.uploadedAt).toLocaleDateString()
                } else if (data.uploadedAt.seconds) {
                  uploadDate = new Date(data.uploadedAt.seconds * 1000).toLocaleDateString()
                } else if (data.uploadedAt.toDate) {
                  uploadDate = data.uploadedAt.toDate().toLocaleDateString()
                }
              } catch (error) {
                console.error("[v0] Error formatting date:", error)
                uploadDate = "Unknown"
              }
            }

            return {
              id: doc.id,
              title: data.title || "",
              channel: data.source || "",
              views: data.views || "0 views",
              uploadDate,
              duration: data.duration || "0",
              thumbnail: data.thumbnailUrl || "",
              videoUrl: data.videoUrl || "",
              videoDownloadUrl: data.videoDownloadUrl || "",
              audioDownloadUrl: data.audioDownloadUrl || "",
              category: data.category || "",
            }
          })
          .filter((video) => (category === "movie" ? video.category === "movie" : true))
          .slice(0, 10)

        setRelatedVideos(videos)
      } catch (error) {
        console.error("Error fetching related videos:", error)
      }
    }

    fetchLatestVideos()
  }, [])

  useEffect(() => {
    // Check if YouTube API is already loaded
    if ((window as any).YT && (window as any).YT.Player) {
      setIsYouTubeAPIReady(true)
      return
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      return
    }

    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    const firstScriptTag = document.getElementsByTagName("script")[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    ;(window as any).onYouTubeIframeAPIReady = () => {
      console.log("[v0] YouTube API Ready")
      setIsYouTubeAPIReady(true)
    }
  }, [])

  useEffect(() => {
    if (!isYouTubeAPIReady || !playerContainerRef.current) {
      console.log("[v0] Waiting for YouTube API or container")
      return
    }

    const videoId = getYouTubeVideoId(currentVideo.videoUrl)
    console.log("[v0] Video ID:", videoId)

    if (!videoId) {
      console.log("[v0] No valid video ID found")
      return
    }

    // Destroy existing player and create new one for related videos
    if (playerRef.current && playerRef.current.destroy) {
      console.log("[v0] Destroying existing player for reload")
      playerRef.current.destroy()
      playerRef.current = null
    }

    // Create new player
    console.log("[v0] Creating new YouTube player")
    try {
      playerRef.current = new (window as any).YT.Player("youtube-player", {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          enablejsapi: 1,
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
        },
      })
    } catch (error) {
      console.error("[v0] Error creating player:", error)
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [isYouTubeAPIReady, currentVideo.videoUrl])

  const getYouTubeVideoId = (url: string) => {
    try {
      const urlObj = new URL(url)
      if (urlObj.hostname.includes("youtube.com")) {
        return urlObj.searchParams.get("v") || ""
      } else if (urlObj.hostname.includes("youtu.be")) {
        return urlObj.pathname.slice(1)
      }
    } catch {
      return ""
    }
    return ""
  }

  const onPlayerReady = (event: any) => {
    console.log("[v0] Player ready, current video ID:", currentVideoId)
    setIsPlayerReady(true)
    const videoDuration = event.target.getDuration()
    console.log("[v0] Video duration from YouTube:", videoDuration)
    setDuration(videoDuration)
    setVolume(event.target.getVolume())

    if (currentVideoId && videoDuration && videoDuration > 0) {
      console.log("[v0] Updating duration for video ID:", currentVideoId)
      updateVideoDuration(currentVideoId, videoDuration)
    } else {
      console.log("[v0] Cannot update duration - videoId:", currentVideoId, "duration:", videoDuration)
    }
  }

  const updateVideoDuration = async (videoId: string, durationInSeconds: number) => {
    try {
      const minutes = Math.floor(durationInSeconds / 60)
      const seconds = Math.floor(durationInSeconds % 60)
      const formattedDuration = `${minutes}:${seconds.toString().padStart(2, "0")}`

      console.log("[v0] Attempting to update duration to:", formattedDuration, "for video:", videoId)

      const videoRef = doc(db, "content", videoId)
      await updateDoc(videoRef, {
        duration: formattedDuration,
      })
      console.log("[v0] Successfully updated video duration to:", formattedDuration)
    } catch (error) {
      console.error("[v0] Error updating duration:", error)
    }
  }

  const onPlayerStateChange = (event: any) => {
    if (event.data === 1) {
      setIsPlaying(true)
      startProgressTracking()
    } else if (event.data === 2) {
      setIsPlaying(false)
      stopProgressTracking()
    } else if (event.data === 0) {
      setIsPlaying(false)
      stopProgressTracking()
    }
  }

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }
    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        setCurrentTime(playerRef.current.getCurrentTime())
      }
    }, 100)
  }

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }
  }

  useEffect(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }

    if (showControls && isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3500)
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [showControls, isPlaying])

  const handleMouseMove = () => {
    setShowControls(true)
  }

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false)
    }
  }

  const togglePlay = () => {
    if (playerRef.current && isPlayerReady) {
      if (isPlaying) {
        playerRef.current.pauseVideo()
      } else {
        playerRef.current.playVideo()
      }
    }
  }

  const toggleMute = () => {
    if (playerRef.current && isPlayerReady) {
      if (isMuted) {
        playerRef.current.unMute()
        setIsMuted(false)
      } else {
        playerRef.current.mute()
        setIsMuted(true)
      }
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (playerRef.current && isPlayerReady) {
      playerRef.current.setVolume(newVolume)
      if (newVolume === 0) {
        setIsMuted(true)
      } else if (isMuted) {
        setIsMuted(false)
      }
    }
  }

  const handleSeek = (value: number[]) => {
    const time = value[0]
    setCurrentTime(time)
    if (playerRef.current && isPlayerReady) {
      playerRef.current.seekTo(time, true)
    }
  }

  const handleFullscreen = () => {
    if (playerContainerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        playerContainerRef.current.requestFullscreen()
      }
    }
  }

  const skipTime = (seconds: number) => {
    if (playerRef.current && isPlayerReady) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
      playerRef.current.seekTo(newTime, true)
      setCurrentTime(newTime)
    }
  }

  const changeQuality = (newQuality: string) => {
    setQuality(newQuality)
    if (playerRef.current && isPlayerReady) {
      const qualityLevels: Record<string, string> = {
        "1080p": "hd1080",
        "720p": "hd720",
        "480p": "large",
        "360p": "medium",
        "240p": "small",
      }
      playerRef.current.setPlaybackQuality(qualityLevels[newQuality] || "hd720")
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const formatNumber = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  const handleRelatedVideoClick = (video: RelatedVideo) => {
    console.log("[v0] Related video clicked:", video.title)

    setRelatedVideoId(video.id)

    setCurrentVideo({
      title: video.title,
      thumbnail: video.thumbnail,
      videoUrl: video.videoUrl,
      videoDownloadUrl: video.videoDownloadUrl,
      audioDownloadUrl: video.audioDownloadUrl,
    })

    setIsPlaying(false)
    setCurrentTime(0)
  }

  const handleDownload = async () => {
    if (!user) {
      sessionStorage.setItem(
        "pendingAction",
        JSON.stringify({
          type: "download",
          videoUrl: currentVideo.videoUrl,
          videoDownloadUrl: currentVideo.videoDownloadUrl,
        }),
      )
      window.location.href = "/login"
      return
    }

    if (!hasActiveSubscription && !isAdmin) {
      setShowSubscriptionModal(true)
      return
    }

    const fileUrl = currentVideo.videoUrl
    const downloadUrl = currentVideo.videoDownloadUrl

    if (!downloadUrl) {
      alert("Download link not available")
      return
    }

    window.open(downloadUrl, "_blank")
  }

  const handleShare = async (platform: string) => {
    setShowOptionsMenu(false)

    const websiteLink = `${window.location.origin}`

    if (platform === "copy") {
      await navigator.clipboard.writeText(websiteLink)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } else {
      const shareUrls: Record<string, string> = {
        WhatsApp: `https://wa.me/?text=${encodeURIComponent(`Check out ${currentVideo.title} on Luo Music Store - ${websiteLink}`)}`,
        Facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(websiteLink)}`,
        Twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${currentVideo.title} on Luo Music Store`)}&url=${encodeURIComponent(websiteLink)}`,
        Instagram: websiteLink,
      }

      if (shareUrls[platform]) {
        window.open(shareUrls[platform], "_blank")
      }
    }
  }

  const handleSave = () => {
    setIsSaved(!isSaved)
    alert(`Video ${isSaved ? "removed from" : "added to"} saved list`)
  }

  useEffect(() => {
    const findVideoId = async () => {
      try {
        const videosQuery = query(collection(db, "content"))
        const querySnapshot = await getDocs(videosQuery)

        querySnapshot.forEach((document) => {
          const data = document.data()
          if (data.videoUrl === currentVideo.videoUrl) {
            setCurrentVideoId(document.id)
            setLikesCount(data.likesCount || 0)
            console.log("[v0] Found video ID:", document.id)
          }
        })
      } catch (error) {
        console.error("[v0] Error finding video ID:", error)
      }
    }

    if (currentVideo.videoUrl) {
      findVideoId()
    }
  }, [currentVideo.videoUrl])

  useEffect(() => {
    if (isPlaying) {
      const adTimer = setInterval(() => {
        setAdWatchTime((prev) => {
          const newTime = prev + 1
          // Show ad every 5 minutes of watch time
          if (newTime % adIntervalTime === 0) {
            console.log("[v0] Triggering ad after", newTime, "seconds")
            setShowAd(true)
            // Pause video when ad shows
            if (playerRef.current && isPlayerReady) {
              playerRef.current.pauseVideo()
            }
          }
          return newTime
        })
      }, 1000)

      return () => clearInterval(adTimer)
    }
  }, [isPlaying, isPlayerReady])

  const handleSkipAd = () => {
    console.log("[v0] Ad skipped")
    setShowAd(false)
    // Resume video after ad
    if (playerRef.current && isPlayerReady) {
      playerRef.current.playVideo()
    }
  }

  const handleDurationLoad = (durationInSeconds: number) => {
    if (currentVideoId && durationInSeconds && durationInSeconds > 0) {
      updateVideoDuration(currentVideoId, durationInSeconds)
    }
    setDuration(durationInSeconds)
  }

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-20 px-2 md:px-4 py-2 md:py-3 shadow-sm">
        <div className="flex items-center justify-end max-w-[1920px] mx-auto">
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 md:h-9 md:w-9 rounded-full flex-shrink-0"
          >
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-3 md:gap-6 md:p-4 pb-20 md:pb-24">
          <div className="flex-1 min-w-0">
            <div
              ref={playerContainerRef}
              className="relative bg-black md:rounded-xl overflow-hidden aspect-video mb-2 md:mb-4"
            >
              <EmbedPlayer
                key={relatedVideoId || videoUrl}
                videoUrl={currentVideo.videoUrl}
                title={currentVideo.title}
                onDurationLoad={handleDurationLoad}
                forceGoogleDrive={forceGoogleDrive}
              />
            </div>

            <div className="px-3 md:px-0">
              <h1 className="text-sm md:text-base font-medium leading-tight mb-2 md:mb-3">{currentVideo.title}</h1>
              <div className="flex items-center gap-1.5 md:gap-2 flex-wrap mb-3 md:mb-4">
                <div className="flex items-center bg-green-100 rounded-full">
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`rounded-l-full px-2 md:px-4 h-7 md:h-9 text-xs md:text-sm hover:bg-green-200 ${isLiked ? "text-green-700" : "text-green-700"}`}
                    onClick={() => {
                      setIsLiked(!isLiked)
                      if (isDisliked) setIsDisliked(false)
                    }}
                  >
                    <ThumbsUp className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    <span className="text-xs md:text-sm">{formatNumber(isLiked ? likesCount + 1 : likesCount)}</span>
                  </Button>
                  <div className="w-px h-4 md:h-6 bg-green-300" />
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`rounded-r-full px-2 md:px-3 h-7 md:h-9 hover:bg-green-200 ${isDisliked ? "text-green-700" : "text-green-700"}`}
                    onClick={() => {
                      setIsDisliked(!isDisliked)
                      if (isLiked) setIsLiked(false)
                    }}
                  >
                    <ThumbsDown className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                </div>

                <DropdownMenu open={showOptionsMenu} onOpenChange={setShowOptionsMenu}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/20 rounded-full h-7 md:h-9 px-2 md:px-3"
                    >
                      <MoreVertical className="w-4 h-4 md:w-5 md:h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => console.log("Share")} className="cursor-pointer">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSave} className="cursor-pointer">
                      {isSaved ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-4 h-4 mr-2" />
                          Save
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  size="sm"
                  variant="ghost"
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-full px-2 md:px-4 h-7 md:h-9 text-xs md:text-sm font-semibold shadow-md"
                  onClick={handleDownload}
                >
                  <Download className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:w-[320px] xl:w-[360px] px-3 md:px-0">
            <h2 className="text-sm md:text-base font-semibold mb-2 md:mb-3 text-green-700">
              {category === "movie" ? "RELATED MOVIES" : "RELATED VIDEOS"}
            </h2>
            <div className="space-y-1.5 md:space-y-2">
              {relatedVideos.map((video) => (
                <div
                  key={video.id}
                  className="flex gap-2 hover:bg-green-50 rounded-lg p-1.5 md:p-2 cursor-pointer group"
                  onClick={() => handleRelatedVideoClick(video)}
                >
                  <div className="relative flex-shrink-0 w-24 md:w-32 aspect-video rounded-md md:rounded-lg overflow-hidden bg-muted">
                    <img
                      src={video.thumbnail || "/placeholder.svg"}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute bottom-0.5 right-0.5 md:bottom-1 md:right-1 bg-black/80 text-white text-[10px] md:text-xs px-1 md:px-1.5 py-0.5 rounded">
                      {video.duration}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs md:text-sm font-medium line-clamp-2 mb-0.5 md:mb-1 leading-snug">
                      {video.title}
                    </h3>
                    <p className="text-[10px] md:text-xs text-muted-foreground">{video.channel}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">
                      {video.views} • {video.uploadDate}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {showSubscriptionModal && user && (
        <SubscriptionModal
          open={showSubscriptionModal}
          onOpenChange={setShowSubscriptionModal}
          userId={user.uid}
          userEmail={user.email || ""}
          subscriptionType={category === "movie" ? "movie" : "general"}
        />
      )}
    </div>
  )
}
