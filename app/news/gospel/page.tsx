"use client"

import { SearchHeader } from "@/components/search-header"
import { NewsCard } from "@/components/news-card"
import { useEffect, useState } from "react"
import { collection, query, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Loader2 } from 'lucide-react'

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

export default function GospelNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const q = query(collection(db, "news"))
        const querySnapshot = await getDocs(q)
        const fetchedNews: NewsItem[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          if (data.category === 'gospel') {
            fetchedNews.push({
              id: doc.id,
              title: data.title,
              content: data.content,
              thumbnailUrl: data.thumbnailUrl,
              category: data.category,
              author: data.author,
              publishedAt: data.publishedAt,
              views: data.views || 0,
            })
          }
        })

        fetchedNews.sort((a, b) => {
          const dateA = a.publishedAt?.toDate?.() || new Date(a.publishedAt || 0)
          const dateB = b.publishedAt?.toDate?.() || new Date(b.publishedAt || 0)
          return dateB.getTime() - dateA.getTime()
        })

        setNews(fetchedNews)
      } catch (error) {
        console.error("Error fetching gospel news:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
      <SearchHeader />

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">Gospel News</h1>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : news.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {news.map((item) => (
              <NewsCard key={item.id} {...item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">No gospel news available yet.</div>
        )}
      </div>
    </div>
  )
}
