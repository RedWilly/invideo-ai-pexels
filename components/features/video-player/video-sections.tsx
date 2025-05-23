'use client';

import { Card } from '@/components/ui/card';
import { VideoPoint } from '@/lib/types/video';

interface VideoSectionsProps {
  videoPoints: VideoPoint[];
  onSectionSelect?: (index: number) => void;
}

export function VideoSections({ videoPoints, onSectionSelect }: VideoSectionsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Video Sections</h2>
      {videoPoints.map((point, index) => (
        <Card 
          key={index} 
          className="p-4 hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => onSectionSelect && onSectionSelect(index)}
        >
          <div className="flex items-center space-x-4">
            <img
              src={point.videoThumbnail}
              alt={`Thumbnail ${index + 1}`}
              className="w-32 h-20 object-cover rounded"
            />
            <div>
              <p className="font-medium">{point.text}</p>
              <p className="text-sm text-muted-foreground">
                {formatTime(point.startTime)}s - {formatTime(point.endTime)}s
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Helper function to format time in a more readable format
// function formatTime(timeInMilliseconds: number): string {
//   // Convert milliseconds to seconds
//   const totalSeconds = Math.floor(timeInMilliseconds / 1000);
//   const minutes = Math.floor(totalSeconds / 60);
//   const seconds = Math.floor(totalSeconds % 60);
//   return `${minutes}:${seconds.toString().padStart(2, '0')}`;
// }
function formatTime(timeInMilliseconds: number): string {
  const totalSeconds = Math.floor(timeInMilliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    // Show hh:mm:ss
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  } else {
    // Show mm:ss
    return [
      minutes.toString(),
      seconds.toString().padStart(2, '0')
    ].join(':');
  }
}

