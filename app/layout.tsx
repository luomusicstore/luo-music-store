import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import Script from "next/script"
import { ModernSidebar } from "@/components/modern-sidebar"
import { ModernHeader } from "@/components/modern-header"
import { MobileNav } from "@/components/mobile-nav"
import { ThemeProvider } from "@/components/theme-provider"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL("https://luomusicstore.com"),
  title: {
    default: "Luo Music Store - Download Latest Music, Videos, Movies & News",
    template: "%s | Luo Music Store",
  },
  description:
    "Luo Music Store - Your premier destination for downloading the latest Luo music, music videos, movies, and entertainment news. Stream and download high-quality audio and video content. Every Luo Vybs in one place.",
  keywords: [
    "Luo music",
    "Luo songs",
    "download Luo music",
    "Luo music videos",
    "Luo movies",
    "African music",
    "East African music",
    "Kenyan music",
    "Luo entertainment",
    "Benga music",
    "Ohangla music",
    "Luo gospel",
    "free music download",
    "stream Luo music",
    "Luo music store",
    "Every Luo Vybs",
  ],
  authors: [{ name: "Luo Music Store" }],
  creator: "Luo Music Store",
  publisher: "Luo Music Store",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://luomusicstore.com",
    title: "Luo Music Store - Download Latest Music, Videos & Movies",
    description:
      "Your premier destination for Luo music, videos, movies and entertainment. Stream and download high-quality content. Every Luo Vybs!",
    siteName: "Luo Music Store",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Luo Music Store - Every Luo Vybs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Luo Music Store - Download Latest Music, Videos & Movies",
    description: "Your premier destination for Luo music, videos, movies and entertainment. Every Luo Vybs!",
    images: ["/logo.png"],
    creator: "@luomusicstore",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://luomusicstore.com",
  },
  category: "entertainment",
  generator: "v0.app",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a2e" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Luo Music Store",
              alternateName: "Every Luo Vybs",
              url: "https://luomusicstore.com",
              description: "Premier destination for Luo music, videos, movies and entertainment",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://luomusicstore.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <Script
          src="//pl26929388.effectivegatecpm.com/94/0f/bb/940fbba32a97c28245c385906d210a3e.js"
          strategy="afterInteractive"
        />
      </head>
      <body className={`font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <ModernSidebar />
            <main className="lg:ml-56">
              <ModernHeader />
              {children}
            </main>
            <MobileNav />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
