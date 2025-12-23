"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { SearchHeader } from "@/components/search-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Upload, Users, Wallet, Video, Newspaper, Settings } from "lucide-react"
import { ContentUpload } from "@/components/admin/content-upload"
import { ContentManagement } from "@/components/admin/content-management"
import { WalletManagement } from "@/components/admin/wallet-management"
import { UserManagement } from "@/components/admin/user-management"
import { NewsUpload } from "@/components/admin/news-upload"
import { NewsManagement } from "@/components/admin/news-management"
import { AdminSettings } from "@/components/admin/admin-settings"

const SUPER_ADMIN_EMAIL = "mainplatform.nexus@gmail.com"

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth()
  const router = useRouter()
  const [isPasswordVerified, setIsPasswordVerified] = useState(false)

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/")
      return
    }

    if (!loading && user && isAdmin) {
      if (user.email === SUPER_ADMIN_EMAIL) {
        setIsPasswordVerified(true)
        return
      }

      const verified = sessionStorage.getItem("adminPasswordVerified") === "true"
      if (!verified) {
        router.push("/")
      } else {
        setIsPasswordVerified(true)
      }
    }
  }, [user, isAdmin, loading, router])

  if (loading || !isPasswordVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <SearchHeader />

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage content, news, users, and finances for Luo Music Store</p>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-2">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="manage" className="gap-2">
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline">Manage</span>
            </TabsTrigger>
            <TabsTrigger value="news" className="gap-2">
              <Newspaper className="w-4 h-4" />
              <span className="hidden sm:inline">News</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="gap-2">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">Wallet</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <ContentUpload />
          </TabsContent>

          <TabsContent value="manage">
            <ContentManagement />
          </TabsContent>

          <TabsContent value="news">
            <Tabs defaultValue="upload-news" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload-news">Upload News</TabsTrigger>
                <TabsTrigger value="manage-news">Manage News</TabsTrigger>
              </TabsList>

              <TabsContent value="upload-news">
                <NewsUpload />
              </TabsContent>

              <TabsContent value="manage-news">
                <NewsManagement />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="wallet">
            <WalletManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettings userEmail={user?.email || ""} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
