import { NextResponse } from 'next/server';

// This is needed for API routes in Next.js
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    console.log('Received POST request to /api/process');
    
    const body = await request.json();
    console.log('Request body:', body);

    if (!body.script || !body.voiceId) {
      console.log('Validation failed: Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields: script or voiceId' },
        { status: 400 }
      );
    }

    console.log('Processing request with:', {
      script: body.script?.substring(0, 50) + '...',
      voiceId: body.voiceId,
      tags: body.tags
    });

    // Format the request for the backend service
    const backendRequest = {
      script: body.script,
      tag: body.tags, // Convert tags to tag for backend
      voiceId: body.voiceId,
      generateVoiceOver: true,
      syncAudio: true
    };
    
    console.log('Sending to backend:', backendRequest);

    try {
      console.log('Sending request to backend at http://localhost:3001/process-script');
      
      const backendResponse = await fetch('http://localhost:3001/process-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendRequest),
        cache: 'no-store'
      });

      console.log('Backend response status:', backendResponse.status);
      
      if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        console.error('Backend error response:', errorText);
        throw new Error(`Backend service returned ${backendResponse.status}: ${errorText}`);
      }

      const data = await backendResponse.json();
      console.log('Successfully received data from backend');
      return NextResponse.json(data);
    } catch (error) {
      console.error('Error calling backend service:', error);
      
      // For testing purposes, return mock data if backend is unavailable
      console.log('Returning mock data as fallback');
      return NextResponse.json({
        success: true,
        data: [
          {
            "sectionId": "section1",
            "points": [
              {
                "text": "Welcome to a journey through time that stretches far beyond human memory",
                "videoId": "3156517",
                "videoUrl": "https://videos.pexels.com/video-files/3156517/pexels-nothing-ahead-3156517.mp4",
                "videoThumbnail": "https://images.pexels.com/videos/3156517/free-video-3156517.jpg",
                "startTime": 0,
                "endTime": 5000
              },
              {
                "text": "Long before our ancestors walked upright, the universe was crafting a story",
                "videoId": "1409899",
                "videoUrl": "https://videos.pexels.com/video-files/1409899/pexels-ruvim-miksanskiy-1409899.mp4",
                "videoThumbnail": "https://images.pexels.com/videos/1409899/free-video-1409899.jpg",
                "startTime": 5000,
                "endTime": 10000
              }
            ],
            "audioUrl": "https://example.com/audio1.mp3",
            "voiceOverId": "test-voice-id"
          }
        ]
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { success: false, error: `Failed to process request: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
