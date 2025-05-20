'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Play, Pause, Volume2, Download, Share2 } from 'lucide-react';
import { DiffusionStudioService } from '@/lib/services/diffusion-studio';
import { VideoData, VideoSection, VideoPoint } from '@/lib/types/video';

interface VideoPlayerProps {
  videoData: VideoData;
}

export function VideoPlayer({ videoData }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const playerRef = useRef<HTMLDivElement>(null);
  const diffusionStudioRef = useRef<DiffusionStudioService | null>(null);

  // Calculate total duration from all sections
  const totalDuration = videoData.data.reduce((sectionAcc, section) => {
    return sectionAcc + section.points.reduce(
      (pointAcc, point) => pointAcc + (point.endTime - point.startTime),
      0
    );
  }, 0);

  // Initialize Diffusion Studio service
  useEffect(() => {
    if (!videoData || !videoData.success || !videoData.data.length) return;
    
    // Create a flag to track if the effect is still mounted
    let isMounted = true;
    let initAttempts = 0;
    const maxAttempts = 5;
    
    const waitForPlayerRef = () => {
      return new Promise<HTMLDivElement>((resolve, reject) => {
        // Check if player ref is already available
        if (playerRef.current) {
          console.log('Player container is immediately available');
          return resolve(playerRef.current);
        }
        
        // Otherwise, poll for it
        let attempts = 0;
        const maxPollingAttempts = 10;
        const interval = setInterval(() => {
          attempts++;
          
          if (playerRef.current) {
            clearInterval(interval);
            console.log(`Player container found after ${attempts} attempts`);
            resolve(playerRef.current);
          } else if (attempts >= maxPollingAttempts) {
            clearInterval(interval);
            reject(new Error(`Player container not found after ${maxPollingAttempts} attempts`));
          }
        }, 100);
      });
    };
    
    const initDiffusionStudio = async () => {
      try {
        initAttempts++;
        setIsLoading(true);
        console.log(`Initializing Diffusion Studio (attempt ${initAttempts}/${maxAttempts})`);
        
        // Initialize Diffusion Studio service
        const diffusionStudio = new DiffusionStudioService();
        diffusionStudioRef.current = diffusionStudio;
        
        // Process all video data first
        console.log('Processing video data...');
        await diffusionStudio.processVideoData(videoData);
        console.log('Video data processed successfully');
        
        // Wait for the player container to be available
        console.log('Waiting for player container...');
        const playerContainer = await waitForPlayerRef();
        console.log('Player container found, attaching player...');
        
        // Let the service create and attach the player
        diffusionStudio.attachPlayer(playerContainer);
        console.log('Player attached successfully');
        
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error initializing Diffusion Studio:', err);
        
        // Retry initialization if we haven't exceeded max attempts
        if (initAttempts < maxAttempts && isMounted) {
          console.log(`Retrying initialization (${initAttempts}/${maxAttempts})...`);
          setTimeout(initDiffusionStudio, 500);
          return;
        }
        
        if (isMounted) {
          setError(`Failed to initialize video player: ${err instanceof Error ? err.message : String(err)}`);
          setIsLoading(false);
        }
      }
    };
    
    initDiffusionStudio();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (diffusionStudioRef.current) {
        console.log('Cleaning up Diffusion Studio');
        // Pause playback if it's playing
        if (isPlaying) {
          diffusionStudioRef.current.pause();
        }
      }
    };
  }, [videoData]);

  // Handle time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && diffusionStudioRef.current) {
        // Get current time from Diffusion Studio
        const composition = diffusionStudioRef.current.getComposition();
        if (composition) {
          const time = composition.currentTime * 1000; // Convert to ms
          setCurrentTime(time);
        }
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlayPause = () => {
    if (diffusionStudioRef.current) {
      if (isPlaying) {
        diffusionStudioRef.current.pause();
      } else {
        diffusionStudioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    if (diffusionStudioRef.current) {
      diffusionStudioRef.current.seekTo(newTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    // Set volume in Diffusion Studio if applicable
    // This might require additional implementation in the DiffusionStudioService
  };

  const handleDownload = async () => {
    if (diffusionStudioRef.current) {
      try {
        const filename = `video_${Date.now()}.mp4`;
        await diffusionStudioRef.current.renderToFile(filename);
        alert(`Video downloaded as ${filename}`);
      } catch (err) {
        console.error('Error downloading video:', err);
        alert('Failed to download video');
      }
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video bg-black">
        {/* Always render the player container, but hide it when loading or error */}
        <div 
          ref={playerRef} 
          className="w-full h-full"
          style={{ display: (!isLoading && !error) ? 'block' : 'none' }}
        ></div>
        
        {/* Show loading spinner when loading */}
        {isLoading && (
          <div className="w-full h-full absolute top-0 left-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Show error message when there's an error */}
        {error && (
          <div className="w-full h-full absolute top-0 left-0 flex items-center justify-center text-red-500">
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Video Controls */}
      <div className="p-4 space-y-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlayPause}
            disabled={isLoading || !!error}
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
              onValueChange={handleSeek}
              disabled={isLoading || !!error}
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
              disabled={isLoading || !!error}
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button 
            variant="outline" 
            className="space-x-2"
            disabled={isLoading || !!error}
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </Button>
          <Button 
            className="space-x-2"
            onClick={handleDownload}
            disabled={isLoading || !!error}
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
