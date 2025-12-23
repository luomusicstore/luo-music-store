"use client"

import { VideoListItem } from "@/components/video-list-item"
import { AudioCard } from "@/components/audio-card"
import { NewsCard } from "@/components/news-card"
import { useEffect, useState } from "react"
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Loader2, Heart, Headphones } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"

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
  const [topSongs, setTopSongs] = useState<Content[]>([])

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
        setAudios(audiosList.slice(0, 8))
        setTopSongs(audiosList.slice(0, 20))

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
        console.log(
          "[v0] Featured items:",
          allFeatured.map((item) => item.title),
        )

        setHeroSlides(allFeatured)
      } catch (error) {
        console.error("[v0] Error fetching content:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [])

  const handleHeroClick = () => {
    if (!heroSlides[currentSlideIndex]) return

    const currentSlide = heroSlides[currentSlideIndex]
    const isNewsSlide = "content" in currentSlide

    if (isNewsSlide) {
      // News item
      window.location.href = `/news/${currentSlide.id}`
    } else {
      // Content item
      const content = currentSlide as Content
      if (content.contentType === "audio") {
        const params = new URLSearchParams({
          id: content.id,
          title: content.title,
          thumbnail: content.thumbnailUrl,
          audioUrl: content.audioUrl || "",
          audioDownloadUrl: content.audioDownloadUrl || "",
          isGoogleDrive: content.isGoogleDriveAudio?.toString() || "false",
        })
        window.location.href = `/audio-player?${params.toString()}`
      } else {
        window.location.href = `/music-video?id=${content.id}`
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f1e] pb-24">
      {heroSlides.length > 0 && (
        <section className="mx-4 md:mx-6 mt-4">
          <Carousel
            className="w-full"
            plugins={[
              Autoplay({
                delay: 5000,
                stopOnInteraction: true,
                stopOnMouseEnter: true,
              }),
            ]}
          >
            <CarouselContent>
              {heroSlides.map((slide, index) => {
                const isNewsSlide = "content" in slide
                const item = slide as Content | NewsItem

                return (
                  <CarouselItem key={`${item.id}-${index}`}>
                    <div
                      className="relative h-48 md:h-72 overflow-hidden rounded-xl cursor-pointer group"
                      onClick={() => {
                        if (isNewsSlide) {
                          window.location.href = `/news/${item.id}`
                        } else {
                          const content = item as Content
                          if (content.contentType === "audio") {
                            const params = new URLSearchParams({
                              id: content.id,
                              title: content.title,
                              thumbnail: content.thumbnailUrl,
                              audioUrl: content.audioUrl || "",
                              audioDownloadUrl: content.audioDownloadUrl || "",
                              isGoogleDrive: content.isGoogleDriveAudio?.toString() || "false",
                            })
                            window.location.href = `/audio-player?${params.toString()}`
                          } else {
                            window.location.href = `/music-video?id=${content.id}`
                          }
                        }
                      }}
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-105"
                        style={{
                          backgroundImage: `url(${item.thumbnailUrl || "/placeholder.svg"}), linear-gradient(135deg, #d4617a 0%, #e89b9e 35%, #f5c4a8 70%, #7dd3d9 100%)`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                      </div>
                      <div className="relative h-full flex flex-col justify-end p-3 md:p-4">
                        <p className="text-white/80 text-[10px] mb-0.5 font-medium">Featured</p>
                        <h1 className="text-sm md:text-base font-semibold text-white mb-1 leading-tight line-clamp-1">
                          {item.title}
                        </h1>
                        {!isNewsSlide && (
                          <p className="text-white/70 text-[10px] mb-2">
                            {(item as Content).source} • {(item as Content).views} views
                          </p>
                        )}
                        <Button className="w-fit bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full text-[10px]">
                          Play Now
                        </Button>
                      </div>
                    </div>
                  </CarouselItem>
                )
              })}
            </CarouselContent>
            <CarouselPrevious className="left-2 md:left-4" />
            <CarouselNext className="right-2 md:right-4" />
          </Carousel>
        </section>
      )}

      <section className="px-6 py-4 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Best albums of all time</h2>
        </div>

        {/* Auto-scrolling marquee */}
        <div className="relative">
          <div className="flex gap-3 animate-marquee hover:pause-marquee">
            {/* Duplicate items for seamless loop */}
            {[...audios, ...audios].map((audio, index) => (
              <Link
                key={`${audio.id}-${index}`}
                href={`/audio-player?${new URLSearchParams({
                  id: audio.id,
                  title: audio.title,
                  thumbnail: audio.thumbnailUrl,
                  audioUrl: audio.audioUrl || "",
                  audioDownloadUrl: audio.audioDownloadUrl || "",
                }).toString()}`}
                className="group cursor-pointer flex-shrink-0"
              >
                <div className="relative w-24 h-24 rounded-lg overflow-hidden mb-1.5">
                  <Image
                    src={audio.thumbnailUrl || "/placeholder.svg"}
                    alt={audio.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <h3 className="font-semibold text-[10px] text-gray-900 dark:text-white truncate w-24">{audio.title}</h3>
                <p className="text-[9px] text-gray-600 dark:text-gray-400 truncate w-24">{audio.source}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">This week's top #20</h2>
          <Link href="/audio" className="text-purple-600 hover:text-purple-700 font-medium text-xs">
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {topSongs.slice(0, 4).map((song, index) => (
            <Link
              key={song.id}
              href={`/audio-player?${new URLSearchParams({
                id: song.id,
                title: song.title,
                thumbnail: song.thumbnailUrl,
                audioUrl: song.audioUrl || "",
                audioDownloadUrl: song.audioDownloadUrl || "",
              }).toString()}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group bg-white dark:bg-gray-800/30 shadow-sm"
            >
              <span className="text-purple-600 dark:text-purple-400 w-8 text-center font-bold text-sm">
                #{index + 1}
              </span>
              <Image
                src={song.thumbnailUrl || "/placeholder.svg"}
                alt={song.title}
                width={48}
                height={48}
                className="rounded"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">{song.title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{song.source}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Headphones className="w-3.5 h-3.5" />
                  <span>{song.viewCount.toLocaleString()}</span>
                </div>
                <span className="w-12 text-right">{song.duration}</span>
              </div>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Heart className="w-4 h-4 text-gray-400 hover:text-red-500" />
              </button>
            </Link>
          ))}
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-6 space-y-8">
        {movies.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Latest Movies</h2>
              <Link href="/movies" className="text-purple-600 hover:text-purple-700 font-medium text-xs">
                See All →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {movies.map((movie) => (
                <VideoListItem key={movie.id} {...movie} thumbnail={movie.thumbnailUrl} forceGoogleDrive={true} />
              ))}
            </div>
          </section>
        )}

        {videos.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Trending Music Videos</h2>
              <Link href="/music-video" className="text-purple-600 hover:text-purple-700 font-medium text-xs">
                See All →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {videos.map((video) => (
                <VideoListItem key={video.id} {...video} thumbnail={video.thumbnailUrl} />
              ))}
            </div>
          </section>
        )}

        {audios.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Popular Audio</h2>
              <Link href="/audio" className="text-purple-600 hover:text-purple-700 font-medium text-xs">
                See All →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-2">
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Latest News</h2>
              <Link href="/news" className="text-purple-600 hover:text-purple-700 font-medium text-xs">
                See All →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {news.map((item) => (
                <NewsCard key={item.id} {...item} />
              ))}
            </div>
          </section>
        )}

        {movies.length === 0 && videos.length === 0 && audios.length === 0 && news.length === 0 && (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No content available yet.</p>
            <p className="text-xs mt-2">Admin can upload content from the admin panel.</p>
          </div>
        )}
      </div>
    </div>
  )
}
