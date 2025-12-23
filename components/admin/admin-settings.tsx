"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Lock, CheckCircle } from "lucide-react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"

interface AdminSettingsProps {
  userEmail: string
}

export function AdminSettings({ userEmail }: AdminSettingsProps) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate inputs
      if (newPassword.length < 6) {
        toast({
          title: "Error",
          description: "New password must be at least 6 characters",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (newPassword !== confirmPassword) {
        toast({
          title: "Error",
          description: "New passwords do not match",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Verify current password
      const passwordRef = doc(db, "adminPasswords", "lightstarrecord")
      const passwordDoc = await getDoc(passwordRef)

      if (!passwordDoc.exists()) {
        toast({
          title: "Error",
          description: "No password found. Please contact support.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const storedPassword = passwordDoc.data().password

      if (storedPassword !== currentPassword) {
        toast({
          title: "Error",
          description: "Current password is incorrect",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Update password
      await setDoc(
        passwordRef,
        {
          password: newPassword,
          updatedAt: new Date().toISOString(),
          updatedBy: userEmail,
        },
        { merge: true },
      )

      toast({
        title: "Success",
        description: "Password updated successfully",
      })

      // Clear form
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      console.error("Error updating password:", error)
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            <CardTitle>Change Admin Password</CardTitle>
          </div>
          <CardDescription>Update your admin dashboard password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Update Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
