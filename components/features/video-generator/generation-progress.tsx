'use client';

import { Play, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { DialogContent, DialogTitle } from '@/components/ui/dialog';
import { JobStatus } from '@/lib/services/websocket-service';

interface GenerationProgressProps {
  progress: number;
  status?: JobStatus;
  message?: string;
  error?: string;
}

export function GenerationProgress({ progress, status = 'processing', message, error }: GenerationProgressProps) {
  // Determine the icon and message based on status
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-8 w-8 text-red-500" />;
      case 'queued':
        return <Loader2 className="h-8 w-8 text-primary animate-spin" />;
      case 'processing':
      default:
        return <Play className="h-8 w-8 text-primary" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'completed':
        return 'Video Generation Complete';
      case 'failed':
        return 'Video Generation Failed';
      case 'queued':
        return 'Video Generation Queued';
      case 'processing':
      default:
        return 'Generating Your Video';
    }
  };

  const getStatusMessage = () => {
    if (error) {
      return error;
    }
    
    if (message) {
      return message;
    }
    
    switch (status) {
      case 'completed':
        return 'Your video has been successfully generated!';
      case 'failed':
        return 'There was an error generating your video. Please try again.';
      case 'queued':
        return 'Your video is in the queue and will be processed soon...';
      case 'processing':
      default:
        return `Please wait while we create your video... (${progress}%)`;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-100';
      case 'failed':
        return 'bg-red-100';
      case 'queued':
      case 'processing':
      default:
        return 'bg-primary/10';
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      {/* Empty div to prevent close button from appearing */}
      <div className="absolute right-4 top-4"></div>
      <DialogTitle>Video Generation</DialogTitle>
      <div className="flex flex-col items-center space-y-4">
        <div className={`w-16 h-16 rounded-full ${getStatusColor()} flex items-center justify-center`}>
          {getStatusIcon()}
        </div>
        <h2 className="text-xl font-semibold">{getStatusTitle()}</h2>
        <Progress 
          value={status === 'completed' ? 100 : progress} 
          className="w-full"
        />
        <p className="text-sm text-center text-muted-foreground">
          {getStatusMessage()}
        </p>
      </div>
    </DialogContent>
  );
}
