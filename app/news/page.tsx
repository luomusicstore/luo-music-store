"use client"

import { NewsCard } from "@/components/news-card"
import { useEffect, useState } from "react"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Loader2, Newspaper, Church, Users } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface NewsItem {
  id: string
  title: string
  content: string
  thumbnailUrl?: string
  category: string
  author: string
  publishedAt: any
  views: number
}

export default function NewsPage() {
  const [allNews, setAllNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        console.log("[v0] Fetching news articles...")
        const q = query(collection(db, "news"), orderBy("publishedAt", "desc"))
        const querySnapshot = await getDocs(q)
        const fetchedNews: NewsItem[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          console.log("[v0] News article:", doc.id, data.title, "Category:", data.category)
          fetchedNews.push({
            id: doc.id,
            title: data.title,
            content: data.content,
            thumbnailUrl: data.thumbnailUrl,
            category: data.category || "general",
            author: data.author,
            publishedAt: data.publishedAt,
            views: data.views || 0,
          })
        })

        console.log("[v0] Total news fetched:", fetchedNews.length)
        setAllNews(fetchedNews)
      } catch (error) {
        console.error("[v0] Error fetching news:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [])

  const gospelNews = allNews.filter((item) => item.category === "gospel")
  const communityNews = allNews.filter((item) => item.category === "community")

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">News</h1>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6 bg-white border">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Newspaper className="w-4 h-4" />
              All News
            </TabsTrigger>
            <TabsTrigger value="gospel" className="flex items-center gap-2">
              <Church className="w-4 h-4" />
              Gospel News
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Community News
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : allNews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allNews.map((item) => (
                  <NewsCard key={item.id} {...item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">No news available yet.</div>
            )}
          </TabsContent>

          <TabsContent value="gospel">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : gospelNews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gospelNews.map((item) => (
                  <NewsCard key={item.id} {...item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">No gospel news available yet.</div>
            )}
          </TabsContent>

          <TabsContent value="community">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : communityNews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {communityNews.map((item) => (
                  <NewsCard key={item.id} {...item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">No community news available yet.</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
