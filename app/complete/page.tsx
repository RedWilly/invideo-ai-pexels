'use client';

import { useState, useEffect } from 'react';

// Import our modular components
import { PageContainer } from '@/components/layout';
import { VideoPlayer, VideoSections } from '@/components/features/video-player';

interface VideoPoint {
  text: string;
  videoId: string;
  videoThumbnail: string;
  startTime: number;
  endTime: number;
}

interface VideoSection {
  sectionId: string;
  points: VideoPoint[];
  audioUrl: string;
  voiceOverId: string;
}

interface ApiResponse {
  success: boolean;
  data: VideoSection[];
}

export default function Complete() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoPoints, setVideoPoints] = useState<VideoPoint[]>([]);
  const [audioUrl, setAudioUrl] = useState<string>('');
  
  // Fetch data from the API when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/process');
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data: ApiResponse = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
          setVideoPoints(data.data[0].points);
          setAudioUrl(data.data[0].audioUrl);
        } else {
          throw new Error('No video data available');
        }
      } catch (err) {
        console.error('Error fetching video data:', err);
        setError('Failed to load video data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
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
          <VideoPlayer 
            videoPoints={videoPoints} 
            audioUrl={audioUrl} 
          />

          <div className="mt-8">
            <VideoSections 
              videoPoints={videoPoints} 
              onSectionSelect={handleSectionSelect} 
            />
          </div>
        </>
      )}
    </PageContainer>
  );
}