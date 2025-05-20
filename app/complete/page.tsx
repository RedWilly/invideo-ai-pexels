'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Import our modular components
import { PageContainer } from '@/components/layout';
import { VideoPlayer, VideoSections } from '@/components/features/video-player';
import { VideoData } from '@/lib/types/video';
import { useVideoContext } from '@/lib/context/video-context';

// Using shared types from lib/types/video.ts

export default function Complete() {
  const router = useRouter();
  const { videoData } = useVideoContext();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if we have video data in context
  useEffect(() => {
    // If no video data, redirect back to script2vd page
    if (!videoData) {
      console.log('No video data found, redirecting to script input');
      router.push('/script2vd');
      return;
    }
    
    // If we have video data, we're ready to display it
    if (videoData.success && videoData.data && videoData.data.length > 0) {
      console.log('Video data loaded from context:', videoData);
      setIsLoading(false);
    } else {
      setError('Invalid video data format');
      setIsLoading(false);
    }
  }, [videoData, router]);
  
  // Handle section selection
  const handleSectionSelect = (index: number) => {
    console.log(`Selected section ${index}`);
    // In a real implementation, this would seek the video to the selected section
  };

  return (
    <PageContainer>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="mt-4 text-lg">Loading your video...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          <VideoPlayer videoData={videoData!} />

          <div className="mt-8">
            <VideoSections 
              videoPoints={videoData!.data.flatMap(section => section.points)} 
              onSectionSelect={handleSectionSelect} 
            />
          </div>
        </>
      )}
    </PageContainer>
  );
}