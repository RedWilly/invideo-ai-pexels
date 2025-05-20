/**
 * Shared video types for the application
 */

export interface VideoPoint {
  text: string;
  videoId: string;
  videoUrl: string;
  videoThumbnail: string;
  startTime: number;
  endTime: number;
}

export interface VideoSection {
  sectionId: string;
  points: VideoPoint[];
  audioUrl: string;
  voiceOverId: string;
}

export interface VideoData {
  success: boolean;
  data: VideoSection[];
}
