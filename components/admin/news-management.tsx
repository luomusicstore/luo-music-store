"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RichTextEditor } from "@/components/rich-text-editor"
import { collection, getDocs, doc, updateDoc, deleteDoc, query } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Edit, Trash2, Loader2, Save, X } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface News {
  id: string
  title: string
  content: string
  category: string
  thumbnailUrl: string
  author: string
  publishedAt: any
  views: number
  isFeatured?: boolean
  videoUrl?: string
  embedCode?: string
}

export function NewsManagement() {
  const { toast } = useToast()
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<News | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      const q = query(collection(db, "news"))
      const querySnapshot = await getDocs(q)
      const newsList: News[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as News[]
      setNews(newsList)
    } catch (error) {
      console.error("Error fetching news:", error)
      toast({
        title: "Error",
        description: "Failed to fetch news articles",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (newsItem: News) => {
    setEditingId(newsItem.id)
    setEditFormData(newsItem)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditFormData(null)
  }

  const handleUpdate = async () => {
    if (!editFormData || !editingId) return

    setUpdating(true)
    try {
      const newsRef = doc(db, "news", editingId)
      await updateDoc(newsRef, {
        title: editFormData.title,
        content: editFormData.content,
        category: editFormData.category,
        thumbnailUrl: editFormData.thumbnailUrl || "",
        isFeatured: editFormData.isFeatured || false,
        videoUrl: editFormData.videoUrl || "",
        embedCode: editFormData.embedCode || "",
      })

      toast({
        title: "Success!",
        description: "News article updated successfully",
      })

      setEditingId(null)
      setEditFormData(null)
      fetchNews()
    } catch (error) {
      console.error("Error updating news:", error)
      toast({
        title: "Error",
        description: "Failed to update news article",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await deleteDoc(doc(db, "news", deleteId))
      toast({
        title: "Success!",
        description: "News article deleted successfully",
      })
      setDeleteId(null)
      fetchNews()
    } catch (error) {
      console.error("Error deleting news:", error)
      toast({
        title: "Error",
        description: "Failed to delete news article",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Manage News Articles</CardTitle>
          <CardDescription>Edit or delete published news articles ({news.length} items)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {news.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No news articles found. Publish some articles first.</p>
              </div>
            ) : (
              news.map((newsItem) => (
                <div key={newsItem.id} className="border rounded-lg p-4">
                  {editingId === newsItem.id && editFormData ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={editFormData.title}
                          onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={editFormData.category}
                          onValueChange={(value) => setEditFormData({ ...editFormData, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gospel">Gospel News</SelectItem>
                            <SelectItem value="community">Community News</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`featured-${newsItem.id}`}
                          checked={editFormData.isFeatured || false}
                          onCheckedChange={(checked) =>
                            setEditFormData({ ...editFormData, isFeatured: checked as boolean })
                          }
                        />
                        <Label htmlFor={`featured-${newsItem.id}`} className="cursor-pointer">
                          Mark as Featured (will display on hero slide)
                        </Label>
                      </div>
                      <div className="space-y-2">
                        <Label>Thumbnail URL</Label>
                        <Input
                          value={editFormData.thumbnailUrl || ""}
                          onChange={(e) => setEditFormData({ ...editFormData, thumbnailUrl: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Video URL</Label>
                        <Input
                          value={editFormData.videoUrl || ""}
                          onChange={(e) => setEditFormData({ ...editFormData, videoUrl: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Embed Code</Label>
                        <Textarea
                          value={editFormData.embedCode || ""}
                          onChange={(e) => setEditFormData({ ...editFormData, embedCode: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Content</Label>
                        <RichTextEditor
                          value={editFormData.content}
                          onChange={(content) => setEditFormData({ ...editFormData, content })}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleUpdate} disabled={updating}>
                          {updating ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={handleCancelEdit} disabled={updating}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      {newsItem.thumbnailUrl && (
                        <img
                          src={newsItem.thumbnailUrl || "/placeholder.svg"}
                          alt={newsItem.title}
                          className="w-32 h-20 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">
                          {newsItem.title}
                          {newsItem.isFeatured && (
                            <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-1 rounded">Featured</span>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {newsItem.category} • {newsItem.author} • {newsItem.views} views
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(newsItem)}>
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setDeleteId(newsItem.id)}>
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete News Article?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this news article from the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
