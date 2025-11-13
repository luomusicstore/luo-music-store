"use client"

import { SearchHeader } from "@/components/search-header"
import { CategoryTabs } from "@/components/category-tabs"
import { MacOSNav } from "@/components/macos-nav"
import { AudioCard } from "@/components/audio-card"
import { useEffect, useState } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"

interface AudioItem {
  id: string
  title: string
  thumbnailUrl: string
  source: string
  duration: string
  audioUrl: string
  audioDownloadUrl: string
  viewCount?: number
}

export default function AudioPage() {
  const [audios, setAudios] = useState<AudioItem[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const audioId = searchParams.get("id")
  const autoplay = searchParams.get("autoplay") === "true"

  useEffect(() => {
    const fetchAudios = async () => {
      try {
        const q = query(collection(db, "content"), where("categories", "array-contains", "audio"))
        const querySnapshot = await getDocs(q)
        const fetchedAudios: AudioItem[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          fetchedAudios.push({
            id: doc.id,
            title: data.title,
            thumbnailUrl: data.thumbnailUrl,
            source: data.source,
            duration: data.duration,
            audioUrl: data.audioUrl || data.videoUrl,
            audioDownloadUrl: data.audioDownloadUrl,
            viewCount: data.viewCount || 0,
          })
        })

        setAudios(fetchedAudios)

        if (audioId && autoplay) {
          setTimeout(() => {
            const audioElement = document.querySelector(`[data-audio-id="${audioId}"]`)
            if (audioElement) {
              audioElement.scrollIntoView({ behavior: "smooth", block: "center" })
              const playButton = audioElement.querySelector("[data-play-button]") as HTMLButtonElement
              if (playButton) {
                playButton.click()
              }
            }
          }, 500)
        }
      } catch (error) {
        console.error("Error fetching audios:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAudios()
  }, [audioId, autoplay])

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <SearchHeader />
      <CategoryTabs />

      {/* Audio Gallery */}
      <div className="max-w-screen-xl mx-auto px-4 py-6 mb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : audios.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {audios.map((audio) => (
              <AudioCard key={audio.id} {...audio} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">No audio tracks available yet.</div>
        )}
      </div>

      <MacOSNav />
    </div>
  )
}
