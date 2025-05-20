import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

// This is needed for API routes in Next.js
export const dynamic = 'force-dynamic';

// Increase the body size limit for media files
export const bodyParser = false;

/**
 * Proxy endpoint to handle CORS issues with external resources
 * This endpoint will fetch the requested resource and return it with the appropriate headers
 */
export async function GET(request: Request) {
  // Get the URL and type from the query parameters
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const type = searchParams.get('type') || ''; // Get the media type hint if provided

  if (!url) {
    return NextResponse.json(
      { success: false, error: 'Missing URL parameter' },
      { status: 400 }
    );
  }

  try {
    console.log(`Proxying request to: ${url}`);
    
    // Fetch the resource with appropriate headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch resource: ${response.status} ${response.statusText}`);
    }
    
    // Get the content type from the response
    let contentType = response.headers.get('content-type') || '';
    const originalContentType = contentType;
    
    // Log the original content type from the server
    console.log(`Original content type from server: ${originalContentType}`);
    
    // Determine content type based on URL extension and type hint
    if (!contentType || contentType === 'application/octet-stream' || type) {
      const lowerUrl = url.toLowerCase();
      
      // Audio types
      if (type === 'audio' || lowerUrl.endsWith('.mp3')) {
        contentType = 'audio/mpeg';
      } else if (lowerUrl.endsWith('.wav')) {
        contentType = 'audio/wav';
      } else if (lowerUrl.endsWith('.m4a')) {
        contentType = 'audio/mp4';
      } else if (lowerUrl.endsWith('.ogg')) {
        contentType = 'audio/ogg';
      }
      // Video types
      else if (type === 'video' || lowerUrl.endsWith('.mp4')) {
        contentType = 'video/mp4';
      } else if (lowerUrl.endsWith('.webm')) {
        contentType = 'video/webm';
      } else if (lowerUrl.endsWith('.mov')) {
        contentType = 'video/quicktime';
      }
      // Image types
      else if (type === 'image' || lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg')) {
        contentType = 'image/jpeg';
      } else if (lowerUrl.endsWith('.png')) {
        contentType = 'image/png';
      } else if (lowerUrl.endsWith('.gif')) {
        contentType = 'image/gif';
      } else if (lowerUrl.endsWith('.webp')) {
        contentType = 'image/webp';
      } else {
        // Default to octet-stream if we can't determine the type
        contentType = 'application/octet-stream';
      }
    }
    
    // Log if we changed the content type
    if (contentType !== originalContentType) {
      console.log(`Changed content type from ${originalContentType} to ${contentType}`);
    }
    
    console.log(`Proxying ${url} with content type: ${contentType}`);
    
    // Get the resource as an array buffer
    const buffer = await response.arrayBuffer();
    
    // Create a new response with the buffer and appropriate headers
    const headers = new Headers();
    
    // Set content type
    headers.set('Content-Type', contentType);
    
    // Set content length if available
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }
    
    // CORS headers
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Range, Origin, Accept');
    headers.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
    
    // Range request support
    headers.set('Accept-Ranges', 'bytes');
    
    // Caching
    // headers.set('Cache-Control', 'public, max-age=86400');
    
    // Create the response
    const proxiedResponse = new NextResponse(buffer, {
      status: 200,
      headers: headers,
    });
    
    console.log(`Successfully proxied ${url} with content type: ${contentType}`);
    
    // Add custom header for debugging
    proxiedResponse.headers.set('X-Proxy-Info', `Content-Type: ${contentType}`);
    proxiedResponse.headers.set('X-Original-Type', originalContentType || 'none');
    
    return proxiedResponse;
  } catch (error) {
    console.error('Error proxying resource:', error);
    return NextResponse.json(
      { success: false, error: `Failed to proxy resource: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
