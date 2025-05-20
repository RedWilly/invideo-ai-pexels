'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { VideoData } from '@/lib/types/video';

interface VideoContextType {
  videoData: VideoData | null;
  setVideoData: (data: VideoData) => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export function VideoProvider({ children }: { children: ReactNode }) {
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  
  return (
    <VideoContext.Provider value={{ videoData, setVideoData }}>
      {children}
    </VideoContext.Provider>
  );
}

export function useVideoContext() {
  const context = useContext(VideoContext);
  if (context === undefined) {
    throw new Error('useVideoContext must be used within a VideoProvider');
  }
  return context;
}
