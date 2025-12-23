"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { collection, getDocs, doc, updateDoc, deleteDoc, query } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Edit, Trash2, Loader2, Save, X } from "lucide-react"
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

interface Content {
  id: string
  title: string
  thumbnailUrl: string
  videoUrl: string
  duration: string
  category: string
  source: string
  views: string
  videoDownloadUrl?: string
  audioDownloadUrl?: string
  description?: string
  isFeatured?: boolean
}

export function ContentManagement() {
  const { toast } = useToast()
  const [contents, setContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Content | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchContents()
  }, [])

  const fetchContents = async () => {
    console.log("[v0] Fetching contents from Firestore...")
    try {
      const q = query(collection(db, "content"))
      const querySnapshot = await getDocs(q)
      console.log("[v0] Query snapshot size:", querySnapshot.size)
      const contentList: Content[] = querySnapshot.docs.map((doc) => {
        console.log("[v0] Document data:", doc.id, doc.data())
        return {
          id: doc.id,
          ...doc.data(),
        }
      }) as Content[]
      console.log("[v0] Content list:", contentList)
      setContents(contentList)
    } catch (error) {
      console.error("[v0] Error fetching content:", error)
      toast({
        title: "Error",
        description: "Failed to fetch content",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (content: Content) => {
    setEditingId(content.id)
    setEditFormData(content)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditFormData(null)
  }

  const handleUpdate = async () => {
    if (!editFormData || !editingId) return

    setUpdating(true)
    try {
      const contentRef = doc(db, "content", editingId)
      await updateDoc(contentRef, {
        title: editFormData.title,
        thumbnailUrl: editFormData.thumbnailUrl,
        videoUrl: editFormData.videoUrl,
        duration: editFormData.duration,
        category: editFormData.category,
        source: editFormData.source,
        description: editFormData.description || "",
        videoDownloadUrl: editFormData.videoDownloadUrl || "",
        audioDownloadUrl: editFormData.audioDownloadUrl || "",
        isFeatured: editFormData.isFeatured || false,
      })

      toast({
        title: "Success!",
        description: "Content updated successfully",
      })

      setEditingId(null)
      setEditFormData(null)
      fetchContents()
    } catch (error) {
      console.error("Error updating content:", error)
      toast({
        title: "Error",
        description: "Failed to update content",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await deleteDoc(doc(db, "content", deleteId))
      toast({
        title: "Success!",
        description: "Content deleted successfully",
      })
      setDeleteId(null)
      fetchContents()
    } catch (error) {
      console.error("Error deleting content:", error)
      toast({
        title: "Error",
        description: "Failed to delete content",
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
          <CardTitle>Manage Content</CardTitle>
          <CardDescription>Edit or delete uploaded content ({contents.length} items)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No content found. Upload some content first.</p>
              </div>
            ) : (
              contents.map((content) => (
                <div key={content.id} className="border rounded-lg p-4">
                  {editingId === content.id && editFormData ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={editFormData.title}
                          onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <SelectItem value="video">Music Video</SelectItem>
                              <SelectItem value="movies">Movies</SelectItem>
                              <SelectItem value="audio">Audio</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Duration</Label>
                          <Input
                            value={editFormData.duration}
                            onChange={(e) => setEditFormData({ ...editFormData, duration: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`featured-${content.id}`}
                          checked={editFormData.isFeatured || false}
                          onCheckedChange={(checked) =>
                            setEditFormData({ ...editFormData, isFeatured: checked as boolean })
                          }
                        />
                        <Label htmlFor={`featured-${content.id}`} className="cursor-pointer">
                          Mark as Featured (will display on hero slide)
                        </Label>
                      </div>
                      <div className="space-y-2">
                        <Label>Thumbnail URL</Label>
                        <Input
                          value={editFormData.thumbnailUrl}
                          onChange={(e) => setEditFormData({ ...editFormData, thumbnailUrl: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Video URL</Label>
                        <Input
                          value={editFormData.videoUrl}
                          onChange={(e) => setEditFormData({ ...editFormData, videoUrl: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Video Download URL</Label>
                        <Input
                          value={editFormData.videoDownloadUrl || ""}
                          onChange={(e) => setEditFormData({ ...editFormData, videoDownloadUrl: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Audio Download URL</Label>
                        <Input
                          value={editFormData.audioDownloadUrl || ""}
                          onChange={(e) => setEditFormData({ ...editFormData, audioDownloadUrl: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Source</Label>
                        <Input
                          value={editFormData.source}
                          onChange={(e) => setEditFormData({ ...editFormData, source: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={editFormData.description || ""}
                          onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                          rows={3}
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
                      <img
                        src={content.thumbnailUrl || "/placeholder.svg"}
                        alt={content.title}
                        className="w-32 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">
                          {content.title}
                          {content.isFeatured && (
                            <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-1 rounded">Featured</span>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {content.category} • {content.duration} • {content.source}
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(content)}>
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setDeleteId(content.id)}>
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
            <AlertDialogTitle>Delete Content?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this content from the platform.
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
