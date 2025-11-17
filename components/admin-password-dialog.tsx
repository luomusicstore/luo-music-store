"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Lock, Loader2 } from 'lucide-react'
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface AdminPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  userEmail: string
}

export function AdminPasswordDialog({ open, onOpenChange, onSuccess, userEmail }: AdminPasswordDialogProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isCreatingPassword, setIsCreatingPassword] = useState(false)
  const [hasExistingPassword, setHasExistingPassword] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      checkExistingPassword()
      setPassword("")
      setConfirmPassword("")
      setError("")
    }
  }, [open])

  const checkExistingPassword = async () => {
    try {
      const passwordRef = doc(db, "adminPasswords", "lightstarrecord")
      const passwordDoc = await getDoc(passwordRef)
      setHasExistingPassword(passwordDoc.exists())
      setIsCreatingPassword(!passwordDoc.exists())
    } catch (error) {
      console.error("Error checking password:", error)
      setHasExistingPassword(false)
      setIsCreatingPassword(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (isCreatingPassword) {
        // Creating new password
        if (!password || password.length < 6) {
          setError("Password must be at least 6 characters")
          setLoading(false)
          return
        }

        if (password !== confirmPassword) {
          setError("Passwords do not match")
          setLoading(false)
          return
        }

        // Store password in Firestore
        const passwordRef = doc(db, "adminPasswords", "lightstarrecord")
        await setDoc(passwordRef, {
          password: password,
          email: userEmail,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })

        // Store in session
        sessionStorage.setItem("adminPasswordVerified", "true")
        onSuccess()
        onOpenChange(false)
      } else {
        // Verifying existing password
        const passwordRef = doc(db, "adminPasswords", "lightstarrecord")
        const passwordDoc = await getDoc(passwordRef)

        if (passwordDoc.exists() && passwordDoc.data().password === password) {
          sessionStorage.setItem("adminPasswordVerified", "true")
          onSuccess()
          onOpenChange(false)
        } else {
          setError("Incorrect password")
        }
      }
    } catch (error) {
      console.error("Error with password:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (hasExistingPassword === null) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Lock className="w-5 h-5 text-blue-600" />
            </div>
            <DialogTitle>
              {isCreatingPassword ? "Create Admin Password" : "Enter Admin Password"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isCreatingPassword
              ? "Set up your admin password. You'll need this to access the admin dashboard."
              : "Enter your admin password to continue."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">
              {isCreatingPassword ? "Create Password" : "Password"}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isCreatingPassword ? "Enter new password" : "Enter password"}
              required
              minLength={6}
              className="h-11"
            />
          </div>

          {isCreatingPassword && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
                minLength={6}
                className="h-11"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isCreatingPassword ? "Creating..." : "Verifying..."}
              </>
            ) : (
              <>{isCreatingPassword ? "Create Password" : "Continue"}</>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
