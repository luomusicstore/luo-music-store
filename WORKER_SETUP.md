# Cloudflare Worker Setup Instructions

## Step 1: Create a Cloudflare Worker

1. Go to https://dash.cloudflare.com/
2. Navigate to **Workers & Pages** in the left sidebar
3. Click **Create Application**
4. Select **Create Worker**
5. Name it something like `audio-upload-worker`
6. Click **Deploy**

## Step 2: Add the Worker Code

1. After deployment, click **Edit Code**
2. Replace all the code with the contents of `worker.js`
3. Click **Save and Deploy**

## Step 3: Bind R2 Bucket

1. Go to your Worker settings
2. Click **Settings** tab
3. Navigate to **Variables and Secrets**
4. Under **R2 Bucket Bindings**, click **Add binding**
   - Variable name: `AUDIO_BUCKET`
   - R2 bucket: Select your existing R2 bucket (or create a new one)
5. Click **Save**

## Step 4: Add Environment Variables

Still in **Variables and Secrets**:

1. Add **Environment Variable**:
   - Variable name: `R2_PUBLIC_URL`
   - Value: Your R2 public URL (e.g., `https://pub-xxxxx.r2.dev`)
2. Click **Save**

## Step 5: Get Your Worker URL

1. After deployment, you'll see your Worker URL
2. It will look like: `https://audio-upload-worker.your-subdomain.workers.dev`
3. Copy this URL

## Step 6: Update Your Next.js App

Use the Worker URL in your content upload component:

\`\`\`javascript
const UPLOAD_ENDPOINT = 'https://audio-upload-worker.your-subdomain.workers.dev';
\`\`\`

## Step 7: Configure R2 Public Access (if needed)

1. Go to **R2** in your Cloudflare dashboard
2. Select your bucket
3. Click **Settings**
4. Enable **Public Access** or set up a custom domain
5. Copy the public URL

## Testing

Test the upload by sending a POST request:

\`\`\`bash
curl -X POST https://your-worker-url.workers.dev \
  -F "file=@/path/to/audio.mp3"
\`\`\`

You should receive a JSON response with the file URL.

## Notes

- The worker supports files up to 100MB
- CORS is enabled for all origins (*)
- Supported file types: MP3, WAV, OGG, M4A, JPG, PNG, WEBP, GIF
- Files are stored with unique names to prevent conflicts
