'use client';

// Import data from mockdata.json
import mockData from '@/mockdata.json';

// Import our modular components
import { PageContainer } from '@/components/layout';
import { VideoPlayer, VideoSections } from '@/components/features/video-player';

export default function Complete() {
  // Get the video points from the first section of the mockData
  const videoPoints = mockData.data[0].points;
  const audioUrl = mockData.data[0].audioUrl;
  
  // Handle section selection
  const handleSectionSelect = (index: number) => {
    console.log(`Selected section ${index}`);
    // In a real implementation, this would seek the video to the selected section
  };

  return (
    <PageContainer>
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
    </PageContainer>
  );
}