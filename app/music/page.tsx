"use client"

import { useEffect, useState } from "react"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { VideoListItem } from "@/components/video-list-item"
import { AudioCard } from "@/components/audio-card"
import { Loader2 } from "lucide-react"

export default function MusicPage() {
  const [activeTab, setActiveTab] = useState<"video" | "audio">("video")
  const [videos, setVideos] = useState<any[]>([])
  const [audios, setAudios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true)
      try {
        const q = query(collection(db, "content"), orderBy("uploadedAt", "desc"))
        const querySnapshot = await getDocs(q)
        const videoList: any[] = []
        const audioList: any[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          const categories = data.categories || []

          if (categories.includes("video") || categories.includes("music-video")) {
            videoList.push({ id: doc.id, ...data })
          }
          if (categories.includes("audio")) {
            audioList.push({ id: doc.id, ...data })
          }
        })

        setVideos(videoList)
        setAudios(audioList)
      } catch (error) {
        console.error("Error fetching content:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">Music</h1>

        <div className="flex gap-1 mb-6 bg-gray-200 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab("video")}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === "video" ? "bg-white text-purple-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Music Videos
          </button>
          <button
            onClick={() => setActiveTab("audio")}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === "audio" ? "bg-white text-purple-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Audio
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <div>
            {activeTab === "video" ? (
              videos.length > 0 ? (
                <div className="space-y-2">
                  {videos.map((video) => (
                    <VideoListItem key={video.id} {...video} thumbnail={video.thumbnailUrl} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-gray-500">No music videos available yet.</div>
              )
            ) : audios.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {audios.map((audio) => (
                  <AudioCard key={audio.id} {...audio} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">No audio tracks available yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
