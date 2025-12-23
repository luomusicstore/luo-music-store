import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get("url")
    const filename = searchParams.get("filename")

    if (!url) {
      return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
    }

    // Fetch the file from R2
    const response = await fetch(url)

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch file from storage" }, { status: response.status })
    }

    // Get the file as a blob
    const blob = await response.blob()

    // Extract filename from URL if not provided
    const finalFilename = filename || url.split("/").pop() || "download"

    // Return the file with proper headers
    return new NextResponse(blob, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${finalFilename}"`,
        "Cache-Control": "public, max-age=31536000",
      },
    })
  } catch (error) {
    console.error("Download proxy error:", error)
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 })
  }
}
