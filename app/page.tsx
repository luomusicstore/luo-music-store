"use client"

import { SearchHeader } from "@/components/search-header"
import { CategoryTabs } from "@/components/category-tabs"
import { VideoListItem } from "@/components/video-list-item"
import { MacOSNav } from "@/components/macos-nav"
import { useEffect, useState } from "react"
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Loader2 } from "lucide-react"

interface Video {
  id: string
  title: string
  thumbnailUrl: string
  duration: string
  source: string
  views: string
  viewCount: number
  category: string | string[]
  videoUrl: string
  videoDownloadUrl?: string
  audioDownloadUrl?: string
  contentType?: string
  audioUrl?: string
}

export default function HomePage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const q = query(collection(db, "content"), orderBy("uploadedAt", "desc"), limit(20))
        const querySnapshot = await getDocs(q)
        const fetchedVideos: Video[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          const isAudio = Array.isArray(data.categories) && data.categories.includes("audio")
          fetchedVideos.push({
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

        setVideos(fetchedVideos)
      } catch (error) {
        console.error("Error fetching videos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <SearchHeader />
      <CategoryTabs />

      {/* Video Feed */}
      <div className="max-w-screen-xl mx-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
          <div className="text-center py-20 text-gray-500">
            No content available yet. Admin can upload content from the admin panel.
          </div>
        )}
      </div>

      <MacOSNav />
    </div>
  )
}
