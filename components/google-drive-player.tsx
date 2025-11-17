"use client"

interface GoogleDrivePlayerProps {
  videoUrl: string
  title: string
}

export function GoogleDrivePlayer({ videoUrl, title }: GoogleDrivePlayerProps) {
  const getGoogleDriveEmbedUrl = (url: string) => {
    try {
      // Handle various Google Drive URL formats
      // https://drive.google.com/file/d/FILE_ID/view
      // https://drive.google.com/open?id=FILE_ID
      // https://drive.google.com/d/FILE_ID
      let fileId = ""
      
      if (url.includes("/file/d/")) {
        fileId = url.split("/file/d/")[1].split("/")[0]
      } else if (url.includes("?id=")) {
        fileId = url.split("?id=")[1].split("&")[0]
      } else if (url.includes("/d/")) {
        fileId = url.split("/d/")[1].split("/")[0]
      }
      
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`
      }
      
      return url
    } catch {
      return url
    }
  }

  const embedUrl = getGoogleDriveEmbedUrl(videoUrl)

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="autoplay; encrypted-media"
        allowFullScreen
        title={title}
        style={{ border: 'none' }}
      />
      
      <div className="absolute top-4 right-4 z-50 pointer-events-none">
        <img 
          src="/images/logo.png" 
          alt="LUO Player" 
          className="w-16 h-16 rounded-full shadow-xl border-2 border-white/20"
        />
      </div>
    </div>
  )
}
