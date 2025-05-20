'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Play, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { storageService } from '@/lib/services/storage-service';
import { VideoData } from '@/lib/types/video';
import { useVideoContext } from '@/lib/contexts/video-context';
import { formatDistanceToNow } from 'date-fns';

export default function MyVideosPage() {
  const [videos, setVideos] = useState<Array<{
    uniqueId: string;
    videoData: VideoData;
    title: string;
    timestamp: number;
    thumbnail: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { setVideoData } = useVideoContext();

  useEffect(() => {
    const loadVideos = async () => {
      try {
        setLoading(true);
        const allVideos = await storageService.getAllVideos();
        setVideos(allVideos);
      } catch (error) {
        console.error('Error loading videos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, []);

  const handlePlayVideo = (video: { videoData: VideoData }) => {
    // Set the video data in context and navigate to the complete page
    setVideoData(video.videoData);
    router.push('/complete');
  };

  const handleDeleteVideo = async (uniqueId: string) => {
    try {
      await storageService.deleteVideo(uniqueId);
      // Update the videos list
      setVideos(videos.filter(video => video.uniqueId !== uniqueId));
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">My Videos</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold mb-4">No videos yet</h2>
          <p className="text-muted-foreground mb-8">
            Create your first video to see it here.
          </p>
          <Button onClick={() => router.push('/script2vd')}>Create Video</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <Card key={video.uniqueId} className="overflow-hidden">
              <div className="aspect-video bg-black relative">
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <span className="text-muted-foreground">No thumbnail</span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                  onClick={() => handleDeleteVideo(video.uniqueId)}
                >
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-1">{video.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Created {formatDate(video.timestamp)}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  className="w-1/2 mr-2"
                  onClick={() => handlePlayVideo(video)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Play
                </Button>
                <Button
                  variant="default"
                  className="w-1/2 ml-2"
                  onClick={() => handlePlayVideo(video)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
