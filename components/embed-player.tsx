"use client"

import { useState, useRef, useEffect } from "react"
import { CustomYouTubePlayer } from "@/components/custom-youtube-player"
import { GoogleDrivePlayer } from "@/components/google-drive-player"

interface EmbedPlayerProps {
  videoUrl: string
  title: string
  onClose?: () => void
  onDurationLoad?: (duration: number) => void
  forceGoogleDrive?: boolean
}

export function EmbedPlayer({ videoUrl, title, onClose, onDurationLoad, forceGoogleDrive = false }: EmbedPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(100)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  const getEmbedUrl = (url: string) => {
    // Handle Google Drive links
    if (url.includes("drive.google.com")) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/) || url.match(/id=([a-zA-Z0-9-_]+)/)
      if (fileIdMatch && fileIdMatch[1]) {
        return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`
      }
    }
    // Handle YouTube links
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const watchMatch = url.match(/[?&]v=([^&]+)/)
      if (watchMatch && watchMatch[1]) {
        return `https://www.youtube.com/embed/${watchMatch[1]}`
      }

      const shortMatch = url.match(/youtu\.be\/([^?&]+)/)
      if (shortMatch && shortMatch[1]) {
        return `https://www.youtube.com/embed/${shortMatch[1]}`
      }

      if (url.includes("/embed/")) {
        return url
      }
    }
    // For regular video URLs, return as-is
    return url
  }

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100
      if (newVolume === 0) {
        setIsMuted(true)
      } else if (isMuted) {
        setIsMuted(false)
      }
    }
  }

  const handleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.muted = false
        setIsMuted(false)
      } else {
        videoRef.current.muted = true
        setIsMuted(true)
      }
    }
  }

  const handleSeek = (value: number[]) => {
    const newTime = value[0]
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
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

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [])

  const isGoogleDrive = videoUrl.includes("drive.google.com") || videoUrl.includes("docs.google.com")
  const isYouTube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")
  const isDirectVideo = videoUrl.match(/\.(mp4|webm|ogg|mov)(\?|$)/i)

  if (forceGoogleDrive || isGoogleDrive) {
    return <GoogleDrivePlayer key={videoUrl} videoUrl={videoUrl} title={title} />
  }

  if (isYouTube) {
    return <CustomYouTubePlayer key={videoUrl} videoUrl={videoUrl} title={title} onDurationLoad={onDurationLoad} />
  }

  if (isDirectVideo) {
    return (
      <video
        src={videoUrl}
        controls
        autoPlay
        className="w-full h-full rounded-lg"
        title={title}
        crossOrigin="anonymous"
      >
        Your browser does not support the video tag.
      </video>
    )
  }

  return (
    <iframe
      src={videoUrl}
      title={title}
      className="w-full h-full rounded-lg"
      allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
      allowFullScreen
      sandbox="allow-same-origin allow-scripts allow-presentation allow-forms"
    />
  )
}
