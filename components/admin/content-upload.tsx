"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { collection, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Loader2, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

export function ContentUpload() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    thumbnailUrl: "",
    videoUrl: "",
    audioUrl: "",
    categories: [] as string[],
    source: "",
    description: "",
    videoDownloadUrl: "",
    audioDownloadUrl: "",
  })

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, categories: [...formData.categories, category] })
    } else {
      setFormData({ ...formData, categories: formData.categories.filter((c) => c !== category) })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.categories.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one category.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      await addDoc(collection(db, "content"), {
        ...formData,
        views: "0",
        likes: 0,
        likesCount: 0,
        viewCount: 0,
        uploadedBy: user?.uid,
        uploadedAt: new Date().toISOString(),
        duration: "00:00", // Default placeholder, will be updated when video/audio loads
      })

      toast({
        title: "Success!",
        description: "Content uploaded successfully.",
      })

      setFormData({
        title: "",
        thumbnailUrl: "",
        videoUrl: "",
        audioUrl: "",
        categories: [],
        source: "",
        description: "",
        videoDownloadUrl: "",
        audioDownloadUrl: "",
      })
    } catch (error) {
      console.error("Error uploading content:", error)
      toast({
        title: "Error",
        description: "Failed to upload content. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-6 h-6" />
          Upload New Content
        </CardTitle>
        <CardDescription>Add music videos, movies, audio tracks or images to Luo Music Store</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter content title"
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Categories * (Select one or more)</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="video"
                  checked={formData.categories.includes("video")}
                  onCheckedChange={(checked) => handleCategoryChange("video", checked as boolean)}
                />
                <label
                  htmlFor="video"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Video
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="latest"
                  checked={formData.categories.includes("latest")}
                  onCheckedChange={(checked) => handleCategoryChange("latest", checked as boolean)}
                />
                <label
                  htmlFor="latest"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Latest
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="audio"
                  checked={formData.categories.includes("audio")}
                  onCheckedChange={(checked) => handleCategoryChange("audio", checked as boolean)}
                />
                <label
                  htmlFor="audio"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Audio
                </label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Selected: {formData.categories.length > 0 ? formData.categories.join(", ") : "None"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="thumbnailUrl">Thumbnail URL *</Label>
              <Input
                id="thumbnailUrl"
                type="url"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                placeholder="https://example.com/thumbnail.jpg"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoUrl">Video/Content URL *</Label>
            <Input
              id="videoUrl"
              type="url"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoDownloadUrl">Video Download Link *</Label>
            <Input
              id="videoDownloadUrl"
              type="url"
              value={formData.videoDownloadUrl}
              onChange={(e) => setFormData({ ...formData, videoDownloadUrl: e.target.value })}
              placeholder="https://example.com/download-video.mp4"
              required
            />
            <p className="text-xs text-muted-foreground">Direct link for users to download the video file</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audioDownloadUrl">Audio Download Link *</Label>
            <Input
              id="audioDownloadUrl"
              type="url"
              value={formData.audioDownloadUrl}
              onChange={(e) => setFormData({ ...formData, audioDownloadUrl: e.target.value })}
              placeholder="https://example.com/download-audio.mp3"
              required
            />
            <p className="text-xs text-muted-foreground">Direct link for users to download the audio file</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audioUrl">Audio URL (for Audio category)</Label>
            <Input
              id="audioUrl"
              type="url"
              value={formData.audioUrl}
              onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })}
              placeholder="https://example.com/audio.mp3"
            />
            <p className="text-xs text-muted-foreground">Direct link to the audio file (MP3, etc.)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source/Channel Name *</Label>
            <Input
              id="source"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              placeholder="e.g., T-Series"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter content description (optional)"
              rows={4}
            />
          </div>

          <Button type="submit" className="w-full" disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Content
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
