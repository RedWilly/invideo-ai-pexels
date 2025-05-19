'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Play, Pause, Volume2, Download, Share2 } from 'lucide-react';

interface VideoPoint {
  text: string;
  videoId: string;
  videoThumbnail: string;
  startTime: number;
  endTime: number;
}

interface VideoPlayerProps {
  videoPoints: VideoPoint[];
  audioUrl?: string;
}

export function VideoPlayer({ videoPoints, audioUrl }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);

  const totalDuration = videoPoints.reduce(
    (acc, point) => acc + (point.endTime - point.startTime),
    0
  );

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video bg-black">
        {/* Video element will be implemented with actual video URLs */}
        <div className="w-full h-full flex items-center justify-center text-white">
          <img 
            src={videoPoints[0]?.videoThumbnail} 
            alt="Video thumbnail" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Play className="h-16 w-16" />
          </div>
        </div>
      </div>

      {/* Video Controls */}
      <div className="p-4 space-y-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </Button>

          <div className="flex-1">
            <Slider
              value={[currentTime]}
              max={totalDuration}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Volume2 className="h-4 w-4" />
            <Slider
              value={[volume]}
              max={1}
              step={0.1}
              className="w-24"
              onValueChange={handleVolumeChange}
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" className="space-x-2">
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </Button>
          <Button className="space-x-2">
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
