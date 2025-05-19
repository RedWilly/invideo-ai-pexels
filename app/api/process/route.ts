import { NextResponse } from 'next/server';
import mockData from '@/mockdata.json';

export async function GET() {
  // Return the mockdata as JSON
  return NextResponse.json(mockData);
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // In a real application, you would process the script here
    // For now, we'll just return the mockdata
    
    // You could add some delay to simulate processing
    // await new Promise(resolve => setTimeout(resolve, 2000));
    
    return NextResponse.json({
      success: true,
      data: mockData.data,
      requestData: body // Echo back the request data for debugging
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
