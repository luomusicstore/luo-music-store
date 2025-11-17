"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"

interface GoogleDriveAudioPlayerProps {
  driveUrl: string
  autoPlay?: boolean
  className?: string
}

export function GoogleDriveAudioPlayer({
  driveUrl,
  autoPlay = false,
  className = "",
}: GoogleDriveAudioPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [embedUrl, setEmbedUrl] = useState<string>("")
  const [error, setError] = useState<string>("")

  useEffect(() => {
    console.log("[v0] Google Drive URL received:", driveUrl)
    
    const extractFileId = (url: string) => {
      const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]+)/, // Standard /file/d/{fileId}
        /id=([a-zA-Z0-9_-]+)/, // id= parameter
        /\/open\?id=([a-zA-Z0-9_-]+)/, // /open?id=
        /\/d\/([a-zA-Z0-9_-]+)/, // Just /d/
        /^([a-zA-Z0-9_-]{25,})$/, // Just the file ID itself (25+ chars)
      ]

      for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match && match[1]) {
          console.log("[v0] Extracted file ID:", match[1])
          return match[1]
        }
      }
      
      console.log("[v0] No file ID found in URL")
      return null
    }

    const fileId = extractFileId(driveUrl)
    if (fileId) {
      const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`
      console.log("[v0] Generated preview URL:", previewUrl)
      setEmbedUrl(previewUrl)
      setError("")
    } else {
      console.error("[v0] Invalid Google Drive URL format:", driveUrl)
      setError("Invalid Google Drive URL. Please use a valid share link.")
    }
  }, [driveUrl])

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg border border-red-200">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  if (!embedUrl) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-600">Loading Google Drive audio...</p>
      </div>
    )
  }

  return (
    <div className={`relative w-full ${className}`}>
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="w-full h-[200px] rounded-lg bg-gray-900"
        allow="autoplay; encrypted-media"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        style={{ border: 'none' }}
        title="Google Drive Audio Player"
      />
      <div className="absolute top-2 right-2 z-50 pointer-events-none">
        <img 
          src="/images/logo.png" 
          alt="LUO Player" 
          className="w-12 h-12 rounded-full shadow-lg"
        />
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Playing from Google Drive
      </p>
    </div>
  )
}
