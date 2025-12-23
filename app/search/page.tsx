"use client"

import { VideoListItem } from "@/components/video-list-item"
import { useEffect, useState, Suspense } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Loader2, Search } from "lucide-react"
import { useSearchParams } from "next/navigation"

interface Video {
  id: string
  title: string
  thumbnailUrl: string
  duration: string
  source: string
  views: string
  viewCount: number
  category: string
  videoUrl: string
  videoDownloadUrl?: string
  audioDownloadUrl?: string
  contentType?: string
  audioUrl?: string
}

function SearchResults() {
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get("q") || ""
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const searchVideos = async () => {
      if (!searchQuery.trim()) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const contentRef = collection(db, "content")
        const querySnapshot = await getDocs(contentRef)
        const allVideos: Video[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          const isAudio = Array.isArray(data.categories) && data.categories.includes("audio")
          allVideos.push({
            id: doc.id,
            title: data.title,
            thumbnailUrl: data.thumbnailUrl,
            duration: data.duration,
            source: data.source,
            views: data.views,
            viewCount: data.viewCount || 0,
            category: data.categories || data.category || "",
            videoUrl: data.videoUrl || "",
            videoDownloadUrl: data.videoDownloadUrl || "",
            audioDownloadUrl: data.audioDownloadUrl || "",
            contentType: isAudio ? "audio" : "video",
            audioUrl: data.audioUrl || "",
          })
        })

        const searchLower = searchQuery.toLowerCase()
        const filteredVideos = allVideos.filter((video) => {
          const titleMatch = video.title.toLowerCase().includes(searchLower)
          const sourceMatch = video.source.toLowerCase().includes(searchLower)
          const categoryMatch = Array.isArray(video.category)
            ? video.category.some((cat: string) => cat.toLowerCase().includes(searchLower))
            : video.category.toLowerCase().includes(searchLower)

          return titleMatch || sourceMatch || categoryMatch
        })

        setVideos(filteredVideos)
      } catch (error) {
        console.error("Error searching videos:", error)
      } finally {
        setLoading(false)
      }
    }

    searchVideos()
  }, [searchQuery])

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
      <div className="max-w-screen-xl mx-auto px-4 py-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Search results for "{searchQuery}"</h2>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? "Searching..." : `${videos.length} result${videos.length !== 1 ? "s" : ""} found`}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : videos.length > 0 ? (
          <div className="space-y-2">
            {videos.map((video) => (
              <VideoListItem
                key={video.id}
                {...video}
                thumbnail={video.thumbnailUrl}
                viewCount={video.viewCount}
                contentType={video.contentType}
                audioUrl={video.audioUrl}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No results found for "{searchQuery}"</p>
            <p className="text-gray-400 text-sm mt-2">Try different keywords or check your spelling</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  )
}
