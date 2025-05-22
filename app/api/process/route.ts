import { NextRequest, NextResponse } from 'next/server';

// This is needed for API routes in Next.js
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('Received POST request to /api/process');
    
    // Parse the request body
    const body = await request.json();
    console.log('Request body:', body);

    // Validate the request body
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

    // Prepare the request to the backend service
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API || 'http://localhost:3001';
    const backendEndpoint = `${backendUrl}/process-script`;

    console.log(`Sending request to backend at ${backendEndpoint}`);

    // Format the request to match the backend's expected structure
    const backendRequest = {
      script: body.script,
      tags: body.tags || '',
      voiceId: body.voiceId,
      options: {
        generateVoiceOver: true,
        syncAudio: true
      }
    };

    console.log('Backend request:', backendRequest);

    // Send the request to the backend service
    const backendResponse = await fetch(backendEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendRequest),
    });

    console.log(`Backend response status: ${backendResponse.status}`);

    // Check if the response is successful (201 Created is expected for job creation)
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend error response:', errorText);
      throw new Error(`Backend service returned ${backendResponse.status}: ${errorText}`);
    }

    // The response should now contain a jobId instead of the full video data
    const jobResponse = await backendResponse.json();
    console.log('Backend job response:', jobResponse);
    
    if (!jobResponse.jobId) {
      throw new Error('Backend did not return a valid jobId');
    }
    
    // Return the job response with the jobId
    console.log(`Successfully received jobId: ${jobResponse.jobId}`);
    return NextResponse.json(jobResponse);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { success: false, error: `Failed to process request: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
