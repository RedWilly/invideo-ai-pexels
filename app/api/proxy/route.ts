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
  // Get the URL from the query parameters
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

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
    
    // Determine content type based on URL if not provided
    if (!contentType || contentType === 'application/octet-stream') {
      if (url.endsWith('.mp3') || url.endsWith('.m4a')) {
        contentType = 'audio/mpeg';
      } else if (url.endsWith('.mp4')) {
        contentType = 'video/mp4';
      } else if (url.endsWith('.webm')) {
        contentType = 'video/webm';
      } else if (url.endsWith('.jpg') || url.endsWith('.jpeg')) {
        contentType = 'image/jpeg';
      } else if (url.endsWith('.png')) {
        contentType = 'image/png';
      } else {
        contentType = 'application/octet-stream';
      }
    }
    
    console.log(`Proxying ${url} with content type: ${contentType}`);
    
    // Get the resource as an array buffer
    const buffer = await response.arrayBuffer();
    
    // Create a new response with the buffer and appropriate headers
    const proxiedResponse = new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400',
      },
    });
    
    return proxiedResponse;
  } catch (error) {
    console.error('Error proxying resource:', error);
    return NextResponse.json(
      { success: false, error: `Failed to proxy resource: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
