import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fileId = searchParams.get("fileId")

    if (!fileId) {
      return NextResponse.json({ error: "fileId parameter is required" }, { status: 400 })
    }

    // Google Drive direct download URL
    const googleDriveUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`

    // Fetch the file from Google Drive
    const response = await fetch(googleDriveUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch file from Google Drive" }, { status: response.status })
    }

    // Get content type from response
    const contentType = response.headers.get("Content-Type") || "video/mp4"

    // Stream the response
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
        "Accept-Ranges": "bytes",
      },
    })
  } catch (error) {
    console.error("Google Drive proxy error:", error)
    return NextResponse.json({ error: "Failed to proxy file from Google Drive" }, { status: 500 })
  }
}
