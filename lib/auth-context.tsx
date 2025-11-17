"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { type User, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, googleProvider, db } from "./firebase"

const ADMIN_EMAILS = ["mainplatform.nexus@gmail.com", "lightstarrecord@gmail.com"]

interface AuthContextType {
  user: User | null
  isAdmin: boolean
  hasActiveSubscription: boolean
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  requireLogin: (action?: { type: string; [key: string]: any }) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  hasActiveSubscription: false,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  requireLogin: () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [loading, setLoading] = useState(true)

  const checkSubscriptionStatus = async (userId: string) => {
    try {
      const userRef = doc(db, "users", userId)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        if (userData.subscription?.isActive && userData.subscription?.endDate) {
          const endDate = new Date(userData.subscription.endDate)
          const now = new Date()
          const isActive = endDate > now

          // If subscription expired, update Firebase
          if (!isActive && userData.subscription.isActive) {
            await setDoc(
              userRef,
              {
                subscription: {
                  ...userData.subscription,
                  isActive: false,
                },
              },
              { merge: true },
            )
          }

          setHasActiveSubscription(isActive)
          return isActive
        } else {
          setHasActiveSubscription(false)
          return false
        }
      }
      return false
    } catch (error) {
      console.error("Error checking subscription status:", error)
      return false
    }
  }

  const resumePendingAction = async (currentUser: User | null) => {
    const pendingActionStr = sessionStorage.getItem("pendingAction")
    if (pendingActionStr && currentUser) {
      try {
        const pendingAction = JSON.parse(pendingActionStr)
        sessionStorage.removeItem("pendingAction")

        console.log("[v0] Resuming pending action:", pendingAction)

        if (pendingAction.type === "download") {
          // Check subscription status before allowing download
          const hasSubscription = await checkSubscriptionStatus(currentUser.uid)
          
          if (!hasSubscription && !ADMIN_EMAILS.includes(currentUser.email || "")) {
            console.log("[v0] User needs subscription for download")
            // Store the pending action again so it can be resumed after subscription
            sessionStorage.setItem("pendingDownload", JSON.stringify(pendingAction))
            // Redirect to settings to subscribe
            setTimeout(() => {
              window.location.href = "/settings"
            }, 1000)
            return
          }

          // User has subscription or is admin, proceed with download
          if (pendingAction.audioDownloadUrl) {
            setTimeout(() => {
              try {
                window.open(pendingAction.audioDownloadUrl, "_blank")
              } catch (error) {
                console.error("Error resuming download:", error)
              }
            }, 1000)
          }
        }
      } catch (error) {
        console.error("Error resuming pending action:", error)
      }
    }
  }

  const requireLogin = (action?: { type: string; [key: string]: any }) => {
    if (action) {
      sessionStorage.setItem("pendingAction", JSON.stringify(action))
    }
    window.location.href = "/login"
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user) {
        const isUserAdmin = ADMIN_EMAILS.includes(user.email || "")
        setIsAdmin(isUserAdmin)

        await checkSubscriptionStatus(user.uid)

        const userRef = doc(db, "users", user.uid)
        const userDoc = await getDoc(userRef)

        if (!userDoc.exists()) {
          await setDoc(userRef, {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            isAdmin: isUserAdmin,
            createdAt: new Date().toISOString(),
          })
        } else if (userDoc.data()?.isAdmin !== isUserAdmin) {
          await setDoc(userRef, { isAdmin: isUserAdmin }, { merge: true })
        }

        await resumePendingAction(user)
      } else {
        setIsAdmin(false)
        setHasActiveSubscription(false)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)

      const isUserAdmin = ADMIN_EMAILS.includes(result.user.email || "")

      await checkSubscriptionStatus(result.user.uid)

      const userRef = doc(db, "users", result.user.uid)
      const userDoc = await getDoc(userRef)

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          isAdmin: isUserAdmin,
          createdAt: new Date().toISOString(),
        })
      } else if (userDoc.data()?.isAdmin !== isUserAdmin) {
        await setDoc(userRef, { isAdmin: isUserAdmin }, { merge: true })
      }

      await resumePendingAction(result.user)
    } catch (error) {
      console.error("Error signing in with Google:", error)
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, isAdmin, hasActiveSubscription, loading, signInWithGoogle, signOut, requireLogin }}
    >
      {children}
    </AuthContext.Provider>
  )
}
