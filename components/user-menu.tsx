"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, Shield, User } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { AdminPasswordDialog } from "./admin-password-dialog"
import { useRouter } from "next/navigation"

const SUPER_ADMIN_EMAIL = "mainplatform.nexus@gmail.com"

export function UserMenu() {
  const { user, isAdmin, signInWithGoogle, signOut } = useAuth()
  const [showAdminPasswordDialog, setShowAdminPasswordDialog] = useState(false)
  const router = useRouter()

  const handleAdminPanelClick = (e: React.MouseEvent) => {
    e.preventDefault()

    if (user?.email === SUPER_ADMIN_EMAIL) {
      router.push("/admin")
      return
    }

    const isVerified = sessionStorage.getItem("adminPasswordVerified") === "true"

    if (isVerified) {
      router.push("/admin")
    } else {
      setShowAdminPasswordDialog(true)
    }
  }

  const handlePasswordSuccess = () => {
    router.push("/admin")
  }

  if (!user) {
    return (
      <Button
        onClick={signInWithGoogle}
        variant="outline"
        className="h-10 rounded-xl border-gray-200 hover:bg-gray-50 bg-transparent text-xs sm:text-sm px-2 sm:px-4"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span className="hidden sm:inline">Sign in with </span>Google
      </Button>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full p-0 shrink-0">
            <Avatar className="h-9 w-9 sm:h-10 sm:w-10 ring-2 ring-purple-500/20">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-semibold">
                {user.displayName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex items-center gap-2 p-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
              <AvatarFallback>{user.displayName?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user.displayName}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleAdminPanelClick}>
                <Shield className="mr-2 h-4 w-4" />
                Admin Panel
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isAdmin && user?.email !== SUPER_ADMIN_EMAIL && (
        <AdminPasswordDialog
          open={showAdminPasswordDialog}
          onOpenChange={setShowAdminPasswordDialog}
          onSuccess={handlePasswordSuccess}
          userEmail={user.email || ""}
        />
      )}
    </>
  )
}
