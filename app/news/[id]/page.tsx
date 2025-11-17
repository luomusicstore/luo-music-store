"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc, updateDoc, increment } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { SearchHeader } from "@/components/search-header"
import { Loader2, Clock, Eye, ArrowLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { GoogleDrivePlayer } from "@/components/google-drive-player"

interface NewsArticle {
  id: string
  title: string
  content: string
  thumbnailUrl?: string
  category: string
  author: string
  publishedAt: any
  views: number
  videoUrl?: string
  embedCode?: string
}

export default function NewsArticlePage() {
  const params = useParams()
  const router = useRouter()
  const [article, setArticle] = useState<NewsArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchArticle = async () => {
      if (!params.id) return

      try {
        console.log("[v0] Fetching article:", params.id)
        const docRef = doc(db, "news", params.id as string)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          console.log("[v0] Article data:", data)
          setArticle({
            id: docSnap.id,
            title: data.title,
            content: data.content,
            thumbnailUrl: data.thumbnailUrl,
            category: data.category,
            author: data.author,
            publishedAt: data.publishedAt,
            views: data.views || 0,
            videoUrl: data.videoUrl,
            embedCode: data.embedCode,
          })

          try {
            await updateDoc(docRef, {
              views: increment(1),
            })
          } catch (updateError) {
            console.log("[v0] Could not update view count (permissions):", updateError)
          }
        } else {
          console.log("[v0] Article not found")
          setError("Article not found")
        }
      } catch (error) {
        console.error("[v0] Error fetching article:", error)
        setError("Failed to load article. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchArticle()
  }, [params.id])

  const getYouTubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`
    }
    return url
  }

  const isGoogleDriveVideo = (url: string) => {
    return url.includes("drive.google.com") || url.includes("docs.google.com")
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Just now"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
        <SearchHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
        <SearchHeader />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">{error || "Article not found"}</h1>
          <Button onClick={() => router.push("/news")}>Back to News</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
      <SearchHeader />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <article className="bg-white rounded-lg shadow-lg overflow-hidden">
          {article.thumbnailUrl && (
            <div className="relative w-full h-64 md:h-96">
              <Image src={article.thumbnailUrl || "/placeholder.svg"} alt={article.title} fill className="object-cover" />
            </div>
          )}

          <div className="p-6 md:p-8">
            <div className="mb-4">
              <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold mb-2 capitalize">
                {article.category}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4">{article.title}</h1>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b">
              <span className="font-medium">{article.author}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDate(article.publishedAt)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {article.views} views
              </span>
            </div>

            {article.videoUrl && (
              <div className="mb-6">
                <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                  {isGoogleDriveVideo(article.videoUrl) ? (
                    <GoogleDrivePlayer videoUrl={article.videoUrl} title={article.title} />
                  ) : (
                    <iframe
                      src={getYouTubeEmbedUrl(article.videoUrl)}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      sandbox="allow-scripts allow-same-origin allow-presentation"
                    />
                  )}
                </div>
              </div>
            )}

            {article.embedCode && (
              <div className="mb-6">
                <div 
                  className="relative w-full aspect-video bg-black rounded-lg overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: article.embedCode }}
                />
              </div>
            )}

            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>
        </article>
      </div>
    </div>
  )
}
