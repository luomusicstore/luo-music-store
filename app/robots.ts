import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/audio-player"],
      },
    ],
    sitemap: "https://luomusicstore.com/sitemap.xml",
  }
}
