"use client"

import Image from "next/image"
import Link from "next/link"
import { Clock, Eye } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface NewsCardProps {
  id: string
  title: string
  content: string
  thumbnailUrl?: string
  category: string
  author: string
  publishedAt: any
  views: number
}

export function NewsCard({ id, title, thumbnailUrl, publishedAt, category }: NewsCardProps) {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Just now"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
      {thumbnailUrl && (
        <div className="relative w-full h-48">
          <Image 
            src={thumbnailUrl || "/placeholder.svg"} 
            alt={title} 
            fill 
            className="object-cover" 
          />
        </div>
      )}
      <div className="p-6 flex flex-col gap-4 flex-1">
        <h3 className="font-bold text-xl line-clamp-2 flex-1">{title}</h3>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="capitalize text-blue-600 font-medium">{category}</span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatDate(publishedAt)}
          </span>
        </div>
        <Link href={`/news/${id}`} className="w-full">
          <Button className="w-full" variant="default">
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
        </Link>
      </div>
    </Card>
  )
}
