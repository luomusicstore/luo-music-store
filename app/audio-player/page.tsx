"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { X, ThumbsUp, ThumbsDown, Share2, MoreHorizontal, Download, Check, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { collection, getDocs, query, orderBy, limit, doc, updateDoc, increment } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { SubscriptionModal } from "@/components/subscription-modal"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { GoogleDriveAudioPlayer } from "@/components/google-drive-audio-player"
import { AudioPlayerControls } from "@/components/audio-player-controls"

interface RelatedAudio {
  id: string
  title: string
  source: string
  views: string
  uploadDate: string
  duration: string
  thumbnail: string
  audioUrl: string
  audioDownloadUrl?: string
  isGoogleDriveAudio?: boolean
}

export default function AudioPlayerPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, hasActiveSubscription, isAdmin } = useAuth()
  const { toast } = useToast()

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(100)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [isDisliked, setIsDisliked] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [relatedAudios, setRelatedAudios] = useState<RelatedAudio[]>([])
  const [copiedLink, setCopiedLink] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  const [currentAudio, setCurrentAudio] = useState({
    id: searchParams.get("id") || "",
    title: searchParams.get("title") || "Unknown Audio",
    thumbnail: searchParams.get("thumbnail") || "/placeholder.svg",
    audioUrl: searchParams.get("audioUrl") || "",
    audioDownloadUrl: searchParams.get("audioDownloadUrl") || "",
    isGoogleDrive: searchParams.get("isGoogleDrive") === "true",
  })

  useEffect(() => {
    const fetchLatestAudios = async () => {
      try {
        console.log("[v0] Fetching related audios for:", currentAudio.id)

        const audiosQuery = query(collection(db, "content"), orderBy("uploadedAt", "desc"), limit(50))

        const querySnapshot = await getDocs(audiosQuery)
        const audios: RelatedAudio[] = querySnapshot.docs
          .map((doc) => {
            const data = doc.data()

            const hasAudioCategory =
              data.categories && Array.isArray(data.categories) && data.categories.includes("audio")
            if (!hasAudioCategory) return null

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
                uploadDate = "Unknown"
              }
            }

            return {
              id: doc.id,
              title: data.title || "",
              source: data.source || "",
              views: data.views || "0 views",
              uploadDate,
              duration: data.duration || "0:00",
              thumbnail: data.thumbnailUrl || "",
              audioUrl: data.audioUrl || "",
              audioDownloadUrl: data.audioDownloadUrl || "",
              isGoogleDriveAudio: data.isGoogleDriveAudio || false,
            }
          })
          .filter((audio): audio is RelatedAudio => audio !== null && audio.id !== currentAudio.id)
          .slice(0, 15)

        console.log("[v0] Fetched related audios:", audios.length)
        setRelatedAudios(audios)
      } catch (error) {
        console.error("Error fetching related audios:", error)
      }
    }

    fetchLatestAudios()
  }, [currentAudio.id])

  useEffect(() => {
    // Only create audio element for non-Google Drive audio
    if (currentAudio.audioUrl && !currentAudio.isGoogleDrive) {
      setIsPlaying(false)

      // Clean up previous audio element
      if (audioElement) {
        audioElement.pause()
        audioElement.src = ""
        audioElement.load()
      }

      const audio = new Audio()

      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration)
      })

      audio.addEventListener("timeupdate", () => {
        setCurrentTime(audio.currentTime)
      })

      audio.addEventListener("ended", () => {
        setIsPlaying(false)
      })

      // Silent error handling - the audio will retry on next user interaction
      audio.addEventListener("error", () => {
        // Silent error handling
      })

      audio.addEventListener("canplay", () => {
        // Audio is ready to play
      })

      audio.src = currentAudio.audioUrl
      audio.load()

      setAudioElement(audio)

      return () => {
        audio.pause()
        audio.src = ""
        audio.load()
      }
    } else {
      // For Google Drive or no audio, clean up any existing audio element
      if (audioElement) {
        audioElement.pause()
        audioElement.src = ""
        audioElement.load()
        setAudioElement(null)
      }
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
    }
  }, [currentAudio.audioUrl, currentAudio.isGoogleDrive])

  const togglePlay = () => {
    if (audioElement && !currentAudio.isGoogleDrive) {
      if (isPlaying) {
        audioElement.pause()
        setIsPlaying(false)
      } else {
        const playPromise = audioElement.play()
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true)
            })
            .catch((error) => {
              console.error("Playback failed:", error)
              toast({
                title: "Playback Failed",
                description: "Unable to start audio playback. Please try again.",
                variant: "destructive",
              })
              setIsPlaying(false)
            })
        }
      }
    }
  }

  const toggleMute = () => {
    if (audioElement) {
      audioElement.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (audioElement) {
      audioElement.volume = newVolume / 100
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
    if (audioElement) {
      audioElement.currentTime = time
    }
  }

  const skipTime = (seconds: number) => {
    if (audioElement) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
      audioElement.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const formatTime = (time: number) => {
    if (!isFinite(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const formatNumber = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  const handleRelatedAudioClick = (audio: RelatedAudio) => {
    if (audioElement) {
      audioElement.pause()
      audioElement.currentTime = 0
      audioElement.src = ""
      audioElement.load()
    }

    setCurrentAudio({
      id: audio.id,
      title: audio.title,
      thumbnail: audio.thumbnail,
      audioUrl: audio.audioUrl,
      audioDownloadUrl: audio.audioDownloadUrl,
      isGoogleDrive: audio.isGoogleDriveAudio || false,
    })
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }

  const handleDownload = async () => {
    if (!user) {
      sessionStorage.setItem(
        "pendingAction",
        JSON.stringify({
          type: "download",
          downloadType: "audio",
          audioUrl: currentAudio.audioUrl,
          audioDownloadUrl: currentAudio.audioDownloadUrl,
        }),
      )
      window.location.href = "/login"
      return
    }

    if (!hasActiveSubscription && !isAdmin) {
      setShowSubscriptionModal(true)
      return
    }

    const downloadUrl = currentAudio.audioUrl

    if (downloadUrl) {
      const isR2Url = downloadUrl.includes(".r2.dev")

      if (isR2Url) {
        try {
          toast({
            title: "Download Starting",
            description: "Preparing your audio file...",
          })

          const filename = `${currentAudio.title}.mp3`

          const proxyUrl = `/api/download?url=${encodeURIComponent(downloadUrl)}&filename=${encodeURIComponent(filename)}`

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
        window.open(downloadUrl, "_blank")
        toast({
          title: "Opening Download",
          description: "Opening the download link in a new tab.",
        })
      }
    } else {
      toast({
        title: "Error",
        description: "Audio download link not available",
        variant: "destructive",
      })
    }
  }

  const handleShare = async (platform: string) => {
    setShowShareMenu(false)

    const websiteLink = `${window.location.origin}`

    if (platform === "copy") {
      await navigator.clipboard.writeText(websiteLink)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } else {
      const shareUrls: Record<string, string> = {
        WhatsApp: `https://wa.me/?text=${encodeURIComponent(`Check out ${currentAudio.title} on Luo Music Store - ${websiteLink}`)}`,
        Facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(websiteLink)}`,
        Twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${currentAudio.title} on Luo Music Store`)}&url=${encodeURIComponent(websiteLink)}`,
        Instagram: websiteLink,
      }

      if (shareUrls[platform]) {
        window.open(shareUrls[platform], "_blank")
      }
    }
  }

  const handleSave = () => {
    setIsSaved(!isSaved)
    toast({
      title: isSaved ? "Removed from saved" : "Added to saved",
      description: `Audio ${isSaved ? "removed from" : "added to"} your saved list`,
    })
  }

  const handleLike = async () => {
    if (!user) {
      sessionStorage.setItem(
        "pendingAction",
        JSON.stringify({ type: "like", contentId: currentAudio.id, contentType: "audio" }),
      )
      window.location.href = "/login"
      return
    }

    try {
      const contentRef = doc(db, "content", currentAudio.id)
      if (!isLiked) {
        await updateDoc(contentRef, {
          likesCount: increment(1),
        })
        setLikesCount((prev) => prev + 1)
      } else {
        await updateDoc(contentRef, {
          likesCount: increment(-1),
        })
        setLikesCount((prev) => prev - 1)
      }
      setIsLiked(!isLiked)
      if (isDisliked) setIsDisliked(false)
    } catch (error) {
      console.error("Error updating likes:", error)
    }
  }

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-20 px-3 py-2 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-sm font-semibold truncate flex-1">Now Playing</h1>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => router.back()}
            className="h-8 w-8 rounded-full flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 md:p-4 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden">
              <div className="flex flex-col md:flex-row gap-4 p-4">
                <div className="relative w-full md:w-48 aspect-square rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={currentAudio.thumbnail || "/placeholder.svg"}
                    alt={currentAudio.title}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1 truncate">{currentAudio.title}</h2>
                    {!currentAudio.isGoogleDrive && (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{formatTime(currentTime)}</span>
                        <span>/</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    )}
                  </div>

                  {currentAudio.isGoogleDrive ? (
                    <div className="space-y-3 mt-4">
                      <GoogleDriveAudioPlayer driveUrl={currentAudio.audioUrl} autoPlay={false} className="w-full" />
                      <p className="text-xs text-gray-400 text-center">Google Drive Audio Player</p>
                    </div>
                  ) : (
                    <AudioPlayerControls
                      isPlaying={isPlaying}
                      currentTime={currentTime}
                      duration={duration}
                      volume={volume}
                      isMuted={isMuted}
                      onTogglePlay={togglePlay}
                      onSeek={handleSeek}
                      onVolumeChange={handleVolumeChange}
                      onToggleMute={toggleMute}
                      onSkipBack={() => skipTime(-15)}
                      onSkipForward={() => skipTime(15)}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-green-100 rounded-full">
                <Button
                  size="sm"
                  variant="ghost"
                  className={`rounded-l-full px-4 h-9 text-sm hover:bg-green-200 ${isLiked ? "text-green-700" : "text-green-700"}`}
                  onClick={handleLike}
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  <span>{formatNumber(likesCount)}</span>
                </Button>
                <div className="w-px h-6 bg-green-300" />
                <Button
                  size="sm"
                  variant="ghost"
                  className={`rounded-r-full px-3 h-9 hover:bg-green-200 ${isDisliked ? "text-green-700" : "text-green-700"}`}
                  onClick={() => {
                    setIsDisliked(!isDisliked)
                    if (isLiked) setIsLiked(false)
                  }}
                >
                  <ThumbsDown className="w-4 h-4" />
                </Button>
              </div>

              <DropdownMenu open={showShareMenu} onOpenChange={setShowShareMenu}>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="bg-green-100 hover:bg-green-200 text-green-700 rounded-full px-4 h-9"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => handleShare("WhatsApp")} className="cursor-pointer">
                    WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare("Facebook")} className="cursor-pointer">
                    Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare("Twitter")} className="cursor-pointer">
                    Twitter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare("Instagram")} className="cursor-pointer">
                    Instagram
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare("copy")} className="cursor-pointer">
                    {copiedLink ? <Check className="w-4 h-4 mr-2" /> : null}
                    {copiedLink ? "Copied!" : "Copy Link"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleDownload}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-full px-4 h-9 font-semibold shadow-md"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>

              <DropdownMenu open={showMoreMenu} onOpenChange={setShowMoreMenu}>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="bg-green-100 hover:bg-green-200 text-green-700 rounded-full h-9 w-9"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleDownload} className="cursor-pointer">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowShareMenu(true)} className="cursor-pointer">
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
            </div>
          </div>

          <div className="lg:sticky lg:top-16 lg:h-fit">
            <h2 className="text-base font-semibold mb-3 text-green-700">RELATED AUDIO</h2>
            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              {relatedAudios.length > 0 ? (
                relatedAudios.map((audio) => (
                  <div
                    key={audio.id}
                    className="flex gap-2 hover:bg-green-50 rounded-lg p-2 cursor-pointer group transition-colors"
                    onClick={() => handleRelatedAudioClick(audio)}
                  >
                    <div className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={audio.thumbnail || "/placeholder.svg"}
                        alt={audio.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                        {audio.duration}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium line-clamp-2 mb-1 leading-snug">{audio.title}</h3>
                      <p className="text-xs text-muted-foreground">{audio.source}</p>
                      <p className="text-xs text-muted-foreground">
                        {audio.views} • {audio.uploadDate}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">No related audio available</div>
              )}
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
        />
      )}
    </div>
  )
}
