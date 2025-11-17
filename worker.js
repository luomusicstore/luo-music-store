// Cloudflare Worker for handling large file uploads to R2
// Deploy this to Cloudflare Workers and bind your R2 bucket

export default {
  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    try {
      if (!env.MUSIC_STORE_BUCKET) {
        console.error('R2 bucket binding not found');
        return new Response(JSON.stringify({ 
          error: 'Server configuration error', 
          message: 'R2 bucket binding not configured. Please add MUSIC_STORE_BUCKET binding in Worker settings.' 
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      if (!env.R2_PUBLIC_URL) {
        console.error('R2 public URL not configured');
        return new Response(JSON.stringify({ 
          error: 'Server configuration error', 
          message: 'R2_PUBLIC_URL environment variable not configured.' 
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Parse the multipart form data
      const formData = await request.formData();
      const file = formData.get('file');

      if (!file) {
        return new Response(JSON.stringify({ error: 'No file provided' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Check file size (100MB limit)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        return new Response(JSON.stringify({ error: 'File too large. Maximum size is 100MB' }), {
          status: 413,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop();
      const filename = `${timestamp}-${randomString}.${extension}`;

      // Get file type for proper content-type
      const contentType = file.type || 'application/octet-stream';

      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Upload to R2
      await env.MUSIC_STORE_BUCKET.put(filename, arrayBuffer, {
        httpMetadata: {
          contentType: contentType,
        },
      });

      // Construct public URL
      const publicUrl = `${env.R2_PUBLIC_URL}/${filename}`;

      // Return success response
      return new Response(JSON.stringify({
        success: true,
        url: publicUrl,
        filename: filename,
        size: file.size,
        type: contentType,
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (error) {
      console.error('Upload error:', error);
      return new Response(JSON.stringify({
        error: 'Upload failed',
        message: error.message || 'Unknown error occurred',
        stack: error.stack,
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
