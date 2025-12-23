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
import { Loader2, Upload, FileAudio, ImageIcon, X, Link2, VideoIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export function ContentUpload() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [audioUploadMethod, setAudioUploadMethod] = useState<"direct" | "googledrive">("direct")
  const [videoUploadMethod, setVideoUploadMethod] = useState<"direct" | "googledrive">("direct")

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
    isFeatured: false,
    isGoogleDriveAudio: false,
  })

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, categories: [...formData.categories, category] })
    } else {
      setFormData({ ...formData, categories: formData.categories.filter((c) => c !== category) })
    }
  }

  const handleThumbnailFileUpload = async (file: File) => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "Image size exceeds 10MB limit. Please choose a smaller file.",
        variant: "destructive",
      })
      return
    }

    setUploadingThumbnail(true)
    try {
      console.log("[v0] Uploading thumbnail:", file.name, "Size:", file.size, "bytes")

      const formDataUpload = new FormData()
      formDataUpload.append("file", file)

      const response = await fetch("https://musicupload.mainplatform-nexus.workers.dev/", {
        method: "POST",
        body: formDataUpload,
      })

      console.log("[v0] Upload response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[v0] Upload error response:", errorData)
        throw new Error(errorData.message || errorData.error || `Upload failed with status ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Upload success:", data)

      if (data.success && data.url) {
        setFormData({
          ...formData,
          thumbnailUrl: data.url,
        })

        toast({
          title: "Success!",
          description: "Thumbnail uploaded successfully.",
        })
      } else {
        throw new Error("Upload succeeded but no URL returned")
      }
    } catch (error) {
      console.error("[v0] Error uploading thumbnail:", error)
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload thumbnail. Please try again.",
        variant: "destructive",
      })
      setThumbnailFile(null)
    } finally {
      setUploadingThumbnail(false)
    }
  }

  const handleAudioFileUpload = async (file: File) => {
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "File size exceeds 100MB limit. Please choose a smaller file.",
        variant: "destructive",
      })
      return
    }

    setUploadingAudio(true)
    try {
      console.log("[v0] Uploading audio:", file.name, "Size:", file.size, "bytes")

      const formDataUpload = new FormData()
      formDataUpload.append("file", file)

      const response = await fetch("https://musicupload.mainplatform-nexus.workers.dev/", {
        method: "POST",
        body: formDataUpload,
      })

      console.log("[v0] Upload response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[v0] Upload error response:", errorData)
        throw new Error(errorData.message || errorData.error || `Upload failed with status ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Upload success:", data)

      if (data.success && data.url) {
        setFormData({
          ...formData,
          audioUrl: data.url,
          audioDownloadUrl: data.url,
          isGoogleDriveAudio: false,
        })

        toast({
          title: "Success!",
          description: "Audio file uploaded successfully.",
        })
      } else {
        throw new Error("Upload succeeded but no URL returned")
      }
    } catch (error) {
      console.error("[v0] Error uploading audio:", error)
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload audio file. Please try again.",
        variant: "destructive",
      })
      setAudioFile(null)
    } finally {
      setUploadingAudio(false)
    }
  }

  const handleVideoFileUpload = async (file: File) => {
    const maxSize = 500 * 1024 * 1024 // 500MB for videos
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "Video size exceeds 500MB limit. Please choose a smaller file.",
        variant: "destructive",
      })
      return
    }

    setUploadingVideo(true)
    try {
      console.log("[v0] Uploading video:", file.name, "Size:", file.size, "bytes")

      const formDataUpload = new FormData()
      formDataUpload.append("file", file)

      const response = await fetch("https://musicupload.mainplatform-nexus.workers.dev/", {
        method: "POST",
        body: formDataUpload,
      })

      console.log("[v0] Upload response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[v0] Upload error response:", errorData)
        throw new Error(errorData.message || errorData.error || `Upload failed with status ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Upload success:", data)

      if (data.success && data.url) {
        setFormData({
          ...formData,
          videoUrl: data.url,
          videoDownloadUrl: data.url,
        })

        toast({
          title: "Success!",
          description: "Video file uploaded successfully.",
        })
      } else {
        throw new Error("Upload succeeded but no URL returned")
      }
    } catch (error) {
      console.error("[v0] Error uploading video:", error)
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload video file. Please try again.",
        variant: "destructive",
      })
      setVideoFile(null)
    } finally {
      setUploadingVideo(false)
    }
  }

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAudioFile(file)
      handleAudioFileUpload(file)
    }
  }

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setThumbnailFile(file)
      handleThumbnailFileUpload(file)
    }
  }

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setVideoFile(file)
      handleVideoFileUpload(file)
    }
  }

  const clearAudioFile = () => {
    setAudioFile(null)
    setFormData({
      ...formData,
      audioUrl: "",
      audioDownloadUrl: "",
      isGoogleDriveAudio: false,
    })
  }

  const clearThumbnailFile = () => {
    setThumbnailFile(null)
    setFormData({
      ...formData,
      thumbnailUrl: "",
    })
  }

  const clearVideoFile = () => {
    setVideoFile(null)
    setFormData({
      ...formData,
      videoUrl: "",
      videoDownloadUrl: "",
    })
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

    const isAudioSelected = formData.categories.includes("audio")
    const isMovieSelected = formData.categories.includes("movies")
    const isVideoSelected = formData.categories.includes("video")

    if (isAudioSelected && (!formData.audioUrl || !formData.thumbnailUrl)) {
      toast({
        title: "Error",
        description: "Please upload both audio file and thumbnail image.",
        variant: "destructive",
      })
      return
    }

    if ((isMovieSelected || isVideoSelected) && (!formData.videoUrl || !formData.thumbnailUrl)) {
      toast({
        title: "Error",
        description: "Please provide video URL and thumbnail URL.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      console.log("[v0] Uploading content:", formData)

      await addDoc(collection(db, "content"), {
        ...formData,
        views: "0",
        likes: 0,
        likesCount: 0,
        viewCount: 0,
        uploadedBy: user?.uid,
        uploadedAt: new Date().toISOString(),
        duration: "00:00",
      })

      console.log("[v0] Content uploaded successfully")

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
        isFeatured: false,
        isGoogleDriveAudio: false,
      })
      setAudioFile(null)
      setThumbnailFile(null)
      setVideoFile(null)
      setAudioUploadMethod("direct")
      setVideoUploadMethod("direct")
    } catch (error) {
      console.error("[v0] Error uploading content:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload content. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const isAudioSelected = formData.categories.includes("audio")
  const isMovieSelected = formData.categories.includes("movies")
  const isVideoSelected = formData.categories.includes("video")

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
                  Music Video
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="movies"
                  checked={formData.categories.includes("movies")}
                  onCheckedChange={(checked) => handleCategoryChange("movies", checked as boolean)}
                />
                <label
                  htmlFor="movies"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Movies
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
              Available categories: Music Video (music videos), Movies (full-length movies), Audio (songs/audio tracks).
              For news articles, use the News Upload tab.
            </p>
          </div>

          {isAudioSelected ? (
            <div className="space-y-4 p-4 border-2 border-purple-200 rounded-lg bg-purple-50/50">
              <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                <FileAudio className="w-5 h-5" />
                Audio Upload
              </h3>

              <div className="space-y-3">
                <Label>Upload Method *</Label>
                <RadioGroup
                  value={audioUploadMethod}
                  onValueChange={(value: "direct" | "googledrive") => {
                    setAudioUploadMethod(value)
                    setAudioFile(null)
                    setFormData({
                      ...formData,
                      audioUrl: "",
                      audioDownloadUrl: "",
                      isGoogleDriveAudio: value === "googledrive",
                    })
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="direct" id="direct" />
                    <label
                      htmlFor="direct"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Direct Upload (R2 Storage)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="googledrive" id="googledrive" />
                    <label
                      htmlFor="googledrive"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Google Drive Link
                    </label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnailFile">Thumbnail/Cover Image *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="thumbnailFile"
                    type="file"
                    accept="image/*,.jpg,.jpeg,.png,.webp,.gif"
                    onChange={handleThumbnailFileChange}
                    disabled={uploadingThumbnail}
                    className="flex-1"
                  />
                  {uploadingThumbnail && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                {thumbnailFile && (
                  <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{thumbnailFile.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(thumbnailFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearThumbnailFile}
                      className="h-7 w-7 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {formData.thumbnailUrl && (
                  <div className="p-2 rounded bg-green-500/10 border border-green-500/20">
                    <p className="text-xs text-green-700 dark:text-green-400">✓ Thumbnail uploaded successfully</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Supports JPG, PNG, WebP, GIF up to 10MB</p>
              </div>

              {audioUploadMethod === "direct" ? (
                <div className="space-y-2">
                  <Label htmlFor="audioFile">Audio File *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="audioFile"
                      type="file"
                      accept="audio/*,.mp3,.wav,.ogg,.m4a"
                      onChange={handleAudioFileChange}
                      disabled={uploadingAudio}
                      className="flex-1"
                    />
                    {uploadingAudio && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                  {audioFile && (
                    <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted">
                      <div className="flex items-center gap-2">
                        <FileAudio className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{audioFile.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(audioFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={clearAudioFile} className="h-7 w-7 p-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {formData.audioUrl && (
                    <div className="p-2 rounded bg-green-500/10 border border-green-500/20">
                      <p className="text-xs text-green-700 dark:text-green-400">✓ Audio uploaded successfully</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Supports MP3, WAV, OGG, M4A up to 100MB</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="googleDriveAudioUrl" className="flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Google Drive Audio URL *
                  </Label>
                  <Input
                    id="googleDriveAudioUrl"
                    type="url"
                    value={formData.audioUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        audioUrl: e.target.value,
                        audioDownloadUrl: e.target.value,
                        isGoogleDriveAudio: true,
                      })
                    }
                    placeholder="https://drive.google.com/file/d/..."
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Google Drive shareable link for audio playback. Make sure the file is set to "Anyone with the link
                    can view"
                  </p>
                  {formData.audioUrl && (
                    <div className="p-2 rounded bg-green-500/10 border border-green-500/20">
                      <p className="text-xs text-green-700 dark:text-green-400">✓ Google Drive link added</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {isMovieSelected ? (
            <div className="space-y-4 p-4 border-2 border-blue-200 rounded-lg bg-blue-50/50">
              <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                <VideoIcon className="w-5 h-5" />
                Movie Upload
              </h3>

              <div className="space-y-3">
                <Label>Upload Method *</Label>
                <RadioGroup
                  value={videoUploadMethod}
                  onValueChange={(value: "direct" | "googledrive") => {
                    setVideoUploadMethod(value)
                    setVideoFile(null)
                    setFormData({
                      ...formData,
                      videoUrl: "",
                      videoDownloadUrl: "",
                    })
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="direct" id="movie-direct" />
                    <label
                      htmlFor="movie-direct"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Direct Upload (R2 Storage)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="googledrive" id="movie-googledrive" />
                    <label
                      htmlFor="movie-googledrive"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Google Drive Link
                    </label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="movieThumbnailUrl">Thumbnail URL *</Label>
                <Input
                  id="movieThumbnailUrl"
                  type="url"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  placeholder="https://example.com/thumbnail.jpg"
                  required
                />
              </div>

              {videoUploadMethod === "direct" ? (
                <div className="space-y-2">
                  <Label htmlFor="movieVideoFile">Video File *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="movieVideoFile"
                      type="file"
                      accept="video/*,.mp4,.webm,.mov,.avi"
                      onChange={handleVideoFileChange}
                      disabled={uploadingVideo}
                      className="flex-1"
                    />
                    {uploadingVideo && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                  {videoFile && (
                    <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted">
                      <div className="flex items-center gap-2">
                        <VideoIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{videoFile.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={clearVideoFile} className="h-7 w-7 p-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {formData.videoUrl && (
                    <div className="p-2 rounded bg-green-500/10 border border-green-500/20">
                      <p className="text-xs text-green-700 dark:text-green-400">✓ Video uploaded successfully</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Supports MP4, WebM, MOV, AVI up to 500MB</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="videoUrl">Google Drive URL *</Label>
                    <Input
                      id="videoUrl"
                      type="url"
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      placeholder="https://drive.google.com/file/d/..."
                      required
                    />
                    <p className="text-xs text-muted-foreground">Google Drive shareable link for movie playback</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="videoDownloadUrl">Download Link *</Label>
                    <Input
                      id="videoDownloadUrl"
                      type="url"
                      value={formData.videoDownloadUrl}
                      onChange={(e) => setFormData({ ...formData, videoDownloadUrl: e.target.value })}
                      placeholder="https://example.com/download-movie.mp4"
                      required
                    />
                  </div>
                </>
              )}
            </div>
          ) : null}

          {isVideoSelected && !isMovieSelected && !isAudioSelected ? (
            <div className="space-y-4 p-4 border-2 border-red-200 rounded-lg bg-red-50/50">
              <h3 className="font-semibold text-red-900 flex items-center gap-2">
                <VideoIcon className="w-5 h-5" />
                Video Upload
              </h3>

              <div className="space-y-3">
                <Label>Upload Method *</Label>
                <RadioGroup
                  value={videoUploadMethod}
                  onValueChange={(value: "direct" | "googledrive") => {
                    setVideoUploadMethod(value)
                    setVideoFile(null)
                    setFormData({
                      ...formData,
                      videoUrl: "",
                      videoDownloadUrl: "",
                    })
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="direct" id="video-direct" />
                    <label
                      htmlFor="video-direct"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Direct Upload (R2 Storage)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="googledrive" id="video-googledrive" />
                    <label
                      htmlFor="video-googledrive"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Google Drive / YouTube Link
                    </label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoThumbnailUrl">Thumbnail URL *</Label>
                <Input
                  id="videoThumbnailUrl"
                  type="url"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  placeholder="https://example.com/thumbnail.jpg"
                  required
                />
              </div>

              {videoUploadMethod === "direct" ? (
                <div className="space-y-2">
                  <Label htmlFor="videoFile">Video File *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="videoFile"
                      type="file"
                      accept="video/*,.mp4,.webm,.mov,.avi"
                      onChange={handleVideoFileChange}
                      disabled={uploadingVideo}
                      className="flex-1"
                    />
                    {uploadingVideo && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                  {videoFile && (
                    <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted">
                      <div className="flex items-center gap-2">
                        <VideoIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{videoFile.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={clearVideoFile} className="h-7 w-7 p-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {formData.videoUrl && (
                    <div className="p-2 rounded bg-green-500/10 border border-green-500/20">
                      <p className="text-xs text-green-700 dark:text-green-400">✓ Video uploaded successfully</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Supports MP4, WebM, MOV, AVI up to 500MB</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="videoUrlYoutube">YouTube / Google Drive URL *</Label>
                    <Input
                      id="videoUrlYoutube"
                      type="url"
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      placeholder="https://youtube.com/watch?v=... or https://drive.google.com/file/d/..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="videoDownloadUrlYoutube">Video Download Link *</Label>
                    <Input
                      id="videoDownloadUrlYoutube"
                      type="url"
                      value={formData.videoDownloadUrl}
                      onChange={(e) => setFormData({ ...formData, videoDownloadUrl: e.target.value })}
                      placeholder="https://example.com/download-video.mp4"
                      required
                    />
                  </div>
                </>
              )}
            </div>
          ) : null}

          {!isAudioSelected && !isMovieSelected && !isVideoSelected ? (
            <div className="space-y-3 p-4 border-2 border-gray-200 rounded-lg bg-gray-50/50">
              <p className="text-sm text-muted-foreground">Please select a category above to see upload options</p>
            </div>
          ) : null}

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

          <Button
            type="submit"
            className="w-full"
            disabled={uploading || uploadingAudio || uploadingThumbnail || uploadingVideo}
          >
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
