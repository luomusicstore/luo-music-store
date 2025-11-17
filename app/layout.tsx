import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import Script from "next/script"
import { SidebarNav } from "@/components/sidebar-nav"
import { MobileNav } from "@/components/mobile-nav"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Luo Music Store - Download Videos, Music & Images",
  description: "Browse and download videos, music, and images from multiple platforms",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="//pl26929388.effectivegatecpm.com/94/0f/bb/940fbba32a97c28245c385906d210a3e.js"
          strategy="afterInteractive"
        />
      </head>
      <body className={`font-sans antialiased bg-gradient-to-br from-gray-50 via-white to-purple-50/30`}>
        <AuthProvider>
          <SidebarNav />
          <main className="lg:ml-64">
            {children}
          </main>
          <MobileNav />
          <Toaster />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
