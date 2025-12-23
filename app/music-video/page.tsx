"use client"

import { VideoListItem } from "@/components/video-list-item"
import { useEffect, useState } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Loader2 } from "lucide-react"

interface Video {
  id: string
  title: string
  thumbnailUrl: string
  duration: string
  source: string
  views: string
  category: string
  videoUrl: string
  videoDownloadUrl?: string
  audioDownloadUrl?: string
  contentType?: string
  audioUrl?: string
  viewCount?: number
}

export default function MusicVideoPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMusicVideos = async () => {
      try {
        const q = query(collection(db, "content"), where("categories", "array-contains", "video"))
        const querySnapshot = await getDocs(q)
        const fetchedVideos: Video[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          fetchedVideos.push({
            id: doc.id,
            title: data.title,
            thumbnailUrl: data.thumbnailUrl,
            duration: data.duration,
            source: data.source,
            views: data.views,
            category: data.categories || data.category || "",
            videoUrl: data.videoUrl || "",
            videoDownloadUrl: data.videoDownloadUrl || "",
            audioDownloadUrl: data.audioDownloadUrl || "",
            contentType: "video",
            audioUrl: data.audioUrl || "",
            viewCount: data.viewCount || 0,
          })
        })

        setVideos(fetchedVideos)
      } catch (error) {
        console.error("Error fetching music videos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMusicVideos()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
      <div className="max-w-screen-xl mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold mb-4">Music Videos</h1>
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
                contentType={video.contentType}
                audioUrl={video.audioUrl}
                viewCount={video.viewCount}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">No music videos available yet.</div>
        )}
      </div>
    </div>
  )
}
