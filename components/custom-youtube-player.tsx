"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack, Settings, Maximize2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface CustomYouTubePlayerProps {
  videoUrl: string
  title: string
  onDurationLoad?: (duration: number) => void
}

export function CustomYouTubePlayer({ videoUrl, title, onDurationLoad }: CustomYouTubePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(100)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [quality, setQuality] = useState("auto")
  const [availableQualities, setAvailableQualities] = useState<string[]>([])
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [isYouTubeAPIReady, setIsYouTubeAPIReady] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()
  const progressIntervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  useEffect(() => {
    if ((window as any).YT && (window as any).YT.Player) {
      setIsYouTubeAPIReady(true)
      return
    }

    if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      return
    }

    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    const firstScriptTag = document.getElementsByTagName("script")[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    
    ;(window as any).onYouTubeIframeAPIReady = () => {
      setIsYouTubeAPIReady(true)
    }
  }, [])

  useEffect(() => {
    if (!isYouTubeAPIReady || !containerRef.current) {
      return
    }

    const videoId = getYouTubeVideoId(videoUrl)
    if (!videoId) return

    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(videoId)
      setIsPlaying(false)
      setCurrentTime(0)
      return
    }

    try {
      playerRef.current = new (window as any).YT.Player("youtube-iframe", {
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
          playsinline: 1,
          cc_load_policy: 0,
          loop: 0,
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
        },
      })
    } catch (error) {
      console.error("Error creating player:", error)
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [isYouTubeAPIReady, videoUrl])

  const onPlayerReady = (event: any) => {
    setIsPlayerReady(true)
    const videoDuration = event.target.getDuration()
    setDuration(videoDuration)
    setVolume(event.target.getVolume())
    
    console.log("[v0] Player ready, waiting for playback to fetch qualities")
    
    if (onDurationLoad) {
      onDurationLoad(videoDuration)
    }
  }

  const onPlayerStateChange = (event: any) => {
    if (event.data === 1) {
      setIsPlaying(true)
      setIsBuffering(false)
      startProgressTracking()
      
      if (playerRef.current) {
        const availableLevels = playerRef.current.getAvailableQualityLevels()
        console.log("[v0] Available quality levels (on play):", availableLevels)
        
        if (availableLevels && availableLevels.length > 0) {
          setAvailableQualities(availableLevels)
        }
        
        const currentQuality = playerRef.current.getPlaybackQuality()
        console.log("[v0] Current quality:", currentQuality)
        setQuality(currentQuality)
      }
    } else if (event.data === 2) {
      setIsPlaying(false)
      setIsBuffering(false)
      stopProgressTracking()
    } else if (event.data === 0) {
      setIsPlaying(false)
      setIsBuffering(false)
      stopProgressTracking()
    } else if (event.data === 3) {
      setIsBuffering(true)
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

  const handleInteraction = () => {
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
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        containerRef.current.requestFullscreen()
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
    console.log("[v0] Attempting to change quality to:", newQuality)
    
    if (!playerRef.current || !isPlayerReady) {
      console.log("[v0] Player not ready")
      return
    }

    try {
      const currentPlaybackTime = playerRef.current.getCurrentTime()
      const wasPlaying = isPlaying
      
      playerRef.current.setPlaybackQuality(newQuality)
      
      setQuality(newQuality)
      
      console.log("[v0] Quality change requested:", newQuality)
      
      setTimeout(() => {
        if (playerRef.current && currentPlaybackTime) {
          playerRef.current.seekTo(currentPlaybackTime, true)
          if (wasPlaying) {
            playerRef.current.playVideo()
          }
        }
        
        const actualQuality = playerRef.current.getPlaybackQuality()
        console.log("[v0] Actual quality after change:", actualQuality)
        setQuality(actualQuality)
      }, 500)
    } catch (error) {
      console.error("[v0] Error changing quality:", error)
    }
  }

  const getQualityLabel = (quality: string) => {
    const labels: Record<string, string> = {
      "hd1080": "1080p",
      "hd720": "720p",
      "large": "480p",
      "medium": "360p",
      "small": "240p",
      "tiny": "144p",
      "auto": "Auto",
      "highres": "4K",
    }
    return labels[quality] || quality
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black rounded-lg overflow-hidden group"
      onMouseMove={handleInteraction}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleInteraction}
    >
      <div id="youtube-iframe" className="w-full h-full pointer-events-none" style={{ pointerEvents: 'none' }} />

      <div 
        className="absolute inset-0 z-5 cursor-pointer"
        onClick={togglePlay}
        onTouchEnd={(e) => {
          e.preventDefault()
          handleInteraction()
        }}
        style={{ 
          touchAction: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}
      />

      <div className={`absolute ${isMobile ? 'top-2 right-2' : 'top-4 right-4'} z-50 bg-gradient-to-r from-purple-600/40 to-blue-600/40 backdrop-blur-sm ${isMobile ? 'px-2 py-0.5' : 'px-3 py-1.5'} rounded-full border border-purple-400/20`}>
        <span className={`text-white/80 ${isMobile ? 'text-[9px]' : 'text-xs'} font-semibold tracking-wide`}>LUO PLAYER</span>
      </div>

      <div
        className={`absolute inset-0 bg-gradient-to-t from-indigo-950/40 via-transparent to-purple-950/10 transition-opacity duration-300 ${showControls || !isPlaying ? "opacity-100" : "opacity-0"} pointer-events-none z-10`}
      >
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-purple-950/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-indigo-950/40 to-transparent" />
      </div>

      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 z-15 ${!isPlaying && !isBuffering ? "opacity-100" : "opacity-0"}`}
      >
        <div className={`${isMobile ? 'w-12 h-12' : 'w-20 h-20'} bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl`}>
          <Play className={`${isMobile ? 'w-6 h-6' : 'w-10 h-10'} text-white ml-1`} />
        </div>
      </div>

      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-15">
          <div className={`${isMobile ? 'w-10 h-10 border-2' : 'w-16 h-16 border-4'} border-purple-500 border-t-transparent rounded-full animate-spin`} />
        </div>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 ${isMobile ? 'p-2' : 'p-4'} transition-all duration-300 pointer-events-auto z-30 ${
          showControls || !isPlaying ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        <div className={isMobile ? 'mb-1.5' : 'mb-3'}>
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="w-full cursor-pointer"
          />
          <div className={`flex justify-between ${isMobile ? 'text-[9px]' : 'text-xs'} text-white/90 mt-1 font-medium`}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
            <Button
              size="icon"
              variant="ghost"
              onClick={togglePlay}
              className={`${isMobile ? 'h-7 w-7' : 'h-10 w-10'} rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 text-white backdrop-blur-sm border border-purple-400/20`}
            >
              {isPlaying ? <Pause className={isMobile ? 'w-3 h-3' : 'w-5 h-5'} /> : <Play className={`${isMobile ? 'w-3 h-3' : 'w-5 h-5'} ml-0.5`} />}
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => skipTime(-10)}
              className={`${isMobile ? 'h-6 w-6' : 'h-9 w-9'} rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 text-white backdrop-blur-sm border border-purple-400/10`}
            >
              <SkipBack className={isMobile ? 'w-2.5 h-2.5' : 'w-4 h-4'} />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => skipTime(10)}
              className={`${isMobile ? 'h-6 w-6' : 'h-9 w-9'} rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 text-white backdrop-blur-sm border border-purple-400/10`}
            >
              <SkipForward className={isMobile ? 'w-2.5 h-2.5' : 'w-4 h-4'} />
            </Button>

            <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-full px-3 py-2 border border-purple-400/10">
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleMute}
                className="h-6 w-6 p-0 hover:bg-transparent text-white"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <div className="w-20">
                <Slider
                  value={[volume]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="cursor-pointer"
                />
              </div>
            </div>

            <Button
              size="icon"
              variant="ghost"
              onClick={toggleMute}
              className={`sm:hidden ${isMobile ? 'h-6 w-6' : 'h-9 w-9'} rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 text-white backdrop-blur-sm border border-purple-400/10`}
            >
              {isMuted || volume === 0 ? <VolumeX className={isMobile ? 'w-2.5 h-2.5' : 'w-4 h-4'} /> : <Volume2 className={isMobile ? 'w-2.5 h-2.5' : 'w-4 h-4'} />}
            </Button>
          </div>

          <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className={`${isMobile ? 'h-6 w-6' : 'h-9 w-9'} rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 text-white backdrop-blur-sm border border-purple-400/10`}
                >
                  <Settings className={isMobile ? 'w-2.5 h-2.5' : 'w-4 h-4'} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-indigo-950/95 backdrop-blur-md border-purple-700/50">
                <div className="px-2 py-1.5 text-xs font-semibold text-purple-300">Quality</div>
                {availableQualities.length > 0 ? (
                  availableQualities.map((q) => (
                    <DropdownMenuItem
                      key={q}
                      onClick={() => changeQuality(q)}
                      className={`cursor-pointer text-white hover:bg-purple-500/20 ${quality === q ? "bg-purple-500/30" : ""}`}
                    >
                      {getQualityLabel(q)}
                      {quality === q && <span className="ml-auto text-purple-400">✓</span>}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled className="text-white/50 text-xs">
                    {isPlayerReady ? "Start video to load qualities" : "Loading player..."}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="icon"
              variant="ghost"
              onClick={handleFullscreen}
              className={`${isMobile ? 'h-6 w-6' : 'h-9 w-9'} rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 text-white backdrop-blur-sm border border-purple-400/10`}
            >
              <Maximize2 className={isMobile ? 'w-2.5 h-2.5' : 'w-4 h-4'} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}
