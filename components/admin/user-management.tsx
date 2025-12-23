"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Users, UserCheck, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface User {
  id: string
  email: string
  displayName?: string
  photoURL?: string
  createdAt: string
  isAdmin: boolean
  subscription?: {
    isActive: boolean
    startDate: string
    endDate: string
    amount: number
  }
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "active" | "expired">("all")

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(usersQuery)
      const usersList: User[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[]
      setUsers(usersList)
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const nonAdminUsers = users.filter((u) => !u.isAdmin)
  const now = new Date()
  const activeUsers = nonAdminUsers.filter((u) => u.subscription?.isActive && new Date(u.subscription.endDate) > now)
  const expiredUsers = nonAdminUsers.filter(
    (u) => u.subscription && (!u.subscription.isActive || new Date(u.subscription.endDate) <= now),
  )
  const freeUsers = nonAdminUsers.filter((u) => !u.subscription)

  const filteredUsers = filter === "active" ? activeUsers : filter === "expired" ? expiredUsers : nonAdminUsers

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nonAdminUsers.length}</div>
            <p className="text-xs text-muted-foreground">Registered users on platform</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent" onClick={() => setFilter("active")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeUsers.length}</div>
            <p className="text-xs text-muted-foreground">Currently subscribed</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent" onClick={() => setFilter("expired")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Subscriptions</CardTitle>
            <UserCheck className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiredUsers.length}</div>
            <p className="text-xs text-muted-foreground">Subscription expired</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Free Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{freeUsers.length}</div>
            <p className="text-xs text-muted-foreground">Never subscribed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {filter === "all" ? "All Users" : filter === "active" ? "Active Users" : "Expired Users"}
          </CardTitle>
          <CardDescription>
            {filter === "all"
              ? "View all registered users with their subscription status"
              : filter === "active"
                ? "Users with active subscriptions"
                : "Users with expired subscriptions"}
          </CardDescription>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 text-sm rounded ${filter === "all" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              All ({nonAdminUsers.length})
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-3 py-1 text-sm rounded ${filter === "active" ? "bg-green-600 text-white" : "bg-gray-200"}`}
            >
              Active ({activeUsers.length})
            </button>
            <button
              onClick={() => setFilter("expired")}
              className={`px-3 py-1 text-sm rounded ${filter === "expired" ? "bg-red-600 text-white" : "bg-gray-200"}`}
            >
              Expired ({expiredUsers.length})
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No users found in this category</p>
            ) : (
              filteredUsers.map((user) => {
                const isExpired = user.subscription && new Date(user.subscription.endDate) <= now
                const isActive = user.subscription?.isActive && !isExpired

                return (
                  <div key={user.id} className="flex items-center gap-4 border-b pb-4 last:border-0">
                    <Avatar>
                      <AvatarImage src={user.photoURL || "/placeholder.svg"} />
                      <AvatarFallback>{user.displayName?.[0] || user.email[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{user.displayName || "No Name"}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                      {user.subscription && (
                        <p className={`text-xs font-medium mt-1 ${isActive ? "text-green-600" : "text-red-600"}`}>
                          {isActive
                            ? `Active until: ${new Date(user.subscription.endDate).toLocaleDateString()}`
                            : `Expired: ${new Date(user.subscription.endDate).toLocaleDateString()}`}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {isActive ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                          Active
                        </span>
                      ) : isExpired ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">Expired</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">Free</span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
