"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Image from "next/image"

export default function LoginPage() {
  const { user, signInWithGoogle, loading } = useAuth()
  const router = useRouter()
  const [isSigningIn, setIsSigningIn] = useState(false)

  useEffect(() => {
    if (!loading && !user && !isSigningIn) {
      setIsSigningIn(true)
      signInWithGoogle().catch((error) => {
        console.error("Auto sign-in failed:", error)
        setIsSigningIn(false)
      })
    }
  }, [loading, user, signInWithGoogle, isSigningIn])

  useEffect(() => {
    if (user && !loading) {
      router.push("/")
    }
  }, [user, loading, router])

  if (loading || isSigningIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <Image 
              src="/images/logo.png" 
              alt="Luo Music Store" 
              width={80} 
              height={80}
              className="rounded-full"
            />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Signing you in...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="p-8 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <Image 
            src="/images/logo.png" 
            alt="Luo Music Store" 
            width={100} 
            height={100}
            className="rounded-full"
          />
        </div>
        <h1 className="text-2xl font-bold text-center mb-6">Sign In Required</h1>
        <p className="text-gray-600 text-center mb-6">Please sign in with Google to continue</p>
        <Button onClick={signInWithGoogle} className="w-full" size="lg">
          Sign in with Google
        </Button>
      </Card>
    </div>
  )
}
