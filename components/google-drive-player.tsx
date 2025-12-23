"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

interface GoogleDrivePlayerProps {
  videoUrl: string
  title: string
}

export function GoogleDrivePlayer({ videoUrl, title }: GoogleDrivePlayerProps) {
  const [embedUrl, setEmbedUrl] = useState<string>("")

  useEffect(() => {
    const extractFileId = (url: string) => {
      let fileId = ""

      if (url.includes("/file/d/")) {
        fileId = url.split("/file/d/")[1].split("/")[0]
      } else if (url.includes("?id=")) {
        fileId = url.split("?id=")[1].split("&")[0]
      } else if (url.includes("/d/")) {
        fileId = url.split("/d/")[1].split("/")[0]
      } else if (url.match(/^[a-zA-Z0-9_-]{25,}$/)) {
        fileId = url
      }

      return fileId
    }

    const fileId = extractFileId(videoUrl)
    if (fileId) {
      setEmbedUrl(`https://drive.google.com/file/d/${fileId}/preview`)
    }
  }, [videoUrl])

  if (!embedUrl) {
    return (
      <div className="relative w-full h-full bg-black rounded-lg overflow-hidden flex items-center justify-center">
        <p className="text-white text-sm">Loading video...</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="autoplay; encrypted-media"
        allowFullScreen
        title={title}
        style={{ border: "none" }}
      />

      <div className="absolute inset-0 pointer-events-none z-40">
        {/* Top bar to block top-right menu buttons */}
        <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Luo Player" width={32} height={32} className="rounded-full" />
            <span className="text-white text-sm font-bold">LUO Player</span>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-32 h-20 bg-gradient-to-l from-black/95 via-black/80 to-transparent flex items-center justify-end pr-4">
          <div className="w-12 h-12 bg-black/70 rounded-full flex items-center justify-center">
            <Image src="/logo.png" alt="Blocked" width={24} height={24} className="rounded-full opacity-60" />
          </div>
        </div>

        {/* Bottom bar to block controls */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      <div
        className="absolute top-0 right-0 w-40 h-24 z-50 cursor-not-allowed"
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
    </div>
  )
}
