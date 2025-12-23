"use client"

import { useRef, useEffect, useState } from "react"
import { Loader2, Play, Pause, Volume2, VolumeX } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import Image from "next/image"

interface GoogleDriveAudioPlayerProps {
  driveUrl: string
  autoPlay?: boolean
  className?: string
}

export function GoogleDriveAudioPlayer({ driveUrl, autoPlay = false, className = "" }: GoogleDriveAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [proxyUrl, setProxyUrl] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [embedUrl, setEmbedUrl] = useState<string>("")

  useEffect(() => {
    const extractFileId = (url: string) => {
      const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]+)/,
        /id=([a-zA-Z0-9_-]+)/,
        /\/open\?id=([a-zA-Z0-9_-]+)/,
        /\/d\/([a-zA-Z0-9_-]+)/,
        /^([a-zA-Z0-9_-]{25,})$/,
      ]

      for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match && match[1]) {
          return match[1]
        }
      }
      return null
    }

    const fileId = extractFileId(driveUrl)
    if (fileId) {
      setProxyUrl(`/api/google-drive-proxy?fileId=${fileId}`)
      setEmbedUrl(`https://drive.google.com/file/d/${fileId}/preview`)
      setLoading(false)
    } else {
      setError("Invalid Google Drive URL")
      setLoading(false)
    }
  }, [driveUrl])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", handleEnded)

    if (autoPlay) {
      audio.play().catch(() => setIsPlaying(false))
    }

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [proxyUrl, autoPlay])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = value[0]
    setCurrentTime(value[0])
  }

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return
    const newVolume = value[0]
    audio.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume || 0.5
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 bg-gray-900 rounded-lg ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-white" />
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center p-4 bg-red-900/20 rounded-lg border border-red-500 ${className}`}
      >
        <p className="text-sm text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className={`relative w-full bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {embedUrl ? (
        <iframe
          src={embedUrl}
          className="w-full h-[120px]"
          allow="autoplay; encrypted-media"
          title="Google Drive Audio Player"
          style={{ border: "none" }}
        />
      ) : (
        <audio ref={audioRef} src={proxyUrl} />
      )}

      <div className="absolute inset-0 pointer-events-none z-40">
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Luo Player" width={24} height={24} className="rounded-full" />
            <span className="text-white text-xs font-bold">LUO Player</span>
          </div>
          <span className="text-[10px] text-gray-300">Google Drive Audio</span>
        </div>

        <div className="absolute top-0 right-0 w-28 h-16 bg-gradient-to-l from-black/95 via-black/80 to-transparent flex items-center justify-end pr-3">
          <div className="w-10 h-10 bg-black/70 rounded-full flex items-center justify-center">
            <Image src="/logo.png" alt="Blocked" width={20} height={20} className="rounded-full opacity-60" />
          </div>
        </div>
      </div>

      <div
        className="absolute top-0 right-0 w-32 h-20 z-50 cursor-not-allowed"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          return false
        }}
        onTouchStart={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onTouchEnd={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        title="Protected content"
        style={{ touchAction: "none" }}
      />

      <div
        className="absolute inset-0 z-30"
        style={{ background: "transparent" }}
        onClick={(e) => e.preventDefault()}
      />

      <div className="space-y-4">
        {/* Branding */}
        <div className="flex items-center justify-between">
          <span className="text-white text-sm font-semibold">LUO Player</span>
          <span className="text-xs text-gray-400">Google Drive Audio</span>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={togglePlayPause}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
          </button>

          {/* Volume control */}
          <div className="flex items-center gap-2 flex-1 max-w-[150px] ml-4">
            <button onClick={toggleMute} className="text-white hover:text-gray-300">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
