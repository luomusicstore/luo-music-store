"use client"

import { SearchHeader } from "@/components/search-header"
import { Download, Heart, Share2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useEffect, useState } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Loader2 } from 'lucide-react'

interface ImageItem {
  id: string
  title: string
  thumbnailUrl: string
  source: string
  views: string
}

export default function ImagePage() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const q = query(collection(db, "content"), where("category", "==", "image"))
        const querySnapshot = await getDocs(q)
        const fetchedImages: ImageItem[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          fetchedImages.push({
            id: doc.id,
            title: data.title,
            thumbnailUrl: data.thumbnailUrl,
            source: data.source,
            views: data.views,
          })
        })

        setImages(fetchedImages)
      } catch (error) {
        console.error("Error fetching images:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
      <SearchHeader />

      {/* Image Gallery */}
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : images.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {images.map((image) => (
              <div key={image.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
                <div className="relative aspect-[3/4] bg-gray-100">
                  <Image
                    src={image.thumbnailUrl || "/placeholder.svg"}
                    alt={image.title}
                    fill
                    className="object-cover"
                  />

                  {/* Quick Actions Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" className="w-10 h-10 bg-white/90 hover:bg-white rounded-full">
                      <Heart className="w-5 h-5 text-gray-900" />
                    </Button>
                    <Button size="icon" className="w-10 h-10 bg-white/90 hover:bg-white rounded-full">
                      <Download className="w-5 h-5 text-gray-900" />
                    </Button>
                    <Button size="icon" className="w-10 h-10 bg-white/90 hover:bg-white rounded-full">
                      <Share2 className="w-5 h-5 text-gray-900" />
                    </Button>
                  </div>
                </div>

                {/* Image Info */}
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{image.title}</h3>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-teal-600 font-medium">{image.source}</span>
                    <span className="text-gray-500">{image.views} views</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">No images available yet.</div>
        )}
      </div>
    </div>
  )
}
