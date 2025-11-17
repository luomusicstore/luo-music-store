"use client"

import { SearchHeader } from "@/components/search-header"
import { VideoListItem } from "@/components/video-list-item"
import { AudioCard } from "@/components/audio-card"
import { NewsCard } from "@/components/news-card"
import { useEffect, useState } from "react"
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Loader2, TrendingUp, Music, Film, Newspaper } from 'lucide-react'
import Link from "next/link"

interface Content {
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
  isFeatured?: boolean
  isGoogleDriveAudio?: boolean
}

interface NewsItem {
  id: string
  title: string
  content: string
  thumbnailUrl?: string
  category: string
  author: string
  publishedAt: any
  views: number
  isFeatured?: boolean
}

export default function HomePage() {
  const [movies, setMovies] = useState<Content[]>([])
  const [videos, setVideos] = useState<Content[]>([])
  const [audios, setAudios] = useState<Content[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [heroSlides, setHeroSlides] = useState<(Content | NewsItem)[]>([])
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        console.log("[v0] Starting to fetch content...")
        const contentQuery = query(collection(db, "content"), orderBy("uploadedAt", "desc"), limit(20))
        const contentSnapshot = await getDocs(contentQuery)
        console.log("[v0] Fetched", contentSnapshot.size, "content items")
        
        const moviesList: Content[] = []
        const videosList: Content[] = []
        const audiosList: Content[] = []
        const featuredContent: Content[] = []

        contentSnapshot.forEach((doc) => {
          const data = doc.data()
          console.log("[v0] Content item:", doc.id, "isFeatured:", data.isFeatured)
          const categories = Array.isArray(data.categories) ? data.categories : [data.category]
          
          const item: Content = {
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
            contentType: categories.includes("audio") ? "audio" : "video",
            audioUrl: data.audioUrl || "",
            isFeatured: data.isFeatured || false,
            isGoogleDriveAudio: data.isGoogleDriveAudio || false,
          }

          if (data.isFeatured === true) {
            console.log("[v0] Adding featured content:", item.title)
            featuredContent.push(item)
          }

          if (categories.includes("movies")) moviesList.push(item)
          else if (categories.includes("audio")) audiosList.push(item)
          else if (categories.includes("video")) videosList.push(item)
        })

        setMovies(moviesList.slice(0, 4))
        setVideos(videosList.slice(0, 4))
        setAudios(audiosList.slice(0, 4))

        console.log("[v0] Starting to fetch news...")
        const newsQuery = query(collection(db, "news"), orderBy("publishedAt", "desc"), limit(6))
        const newsSnapshot = await getDocs(newsQuery)
        console.log("[v0] Fetched", newsSnapshot.size, "news items")
        const newsList: NewsItem[] = []
        const featuredNews: NewsItem[] = []

        newsSnapshot.forEach((doc) => {
          const data = doc.data()
          console.log("[v0] News item:", doc.id, "isFeatured:", data.isFeatured)
          const newsItem: NewsItem = {
            id: doc.id,
            title: data.title,
            content: data.content,
            thumbnailUrl: data.thumbnailUrl,
            category: data.category,
            author: data.author,
            publishedAt: data.publishedAt,
            views: data.views || 0,
            isFeatured: data.isFeatured || false,
          }
          
          newsList.push(newsItem)
          
          if (data.isFeatured === true) {
            console.log("[v0] Adding featured news:", newsItem.title)
            featuredNews.push(newsItem)
          }
        })

        setNews(newsList)
        
        const allFeatured = [...featuredContent, ...featuredNews]
        console.log("[v0] Total featured items:", allFeatured.length)
        console.log("[v0] Featured items:", allFeatured.map(item => item.title))
        
        if (allFeatured.length > 0) {
          setHeroSlides(allFeatured)
        } else {
          // Fallback to first available content
          const fallbackSlide = moviesList[0] || audiosList[0] || videosList[0]
          if (fallbackSlide) {
            console.log("[v0] No featured items, using fallback:", fallbackSlide.title)
            setHeroSlides([fallbackSlide])
          } else {
            console.log("[v0] No content available for hero slide")
            setHeroSlides([])
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching content:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [])

  useEffect(() => {
    if (heroSlides.length <= 1) {
      console.log("[v0] Auto-slide disabled: only", heroSlides.length, "slide(s)")
      return
    }

    console.log("[v0] Auto-slide enabled with", heroSlides.length, "slides")
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => {
        const nextIndex = (prev + 1) % heroSlides.length
        console.log("[v0] Sliding from", prev, "to", nextIndex)
        return nextIndex
      })
    }, 5000) // Changed from 8000 to 5000 for 5-second intervals

    return () => {
      console.log("[v0] Clearing auto-slide interval")
      clearInterval(interval)
    }
  }, [heroSlides]) // Changed from heroSlides.length to heroSlides

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <SearchHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </div>
    )
  }

  const currentSlide = heroSlides[currentSlideIndex]
  const isNewsSlide = currentSlide && 'content' in currentSlide

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
      <SearchHeader />

      {currentSlide && (
        <section className="relative h-[280px] lg:h-[350px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-500"
            style={{
              backgroundImage: `url(${currentSlide.thumbnailUrl || "/placeholder.svg"})`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>
          <div className="relative h-full max-w-screen-xl mx-auto px-4 lg:px-8 flex flex-col justify-end pb-8">
            <div className="text-white space-y-2 max-w-2xl">
              <div className="inline-block px-3 py-1 bg-purple-600/90 rounded-full text-xs font-semibold mb-1">
                {isNewsSlide ? "FEATURED NEWS" : "FEATURED OF THE WEEK"}
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold">{currentSlide.title}</h1>
              <p className="text-gray-200 text-sm">
                {isNewsSlide ? (currentSlide as NewsItem).author : (currentSlide as Content).source}
              </p>
              <div className="flex gap-3 pt-3">
                <Link
                  href={
                    isNewsSlide
                      ? `/news/${currentSlide.id}`
                      : (currentSlide as Content).contentType === "audio"
                      ? `/audio-player?${new URLSearchParams({
                          id: currentSlide.id,
                          title: currentSlide.title,
                          thumbnail: currentSlide.thumbnailUrl,
                          audioUrl: (currentSlide as Content).audioUrl || "",
                          audioDownloadUrl: (currentSlide as Content).audioDownloadUrl || "",
                        }).toString()}`
                      : `/movies`
                  }
                  className="px-6 py-2.5 bg-white text-black rounded-full font-semibold hover:bg-gray-100 transition-all flex items-center gap-2 text-sm"
                >
                  {isNewsSlide ? <Newspaper className="w-4 h-4" /> : (currentSlide as Content).contentType === "audio" ? <Music className="w-4 h-4" /> : <Film className="w-4 h-4" />}
                  {isNewsSlide ? "Read Article" : "Play Now"}
                </Link>
              </div>
            </div>
          </div>
          
          {heroSlides.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlideIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlideIndex ? "bg-white w-6" : "bg-white/50"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-8 space-y-12">
        {movies.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg">
                  <Film className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold">Latest Movies</h2>
              </div>
              <Link href="/movies" className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-1">
                See All →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {movies.map((movie) => (
                <VideoListItem key={movie.id} {...movie} thumbnail={movie.thumbnailUrl} forceGoogleDrive={true} />
              ))}
            </div>
          </section>
        )}

        {videos.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-pink-600" />
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold">Trending Music Videos</h2>
              </div>
              <Link href="/music-video" className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-1">
                See All →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {videos.map((video) => (
                <VideoListItem key={video.id} {...video} thumbnail={video.thumbnailUrl} />
              ))}
            </div>
          </section>
        )}

        {audios.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg">
                  <Music className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold">Popular Audio</h2>
              </div>
              <Link href="/audio" className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-1">
                See All →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {audios.map((audio) => (
                <AudioCard
                  key={audio.id}
                  id={audio.id}
                  title={audio.title}
                  thumbnailUrl={audio.thumbnailUrl}
                  source={audio.source}
                  duration={audio.duration}
                  audioUrl={audio.audioUrl}
                  audioDownloadUrl={audio.audioDownloadUrl || ""}
                  viewCount={audio.viewCount}
                  isGoogleDriveAudio={audio.isGoogleDriveAudio}
                />
              ))}
            </div>
          </section>
        )}

        {news.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg">
                  <Newspaper className="w-6 h-6 text-orange-600" />
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold">Latest News</h2>
              </div>
              <Link href="/news" className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-1">
                See All →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((item) => (
                <NewsCard key={item.id} {...item} />
              ))}
            </div>
          </section>
        )}

        {movies.length === 0 && videos.length === 0 && audios.length === 0 && news.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">No content available yet.</p>
            <p className="text-sm mt-2">Admin can upload content from the admin panel.</p>
          </div>
        )}
      </div>
    </div>
  )
}
