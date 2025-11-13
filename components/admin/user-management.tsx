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
  const subscribedUsers = nonAdminUsers.filter((u) => u.subscription?.isActive)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribed Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscribedUsers.length}</div>
            <p className="text-xs text-muted-foreground">Active subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Free Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nonAdminUsers.filter((u) => !u.subscription?.isActive).length}</div>
            <p className="text-xs text-muted-foreground">Users on free plan</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>View all registered users with their subscription status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {nonAdminUsers.map((user) => (
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
                  {user.subscription?.isActive && (
                    <p className="text-xs text-green-600 font-medium mt-1">
                      Active until: {new Date(user.subscription.endDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {user.subscription?.isActive ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      Subscribed
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">Free</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
