"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { RichTextEditor } from "@/components/rich-text-editor"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { Upload, Loader2 } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

export function NewsUpload() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "gospel",
    thumbnailUrl: "",
    isFeatured: false,
    videoUrl: "",
    embedCode: "",
  })

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Thumbnail must be less than 5MB",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("https://musicupload.mainplatform-nexus.workers.dev/", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const data = await response.json()
      setFormData((prev) => ({ ...prev, thumbnailUrl: data.url }))

      toast({
        title: "Success",
        description: "Thumbnail uploaded successfully",
      })
    } catch (error) {
      console.error("Error uploading thumbnail:", error)
      toast({
        title: "Error",
        description: "Failed to upload thumbnail",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.content) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      console.log("[v0] Uploading news article:", formData)
      
      const newsData = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        thumbnailUrl: formData.thumbnailUrl || "",
        author: user?.email?.split("@")[0] || "Admin",
        publishedAt: serverTimestamp(),
        views: 0,
        isFeatured: formData.isFeatured,
        videoUrl: formData.videoUrl || "",
        embedCode: formData.embedCode || "",
      }
      
      console.log("[v0] News data to upload:", newsData)

      const docRef = await addDoc(collection(db, "news"), newsData)
      
      console.log("[v0] News uploaded successfully with ID:", docRef.id)

      toast({
        title: "Success",
        description: "News article published successfully",
      })

      setFormData({
        title: "",
        content: "",
        category: "gospel",
        thumbnailUrl: "",
        isFeatured: false,
        videoUrl: "",
        embedCode: "",
      })
    } catch (error) {
      console.error("[v0] Error publishing news:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to publish news article",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload News Article</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Article Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter article title"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="featured"
              checked={formData.isFeatured}
              onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked as boolean })}
            />
            <label
              htmlFor="featured"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Mark as Featured (Display on Hero Slide)
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gospel">Gospel News</SelectItem>
                <SelectItem value="community">Community News</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail">Thumbnail Image</Label>
            <div className="flex gap-2">
              <Input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                disabled={uploading}
              />
              {uploading && <Loader2 className="w-5 h-5 animate-spin" />}
            </div>
            {formData.thumbnailUrl && (
              <img src={formData.thumbnailUrl || "/placeholder.svg"} alt="Thumbnail preview" className="w-32 h-32 object-cover rounded" />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoUrl">Video URL (Optional)</Label>
            <Input
              id="videoUrl"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              placeholder="https://youtube.com/watch?v=... or direct video URL"
            />
            <p className="text-sm text-muted-foreground">
              YouTube, Vimeo, or direct video links
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="embedCode">Embed Code (Optional)</Label>
            <Textarea
              id="embedCode"
              value={formData.embedCode}
              onChange={(e) => setFormData({ ...formData, embedCode: e.target.value })}
              placeholder='<iframe src="..." ...></iframe>'
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              Paste iframe embed code from any website
            </p>
          </div>

          <div className="space-y-2">
            <Label>Article Content *</Label>
            <RichTextEditor
              value={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
              placeholder="Write your article here... Use the toolbar to format text, add images, links, and more."
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Publish Article
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
